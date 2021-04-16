import { TypeVar, TypeFuncApp, MonoType, PolyType, Context, Expr, Var, App, Abs, Let, CharLiteral, NumberLiteral, typeUtils, Response, TypeResult, TypeInferenceError, Substitution, inst, substitute, unify, apply, combine, generalise, freeVars } from 'language'

function unifySubtitutions(s0: Substitution, s1: Substitution): Substitution {
    // const d0 = diff(Object.keys(s0), Object.keys(s1));
    // const d1 = diff(Object.keys(s1), Object.keys(s0));
    const dn = Object.keys(s0).filter(k => k in s1);

    const t0 = Object.entries(s0).filter(([k, v]) => !(k in s1));
    const t1 = Object.entries(s1).filter(([k, v]) => !(k in s0));

    let s = t0.reduce<Substitution>((acc, cur) => { acc[cur[0]] = cur[1]; return acc; }, {});
    for (let i = 0; i < t1.length; i++) {
        const [alpha, tau] = [t1[i][0], t1[i][1]!];
        const tauPrime = apply(tau, s);
        if (freeVars(tauPrime).includes(alpha)) {
            throw new TypeInferenceError('Occurs check failed. `' + alpha.toString() + '` occurs in `' + tauPrime.toString() + '` so unifying them would create an infinite type.');
        }
        s[alpha] = tauPrime;
    }

    let v = s;
    for (let i = 0; i < dn.length; i++) {
        const beta = new TypeVar(dn[i]);
        const tau0 = apply(apply(beta, s0), v);
        const tau1 = apply(apply(beta, s1), v);
        if (freeVars(tau0).includes(dn[i])) {
            throw new TypeInferenceError('Occurs check failed. `' + dn[i].toString() + '` occurs in `' + tau0.toString() + '` so unifying them would create an infinite type.');
        }
        if (freeVars(tau1).includes(dn[i])) {
            throw new TypeInferenceError('Occurs check failed. `' + dn[i].toString() + '` occurs in `' + tau1.toString() + '` so unifying them would create an infinite type.');
        }
        v = combine(v, unify(tau0, tau1));
    }

    return v;
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

        logger('We can look up the variable `' + expr.toString() + '` and find it has type `' + type.toString() + '`' + (type.quantifiedVars.length ? '\nWe instatiate this type with fresh type variables to get `' + instantiatedType.toString() + '`' : ''), highlight(expr));
        
        return [instantiatedType, {}];
    }

    if (expr instanceof App) {
        const [funcType, funcSubstitution] = _infer(expr.func, ctx, freshTypeName, logger);
        const [argType, argSubstitution] = _infer(expr.arg, ctx, freshTypeName, logger);
        const t = new TypeVar(freshTypeName());

        // Give an easier to read and understand message if we can, otherwise default to the more general case
        const firstPartOfLogMessage1 = 'We first determine the function and argument type separately as `' + funcType.toString() + '` and `' + argType.toString() + '` respectively.\nFor these we have substitutions `' + str(funcSubstitution) + '` and `' + str(argSubstitution) + '` to unify.\n\n';

        // S'
        let unifiedSubsitution;
        try {
            unifiedSubsitution = unifySubtitutions(funcSubstitution, argSubstitution);
        } catch (err) {
            logger(firstPartOfLogMessage1 + 'However, these two subsitutions cannot be unified. We stop here as this is an error.\n\nMore details:\n' + err.message, highlight(expr));
            err.expr = expr;
            throw err;
        }

        const funcType2 = apply(funcType, unifiedSubsitution);
        const argType2 = apply(argType, unifiedSubsitution);

        // Give an easier to read and understand message if we can, otherwise default to the more general case
        const firstPartOfLogMessage2 = firstPartOfLogMessage1 + 'These can be unified as `' + str(unifiedSubsitution) + '`\n\n' + ((funcType instanceof TypeFuncApp && funcType.constructorName == '->')
            ? 'The function must accept the expected argument type.\nThe function type after applying the unified substitution is `' + funcType2.toString() + '`\n\nTherefore we unify:\nFunction accepts `' + (funcType2 as TypeFuncApp).args[0].toString() + '`\nArgument has type `' + argType2.toString() + '`\n\n'
            : 'The function must accept the expected argument type.\n\nTherefore we unify:\nFunction type `' + funcType2.toString() + '`\nArgument to fresh type `' + new TypeFuncApp("->", argType2, t).toString() + '`\n\n');

        // V
        let unifyingSubstitution;
        try {
            unifyingSubstitution = unify(funcType2, new TypeFuncApp("->", argType2, t))
        } catch (err) {
            logger(firstPartOfLogMessage2 + 'However, these two types are not unifiable. We stop here as this is an error.\n\nMore details:\n' + err.message, highlight(expr));
            err.expr = expr;
            throw err;
        }
        const exprType = apply(t, unifyingSubstitution)
        logger(firstPartOfLogMessage2 + 'This gives the final substitution `' + str(unifyingSubstitution, t.name) + '`\nAnd the function\'s return type as `' + exprType.toString() + '`', highlight(expr));
        return [exprType, combine(funcSubstitution, unifiedSubsitution, unifyingSubstitution)]
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

export { unifySubtitutions, infer };