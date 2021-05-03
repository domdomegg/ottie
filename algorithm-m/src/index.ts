import { TypeVar, TypeFuncApp, MonoType, PolyType, Context, Expr, Var, App, Abs, Let, CharLiteral, NumberLiteral, typeUtils, Response, TypeResult, TypeInferenceError, Substitution, inst, unify, apply, combine, generalise } from 'language'

function infer(expr: Expr): MonoType;
function infer(expr: Expr, forResponse: true, ctx?: Context): Response<TypeResult, Omit<TypeResult, 'type'>>;
function infer(expr: Expr, forResponse: boolean = false, ctx: Context = typeUtils.standardCtx): MonoType | Response<TypeResult, Omit<TypeResult, 'type'>> {
    let typeCounter = 0;
    const freshTypeName = (): string => "t" + typeCounter++;
    const rootType = new TypeVar(freshTypeName());
    if (!forResponse) {
        const s = _infer(expr, ctx, rootType, freshTypeName);
        return s[rootType.name]!;
    }

    const steps: { message: string, ast: Expr }[] = [];
    const logger = (message: string, notes: Map<Expr, string>) => {
        steps.push({ message, ast: cloneAst(expr, notes) })
    }
    logger('We start algorithm M by assigning the root node a fresh type `' + rootType.toString() + '`', highlight(expr));

    try {
        const s = _infer(expr, ctx, rootType, freshTypeName, logger);
        // We'll already have just logged str(s), so probably not too much point doing it again
        logger('We can extract the root type `' + rootType.toString() + '` from the most recent substitution to get expression\'s type as `' + s[rootType.name]!.toString() + '`', highlight(expr));
        return {
            accepted: true,
            value: {
                type: s[rootType.name]!,
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

function _infer(expr: Expr, ctx: Context, type: MonoType, freshTypeName: () => string, logger: (message: string, notes: Map<Expr, string>) => void = () => {}): Substitution {
    if (expr instanceof CharLiteral) {
        const firstPartOfLogMessage = 'We expect the type to unify with `' + type.toString() + '`, and we know the primitive `' + expr.toString() + '` is a `Char`.'
        try {
            const substitution = unify(type, inst(new PolyType([], new TypeFuncApp('Char')), freshTypeName));
            logger(firstPartOfLogMessage + '\nThese unify, giving the substitution `' + str(substitution) + '`', highlight(expr));
            return substitution;
        } catch (err) {
            logger(firstPartOfLogMessage + '\nHowever, these two types are not unifiable. We stop here as this is an error.\n\nMore details:\n' + err.message, highlight(expr));
            err.expr = expr;
            throw err;
        }
    }

    if (expr instanceof NumberLiteral) {
        const firstPartOfLogMessage = 'We expect the type to unify with `' + type.toString() + '`, and we know the primitive `' + expr.toString() + '` is an `Int`.'
        try {
            const substitution = unify(type, inst(new PolyType([], new TypeFuncApp('Int')), freshTypeName));
            logger(firstPartOfLogMessage + '\nThese unify, giving the substitution `' + str(substitution) + '`', highlight(expr));
            return substitution;
        } catch (err) {
            logger(firstPartOfLogMessage + '\nHowever, these two types are not unifiable. We stop here as this is an error.\n\nMore details:\n' + err.message, highlight(expr));
            err.expr = expr;
            throw err;
        }
    }

    if (expr instanceof Var) {
        const varType = ctx[expr.name]
        if (!varType) {
            logger('We try to look up the variable `' + expr.toString() + '` but find it is not in scope. We stop here as this is an error.', highlight(expr));
            const err = new TypeInferenceError('`' + expr.name + '` is not in scope', expr);
            throw err;
        }
        const instantiatedType = inst(varType, freshTypeName);

        const firstPartOfLogMessage = 'We expect this variable to unify with `' + type.toString() + '`\nWe look up the variable `' + expr.toString() + '` and find it has type `' + varType.toString() + '`' + (varType.quantifiedVars.length ? '\nWe instantiate this type with fresh type variables to get `' + instantiatedType.toString() + '`' : '');
        try {
            const substitution = unify(type, instantiatedType);
            logger(firstPartOfLogMessage + '\nThese unify, giving the substitution `' + str(substitution) + '`', highlight(expr));
            return substitution;
        } catch (err) {
            logger(firstPartOfLogMessage + '\nHowever, these two types are not unifiable. We stop here as this is an error.\n\nMore details:\n' + err.message, highlight(expr));
            err.expr = expr;
            throw err;
        }
    }

    if (expr instanceof App) {
        const beta = new TypeVar(freshTypeName());
        const funcSubstitution = _infer(expr.func, ctx, new TypeFuncApp('->', beta, type), freshTypeName, logger);
        const argSubstitution = _infer(expr.arg, apply(funcSubstitution, ctx), apply(funcSubstitution, beta), freshTypeName, logger);
        const t = new TypeVar(freshTypeName());

        const combinedSubstitution = combine(funcSubstitution, argSubstitution);
        logger('As the argument unifies with the function definition the function application is valid, giving a combined substitution of `' + str(combinedSubstitution) +'`', highlight(expr));
        return combinedSubstitution;
    }

    if (expr instanceof Abs) {
        const beta1 = new TypeVar(freshTypeName());
        const beta2 = new TypeVar(freshTypeName());
        const functionType = new TypeFuncApp('->', beta1, beta2);

        const firstPartOfLogMessage = 'We expect this function definition to unify with a fresh function type `' + functionType.toString()  + '` to unify with `' + type.toString() + '`';
        let s1: Substitution;
        try {
            s1 = unify(type, functionType);
            logger(firstPartOfLogMessage + '\nThese unify, giving `' + str(s1) + '`\nWe next will unify the body with `' + beta2.toString() + '`', highlight(expr));
        } catch (err) {
            logger(firstPartOfLogMessage + '\nHowever, these two types are not unifiable. We stop here as this is an error.\n\nMore details:\n' + err.message, highlight(expr));
            err.expr = expr;
            throw err;
        }
        const s2 = _infer(expr.body, { ...apply(s1, ctx), [expr.param]: new PolyType([], apply(s1, beta1)) }, apply(s1, beta2), freshTypeName, logger);
        const combinedSubstitution = combine(s1, s2);
        logger('Combining the function and body substitutions gives `' + str(combinedSubstitution) + '`', highlight(expr));
        return combinedSubstitution;
    }

    if (expr instanceof Let) {
        const beta = new TypeVar(freshTypeName());
        logger('We create a new type variable `' + beta.toString() + '` for this let statement\'s parameter `' + expr.param + '`, then infer on the parameter and body', highlight(expr));
        const s1 = _infer(expr.def, ctx, beta, freshTypeName, logger);
        const s2 = _infer(expr.body, { ...apply(s1, ctx), [expr.param]: generalise(apply(s1, ctx), apply(s1, beta)) }, apply(s1, type), freshTypeName, logger);
        const combinedSubstitution = combine(s1, s2);
        logger('Combining the parameter and body substitutions gives `' + str(combinedSubstitution) + '`', highlight(expr));
        return combinedSubstitution;
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

export { infer };