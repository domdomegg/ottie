import { TypeVar, TypeFuncApp, MonoType, PolyType, Context, Expr, Var, App, Abs, Let, CharLiteral, NumberLiteral, typeUtils, Response } from 'language'

class TypeInferenceError extends Error {
    expr?: Expr;

    constructor(message: string) {
        super(message);
        this.name = "TypeInferenceError";
    }
}

interface Substitution { [name: string]: MonoType | undefined }

function substitute(substitution: Substitution, arg: Context): Context {
    const context = arg;
    let mappedContext: Context = {};
    for (const key in context) {
        mappedContext[key] = apply(context[key] as PolyType, substitution);
    }
    return mappedContext;
}

/** Combines substitutions. Applies leftmost substitution first, e.g. combine(a, b).apply(e) == e.apply(a).apply(b) */
function combine(...substitutions: Substitution[]): Substitution {
    if (substitutions.length === 0) return {};
    if (substitutions.length === 1) return substitutions[0];
    if (substitutions.length > 2) return combine(substitutions[0], combine(...substitutions.slice(1)));

    const a = substitutions[0];
    const b = substitutions[1];
    let newSubstitution: Substitution = {}
    for (const key in a) {
        newSubstitution[key] = apply(a[key] as MonoType, b);
    }
    for (const key in b) {
        if (!(key in a)) {
            newSubstitution[key] = b[key];
        }
    }
    return newSubstitution;
}

function unify(type1: MonoType, type2: MonoType): Substitution {
    if (type1 instanceof TypeVar) {
        if (type2 instanceof TypeVar && type1.name == type2.name) {
            return {};
        }

        if (contains(type2, type1)) {
            throw new TypeInferenceError('Occurs check failed. `' + type1.toString() + '` occurs in `' + type2.toString() + '` so unifying them would create an infinite type.');
        }
        return { [type1.name]: type2 }
    }
    
    if (type2 instanceof TypeVar) {
        return unify(type2, type1);
    }

    if (type1 instanceof TypeFuncApp && type2 instanceof TypeFuncApp) {
        if (type1.constructorName !== type2.constructorName) {
            throw new TypeInferenceError('Could not unify types `' + type1.toString() + '` and `' + type2.toString() + '` with different constructors `' + type1.constructorName + '` and `' + type2.constructorName + '`');
        }

        if (type1.args.length !== type2.args.length) {
            throw new TypeInferenceError('Could not unify types `' + type1.toString() + '` and `' + type2.toString() + '` with different argument list lengths `' + type1.args.length + '` and `' + type2.args.length + '`');
        }

        let sub: Substitution = {};
        for (let i = 0; i < type1.args.length; i++) {
            sub = combine(sub, unify(apply(type1.args[i], sub), apply(type2.args[i], sub)));
        }
        return sub;
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

function unique<T>(xs: T[]): T[] {
    const vs: T[] = [];
    new Set(xs).forEach(x => vs.push(x));
    return vs;
}

/** a \ b */
function diff<T>(a: T[], b: T[]): T[] {
    const bset = new Set(b);
    return a.filter(v => !bset.has(v));
}

function freeVars(type: MonoType | PolyType | Context): string[] {    
    if (type instanceof PolyType) {
        return diff(freeVars(type.monoType), type.quantifiedVars);
    }

    if (type instanceof TypeVar) {
        return [type.name];
    }

    if (type instanceof TypeFuncApp) {
        return type.args.map(freeVars).reduce((acc, cur) => [...acc, ...cur], []);
    }

    if (type) {
        // type: Context
        return (Object.values(type) as PolyType[]).map(freeVars).reduce((acc, cur) => [...acc, ...cur], []);
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

function generalise(ctx: Context, type: MonoType): PolyType {
    return new PolyType(unique(diff(freeVars(type), freeVars(ctx))), type);
}

interface TypeResult {
    type: MonoType; // The overall type of the expression
    steps: { message: string, ast: Expr }[]; // An array of steps showing the derivation
}

function infer(expr: Expr): MonoType;
function infer(expr: Expr, forResponse: true, ctx?: Context): Response<TypeResult, Omit<TypeResult, 'type'>>;
function infer(expr: Expr, forResponse: boolean = false, ctx: Context = typeUtils.standardCtx): MonoType | Response<TypeResult, Omit<TypeResult, 'type'>> {
    let typeCounter = 0;
    const freshTypeName = (): string => "t" + typeCounter++;
    if (!forResponse) return _infer(expr, ctx, freshTypeName)[0];

    const steps: { message: string, ast: Expr }[] = [];
    const logger = (message: string, notes: Map<Expr, string>) => {
        steps.push({ message, ast: cloneAst(expr, notes) })
    }

    try {
        return {
            accepted: true,
            value: {
                type: _infer(expr, ctx, freshTypeName, logger)[0],
                steps
            }
        }
    } catch (e) {
        return {
            accepted: false,
            value: {
                steps
            },
            issuePosition: e.name == TypeInferenceError.name ? e.expr.pos : expr.pos,
            message: (e as Error).message
        }
    }
}

const cloneAst = (expr: Expr, notes: Map<Expr, string>): Expr => {
    if (expr instanceof CharLiteral) return new CharLiteral(expr.value, expr.pos, notes.get(expr));
    if (expr instanceof NumberLiteral) return new NumberLiteral(expr.value, expr.pos, notes.get(expr));
    if (expr instanceof Var) return new Var(expr.name, expr.pos, notes.get(expr));
    if (expr instanceof App) return new App(cloneAst(expr.func, notes), cloneAst(expr.arg, notes), expr.pos, notes.get(expr));
    if (expr instanceof Abs) return new Abs(expr.param, cloneAst(expr.body, notes), expr.pos, notes.get(expr));
    if (expr instanceof Let) return new Let(expr.param, cloneAst(expr.def, notes), cloneAst(expr.body, notes), expr.pos, notes.get(expr));
    
    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

const highlight = (expr: Expr): Map<Expr, string> => {
    const notes = new Map();
    notes.set(expr, 'highlight')
    return notes;
}

const str = (substitution: Substitution, except?: string): string => ('{ ' + Object.keys(substitution).filter(k => k !== except).map(k => k + ' ↦ ' + substitution[k]!.toString()).join(', ') + ' }').replace('{  }', '{}');

function _infer(expr: Expr, ctx: Context, freshTypeName: () => string, logger: (message: string, notes: Map<Expr, string>) => void = () => {}): [MonoType, Substitution] {
    if (expr instanceof CharLiteral) {
        logger('We know the primitive `' + expr.toString() + '` is a `Char`', highlight(expr));
        return [inst(new PolyType([], new TypeFuncApp('Char')), freshTypeName), {}];
    }

    if (expr instanceof NumberLiteral) {
        logger('We know the primitive `' + expr.toString() + '` is an `Int`', highlight(expr));
        return [inst(new PolyType([], new TypeFuncApp('Int')), freshTypeName), {}];
    }

    if (expr instanceof Var) {
        const type = ctx[expr.name]
        if (!type) {
            logger('We try to look up the variable `' + expr.toString() + '` but find it is not in scope. We stop here as this is an error.', highlight(expr));
            const err = new TypeInferenceError('`' + expr.name + '` is not in scope');
            err.expr = expr;
            throw err;
        }
        const instantiatedType = inst(type, freshTypeName);

        logger('We can look up the variable `' + expr.toString() + '` and find it has type `' + type.toString() + (type.quantifiedVars.length ? '`\nWe instatiate this type with fresh type variables to get `' + instantiatedType.toString() + '`' : ''), highlight(expr));
        
        return [instantiatedType, {}];
    }

    if (expr instanceof App) {
        const [funcType, funcSubstitution] = _infer(expr.func, ctx, freshTypeName, logger);
        const [argType, argSubstitution] = _infer(expr.arg, substitute(funcSubstitution, ctx), freshTypeName, logger);
        const t = new TypeVar(freshTypeName());

        // Give an easier to read and understand message if we can, otherwise default to the more general case
        let firstPartOfLogMessage = (funcType instanceof TypeFuncApp && funcType.constructorName == '->')
            ? 'In function application, the function must accept the expected argument type.\nBefore unification, the function has type `' + funcType.toString() + '`\n\nTherefore we unify:\nFunction accepts `' + (funcType as TypeFuncApp).args[0].toString() + '`\nArgument has type `' + argType.toString() + '`\n\n'
            : 'In function application, the function must accept the expected argument type and returns some other type.\n\nTherefore we unify:\nFunction type `' + funcType.toString() + '`\nArgument to fresh type `' + new TypeFuncApp("->", argType, t).toString() + '`\n\n';

        let unifiedSubstitution;
        try {
            unifiedSubstitution = unify(apply(funcType, argSubstitution), new TypeFuncApp("->", argType, t))
        } catch (err) {
            logger(firstPartOfLogMessage + 'However, these two types are not unifiable. We stop here as this is an error.\n\nMore details:\n' + err.message, highlight(expr));
            err.expr = expr;
            throw err;
        }
        const exprType = apply(t, unifiedSubstitution)
        logger(firstPartOfLogMessage + 'This gives the substitution `' + str(unifiedSubstitution, t.name) + '`\nAnd the function\'s return type as `' + exprType.toString() + '`', highlight(expr));
        return [exprType, combine(funcSubstitution, argSubstitution, unifiedSubstitution)]
    }

    if (expr instanceof Abs) {
        const t = new TypeVar(freshTypeName());

        logger('Our function definition binds `' + expr.param + '` in the body to the fresh type `' + t.toString() + '`', highlight(expr));

        const [bodyType, bodySubstitution] = _infer(expr.body, { ...ctx, [expr.param]: new PolyType([], t) }, freshTypeName, logger);
        const type = apply(new TypeFuncApp("->", t, bodyType), bodySubstitution);

        logger((bodySubstitution[t.name] ? 'We apply the substitution `{ ' + t.name + ' ↦ ' + bodySubstitution[t.name]!.toString() + ' }` to get the parameter\'s type `' + type.args[0].toString() + '`.\n' : '') + 'The return type is given by the function body\'s type `' + type.args[1].toString() + '`\nTherefore the overall type is `' + type.toString() + '`', highlight(expr));

        return [type, bodySubstitution]
    }

    if (expr instanceof Let) {
        const [defType, defSubstitution] = _infer(expr.def, ctx, freshTypeName, logger);
        const generalisedDefType = generalise(substitute(defSubstitution, ctx), defType);

        logger('Our let statement binds `' + expr.param + '` in the body to the type `' + generalisedDefType.toString() + '`', highlight(expr));

        const [bodyType, bodySubstitution] = _infer(expr.body, { ...substitute(defSubstitution, ctx), [expr.param]: generalisedDefType }, freshTypeName, logger);

        logger('Our let statement then takes its body\'s type `' + bodyType.toString() + '`', highlight(expr));
        
        return [bodyType, combine(defSubstitution, bodySubstitution)]
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

function inst(type: PolyType, freshTypeName: () => string): MonoType;
function inst(type: MonoType, freshTypeName: () => string, from: string[], to: string[]): MonoType;
function inst(type: MonoType | PolyType, freshTypeName: () => string, from: string[] = [], to: string[] = []): MonoType {
    if (type instanceof TypeVar) {
        const i = from.indexOf(type.name);
        return (i === -1) ? type : new TypeVar(to[i]);
    }

    if (type instanceof TypeFuncApp) {
        return new TypeFuncApp(type.constructorName, ...type.args.map(arg => inst(arg, freshTypeName, from, to)));
    }

    if (type instanceof PolyType) {
        return inst(type.monoType, freshTypeName, type.quantifiedVars, type.quantifiedVars.map(freshTypeName));
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

function apply<T extends MonoType | PolyType>(type: T, substitution: Substitution): T;
function apply(type: MonoType | PolyType, substitution: Substitution): MonoType | PolyType {
    if (type instanceof TypeVar) {
        return type.name in substitution ? (substitution[type.name] as MonoType) : type;
    }

    if (type instanceof TypeFuncApp) {
        return new TypeFuncApp(type.constructorName, ...type.args.map(arg => apply(arg, substitution)));
    }

    if (type instanceof PolyType) {
        return new PolyType(type.quantifiedVars, apply(type.monoType, substitution));
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

function contains(type: MonoType | PolyType, other: TypeVar): boolean {
    if (type instanceof TypeVar) {
        return type.name == other.name;
    }

    if (type instanceof TypeFuncApp) {
        return type.args.some(arg => contains(arg, other));
    }

    if (type instanceof PolyType) {
        return contains(type.monoType, other) && !type.quantifiedVars.includes(other.name)
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

export { TypeInferenceError, Context, Substitution, substitute, combine, unify, infer, apply };