import { TypeVar, TypeFuncApp, MonoType, PolyType, Context, Expr, Var, App, Abs, Let, CharLiteral, NumberLiteral, typeUtils, Response, TypeResult, TypeInferenceError, Substitution, inst, unify, apply, combine, generalise } from 'language'

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
            issuePosition: (e.name == TypeInferenceError.name && e.expr) ? e.expr.pos : expr.pos,
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
            const err = new TypeInferenceError('`' + expr.name + '` is not in scope', expr);
            throw err;
        }
        const instantiatedType = inst(type, freshTypeName);

        logger('We can look up the variable `' + expr.toString() + '` and find it has type `' + type.toString() + '`' + (type.quantifiedVars.length ? '\nWe instantiate this type with fresh type variables to get `' + instantiatedType.toString() + '`' : ''), highlight(expr));
        
        return [instantiatedType, {}];
    }

    if (expr instanceof App) {
        const [funcType, funcSubstitution] = _infer(expr.func, ctx, freshTypeName, logger);
        const [argType, argSubstitution] = _infer(expr.arg, apply(funcSubstitution, ctx), freshTypeName, logger);
        const t = new TypeVar(freshTypeName());

        // Give an easier to read and understand message if we can, otherwise default to the more general case
        const firstPartOfLogMessage = (funcType instanceof TypeFuncApp && funcType.constructorName == '->')
            ? 'In function application, the function must accept the expected argument type.\nBefore unification, the function has type `' + funcType.toString() + '`\n\nTherefore we unify:\nFunction accepts `' + (funcType as TypeFuncApp).args[0].toString() + '`\nArgument has type `' + argType.toString() + '`\n\n'
            : 'In function application, the function must accept the expected argument type and returns some other type.\n\nTherefore we unify:\nFunction type `' + funcType.toString() + '`\nArgument to fresh type `' + new TypeFuncApp("->", argType, t).toString() + '`\n\n';

        let unifiedSubstitution;
        try {
            unifiedSubstitution = unify(apply(argSubstitution, funcType), new TypeFuncApp("->", argType, t))
        } catch (err) {
            logger(firstPartOfLogMessage + 'However, these two types are not unifiable. We stop here as this is an error.\n\nMore details:\n' + err.message, highlight(expr));
            err.expr = expr;
            throw err;
        }
        const exprType = apply(unifiedSubstitution, t)
        logger(firstPartOfLogMessage + 'This gives the substitution `' + str(unifiedSubstitution, t.name) + '`\nAnd the function\'s return type as `' + exprType.toString() + '`', highlight(expr));
        return [exprType, combine(funcSubstitution, argSubstitution, unifiedSubstitution)]
    }

    if (expr instanceof Abs) {
        const t = new TypeVar(freshTypeName());

        logger('Our function definition binds `' + expr.param + '` in the body to the fresh type `' + t.toString() + '`', highlight(expr));

        const [bodyType, bodySubstitution] = _infer(expr.body, { ...ctx, [expr.param]: new PolyType([], t) }, freshTypeName, logger);
        const type = apply(bodySubstitution, new TypeFuncApp("->", t, bodyType));

        logger((bodySubstitution[t.name] ? 'We apply the substitution `{ ' + t.name + ' ↦ ' + bodySubstitution[t.name]!.toString() + ' }` to get the parameter\'s type `' + type.args[0].toString() + '`.\n' : '') + 'The return type is given by the function body\'s type `' + type.args[1].toString() + '`\nTherefore the overall type is `' + type.toString() + '`', highlight(expr));

        return [type, bodySubstitution]
    }

    if (expr instanceof Let) {
        const [defType, defSubstitution] = _infer(expr.def, ctx, freshTypeName, logger);
        const generalisedDefType = generalise(apply(defSubstitution, ctx), defType);

        logger('Our let statement binds `' + expr.param + '` in the body to the type `' + generalisedDefType.toString() + '`', highlight(expr));

        const [bodyType, bodySubstitution] = _infer(expr.body, { ...apply(defSubstitution, ctx), [expr.param]: generalisedDefType }, freshTypeName, logger);

        logger('Our let statement then takes its body\'s type `' + bodyType.toString() + '`', highlight(expr));
        
        return [bodyType, combine(defSubstitution, bodySubstitution)]
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

export { infer };