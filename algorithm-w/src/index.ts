import { TypeVar, TypeFuncApp, MonoType, PolyType, Context, Expr, Var, App, Abs, Let, CharLiteral, NumberLiteral, typeUtils } from 'language'

class TypeInferenceError extends Error {
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
        if (contains(type2, type1)) {
            throw new TypeInferenceError('Contains/occurs check failed with ' + JSON.stringify(type1) + ' and ' + JSON.stringify(type2));
        }
        return { [type1.name]: type2 }
    }
    
    if (type2 instanceof TypeVar) {
        return unify(type2, type1);
    }

    if (type1 instanceof TypeFuncApp && type2 instanceof TypeFuncApp) {
        if (type1.constructorName !== type2.constructorName) {
            throw new TypeInferenceError('Could not unify type function applications with different constructors \'' + type1.constructorName + '\' and \'' + type2.constructorName + '\'');
        }

        if (type1.args.length !== type2.args.length) {
            throw new TypeInferenceError('Could not unify type function applications with different argument list lengths ' + JSON.stringify(type1) + ' and ' + JSON.stringify(type2));
        }

        let sub: Substitution = {};
        for (let i = 0; i < type1.args.length; i++) {
            sub = combine(unify(apply(type1.args[i], sub), apply(type2.args[i], sub)), sub);
        }
        return sub;
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

/** a \ b */
function diff<T>(a: T[], b: T[]) {
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
    return new PolyType(diff(freeVars(type), freeVars(ctx)), type);
}

function infer(expr: Expr, ctx: Context = typeUtils.standardCtx): MonoType {
    let typeCounter = 0;
    const freshTypeName = (): string => "t" + typeCounter++;

    return _infer(expr, ctx, freshTypeName)[0];
}

function _infer(expr: Expr, ctx: Context, freshTypeName: () => string): [MonoType, Substitution] {
    if (expr instanceof CharLiteral) {
        return [inst(new PolyType([], new TypeFuncApp('char')), freshTypeName), {}];
    }

    if (expr instanceof NumberLiteral) {
        return [inst(new PolyType([], new TypeFuncApp('number')), freshTypeName), {}];
    }

    if (expr instanceof Var) {
        const type = ctx[expr.name]
        if (!type) {
            throw new TypeInferenceError(expr.name + ' is not in scope');
        }
        return [inst(type, freshTypeName), {}];
    }

    if (expr instanceof App) {
        const [funcType, funcSubstitution] = _infer(expr.func, ctx, freshTypeName);
        const [argType, argSubstitution] = _infer(expr.arg, substitute(funcSubstitution, ctx), freshTypeName);
        const t = new TypeVar(freshTypeName());
        const unifiedSubstitution = unify(apply(funcType, argSubstitution), new TypeFuncApp("->", argType, t))

        return [apply(t, unifiedSubstitution), combine(funcSubstitution, argSubstitution, unifiedSubstitution)]
    }

    if (expr instanceof Abs) {
        const t = new TypeVar(freshTypeName());
        const [bodyType, bodySubstitution] = _infer(expr.body, { ...ctx, [expr.param]: new PolyType([], t) }, freshTypeName);
        return [apply(new TypeFuncApp("->", t, bodyType), bodySubstitution), bodySubstitution]
    }

    if (expr instanceof Let) {
        const [defType, defSubstitution] = _infer(expr.def, ctx, freshTypeName);
        const [bodyType, bodySubstitution] = _infer(expr.body, { ...substitute(defSubstitution, ctx), [expr.param]: generalise(substitute(defSubstitution, ctx), defType) }, freshTypeName);
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

function apply(type: MonoType, substitution: Substitution): MonoType;
function apply(type: PolyType, substitution: Substitution): PolyType;
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