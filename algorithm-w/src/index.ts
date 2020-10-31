
interface Context { [name: string]: PolyType | undefined }

interface Substitution { [name: string]: MonoType | undefined }

interface Expr {
    infer(ctx: Context): [MonoType, Substitution];
}

function substitute(substitution: Substitution, arg: Context): Context {
    const context = arg;
    let mappedContext: Context = {};
    for (const key in context) {
        mappedContext[key] = (context[key] as PolyType).apply(substitution);
    }
    return mappedContext;
}

function combine(...substitutions: Substitution[]): Substitution {
    // Vaguely based off:
    // http://www.mathcs.duq.edu/simon/Fall04/notes-7-4/node4.html
    if (substitutions.length === 0) return {};
    if (substitutions.length === 1) return substitutions[0];
    if (substitutions.length > 2) return combine(combine(substitutions[0], substitutions[1]), ...substitutions.slice(2));

    const a = substitutions[0];
    const b = substitutions[1];
    let newSubstitution: Substitution = {}
    for (const key in a) {
        // TODO: do we need to bother removing mappings of the form tx: new TypeVar('tx')
        newSubstitution[key] = (a[key] as MonoType).apply(b);
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
        if (type2.contains(type1)) {
            throw new Error('Contains/occurs check failed with ' + JSON.stringify(type1) + ' and ' + JSON.stringify(type2));
        }
        return { [type1.name]: type2 }
    }
    
    if (type2 instanceof TypeVar) {
        return unify(type2, type1);
    }

    if (type1 instanceof TypeFuncApp && type2 instanceof TypeFuncApp) {
        if (type1.constructorName !== type2.constructorName) {
            throw new Error('Could not unify type function applications with different constructors ' + JSON.stringify(type1) + ' and ' + JSON.stringify(type2));
        }

        if (type1.args.length !== type2.args.length) {
            throw new Error('Could not unify type function applications with different argument list lengths ' + JSON.stringify(type1) + ' and ' + JSON.stringify(type2));
        }

        let sub: Substitution = {};
        for (let i = 0; i < type1.args.length; i++) {
            sub = combine(sub, unify(type1.args[i].apply(sub), type2.args[i].apply(sub)));
        }
        return sub;

        return combine(...type1.args.map((_,i) => unify(type1.args[i], type2.args[i])).reverse());
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
        return type.args.map(freeVars).reduce((acc, cur) => [...acc, ...cur]);
    }

    if (type) {
        // type: Context
        return (Object.values(type) as PolyType[]).map(freeVars).reduce((acc, cur) => [...acc, ...cur]);
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

function generalise(ctx: Context, type: MonoType): PolyType {
    return new PolyType(diff(freeVars(type), freeVars(ctx)), type);
}

var typeCounter = 0;
function freshTypeName(): string {
    return "t" + typeCounter++;
}
function freshType(): MonoType {
    return new TypeVar(freshTypeName());
}

class Var implements Expr {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    public infer(ctx: Context): [MonoType, Substitution] {
        const type = ctx[this.name];
        if (!type) {
            throw TypeError(this.name + ' is not in scope');
        }
        return [type.inst(), {}];
    }
}

class App implements Expr {
    private func: Expr;
    private arg: Expr;

    constructor(fun: Expr, arg: Expr) {
        this.func = fun;
        this.arg = arg;
    }

    public infer(ctx: Context): [MonoType, Substitution] {
        const [funcType, funcSubstitution] = this.func.infer(ctx);
        const [argType, argSubstitution] = this.arg.infer(substitute(funcSubstitution, ctx));
        const t = freshType();
        const unifiedSubstitution = unify(funcType.apply(argSubstitution), new TypeFuncApp("->", argType, t))

        return [t.apply(unifiedSubstitution), combine(unifiedSubstitution, argSubstitution, funcSubstitution)]
    }
}

class Abs implements Expr {
    private param: string;
    private body: Expr;

    constructor(param: string, body: Expr) {
        this.param = param;
        this.body = body;
    }

    public infer(ctx: Context): [MonoType, Substitution] {
        const t = freshType();
        const [bodyType, bodySubstitution] = this.body.infer({ ...ctx, [this.param]: new PolyType([], t) });
        return [new TypeFuncApp("->", t, bodyType).apply(bodySubstitution), bodySubstitution]
    }
}

class Let implements Expr {
    private param: string;
    private def: Expr;
    private body: Expr;

    constructor(param: string, def: Expr, body: Expr) {
        this.param = param; // x
        this.def = def; // e1
        this.body = body; // e2
    }

    public infer(ctx: Context): [MonoType, Substitution] {
        const [defType, defSubstitution] = this.def.infer(ctx);
        const [bodyType, bodySubstitution] = this.body.infer({ ...substitute(defSubstitution, ctx), [this.param]: generalise(substitute(defSubstitution, ctx), defType) });
        return [bodyType, combine(bodySubstitution, defSubstitution)]
    }
}

// ----------

type MonoType = TypeVar | TypeFuncApp;
function isMonoType(object: any): object is MonoType {
    return object instanceof TypeVar || object instanceof TypeFuncApp;
}

class TypeVar {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    public inst(from: string[], to: string[]): TypeVar {
        const i = from.indexOf(this.name);
        return (i === -1) ? this : new TypeVar(to[i]);
    }

    public apply(substitution: Substitution): MonoType {
        return this.name in substitution ? (substitution[this.name] as MonoType) : this;
    }

    public contains(other: TypeVar): boolean {
        return this.name == other.name;
    }

    public toString(): string {
        return this.name;
    }
}

type TypeFunc = "->" | "[]" | "Maybe" | "Either" | "number" | "string" | "boolean" | "," | ",," | ",,," | ",,,," | ",,,,," | ",,,,,," | ",,,,,,,";

class TypeFuncApp {
    constructorName: TypeFunc;
    args: MonoType[];

    constructor(constructorName: TypeFunc, ...args: MonoType[]) {
        this.constructorName = constructorName;
        this.args = args;
    }

    public inst(from: string[], to: string[]): TypeFuncApp {
        return new TypeFuncApp(this.constructorName, ...this.args.map(a => a.inst(from, to)));
    }

    public apply(substitution: Substitution): TypeFuncApp {
        return new TypeFuncApp(this.constructorName, ...this.args.map(a => a.apply(substitution)));
    }

    public contains(other: TypeVar): boolean {
        return this.args.some(a => a.contains(other));
    }

    public toString(): string {
        return this.constructorName + (this.args.length ? ' ' : '') + this.args.map(a => '(' + a.toString() + ')').join(' ');
    }
}

class PolyType {
    quantifiedVars: string[];
    monoType: MonoType;

    constructor(quantifiedVars: string[], monoType: MonoType) {
        this.quantifiedVars = quantifiedVars;
        this.monoType = monoType;
    }

    public inst(): MonoType {
        return this.monoType.inst(this.quantifiedVars, this.quantifiedVars.map(freshTypeName));
    }
    
    public apply(substitution: Substitution): PolyType {
        // TODO: is this right? maybe this should never happen?
        const substitutionKeys = new Set(Object.keys(substitution));
        const newQuantifiedVars = this.quantifiedVars.filter(v => !substitutionKeys.has(v));
        
        const newMonoType = this.monoType.apply(substitution);

        return new PolyType(newQuantifiedVars, newMonoType);
    }

    public contains(other: TypeVar): boolean {
        return this.monoType.contains(other) && !this.quantifiedVars.includes(other.name)
    }
}

export { Var, App, Abs, Let, TypeVar, TypeFunc, TypeFuncApp, MonoType, PolyType, Expr, substitute, combine, unify };