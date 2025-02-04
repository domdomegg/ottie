import { C, N, F, GenLex, Streams, SingleParser, Response as MasalaResponse, Tuple, Option, Reject } from '@domdomegg/masala-parser';

/* AST expression nodes */

interface Position {
    start: number;
    end: number;
}

type Expr = CharLiteral | NumberLiteral | Var | App | Abs | Let

class CharLiteral {
    readonly value: string;
    readonly pos: Position;
    readonly notes?: string;

    constructor(value: string, pos: Position, notes?: string) {
        this.value = value;
        this.pos = pos;
        this.notes = notes;
    }

    toString(): string {
        return "'" + this.value + "'";
    }
}

class NumberLiteral {
    readonly value: number;
    readonly pos: Position;
    readonly notes?: string;

    constructor(value: number, pos: Position, notes?: string) {
        this.value = value;
        this.pos = pos;
        this.notes = notes;
    }

    toString(): string {
        return this.value.toString();
    }
}

class Var {
    readonly name: string;
    readonly pos: Position;
    readonly notes?: string;

    constructor(name: string, pos: Position, notes?: string) {
        this.name = name;
        this.pos = pos;
        this.notes = notes;
    }

    toString(): string {
        return this.name;
    }
}

class App {
    readonly func: Expr;
    readonly arg: Expr;
    readonly pos: Position;
    readonly notes?: string;

    constructor(fun: Expr, arg: Expr, pos: Position, notes?: string) {
        this.func = fun;
        this.arg = arg;
        this.pos = pos;
        this.notes = notes;
    }

    toString(): string {
        return '(' + this.func.toString() + ' ' + this.arg.toString() + ')'
    }
}

class Abs {
    readonly param: string;
    readonly body: Expr;
    readonly pos: Position;
    readonly notes?: string;

    constructor(param: string, body: Expr, pos: Position, notes?: string) {
        this.param = param;
        this.body = body;
        this.pos = pos;
        this.notes = notes;
    }

    toString(): string {
        return '(\\' + this.param + ' -> ' + this.body.toString() + ')'
    }
}

class Let {
    readonly param: string;
    readonly def: Expr;
    readonly body: Expr;
    readonly pos: Position;
    readonly notes?: string;

    constructor(param: string, def: Expr, body: Expr, pos: Position, notes?: string) {
        this.param = param;
        this.def = def;
        this.body = body;
        this.pos = pos;
        this.notes = notes;
    }

    toString(): string {
        return '(let ' + this.param + ' = ' + this.def.toString() + ' in ' + this.body.toString() + ')'
    }
}

/* Types */

type MonoType = TypeVar | TypeFuncApp;

class TypeVar {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    toString(): string {
        return this.name;
    }
}

type TypeFunc = "->" | "[]" | "Maybe" | "Either" | "Int" | "Char" | "Bool" | "," | ",," | ",,," | ",,,," | ",,,,," | ",,,,,," | ",,,,,,," | ",,,,,,,,";

class TypeFuncApp {
    readonly constructorName: TypeFunc;
    readonly args: MonoType[];

    constructor(constructorName: TypeFunc, ...args: MonoType[]) {
        this.constructorName = constructorName;
        this.args = args;
    }

    toString(): string {
        if (this.constructorName == '->') {
            const firstArgIsFunction = this.args[0] instanceof TypeFuncApp && this.args[0].constructorName == '->';
            return (firstArgIsFunction ? '(' + this.args[0].toString() + ')' : this.args[0].toString()) + ' -> ' + this.args[1].toString();
        }

        if (this.constructorName == '[]') {
            return '[' + this.args[0].toString() + ']'
        }

        if (this.constructorName.startsWith(',')) {
            return '(' + this.args.join(', ') + ')'
        }
        
        if (this.args.every(arg => arg instanceof TypeVar || arg.constructorName == 'Int' || arg.constructorName == 'Char' || arg.constructorName == 'Bool')) {
            return this.constructorName + (this.args.length ? ' ' : '') + this.args.map(a => '' + a.toString() + '').join(' ');
        }

        return this.constructorName + (this.args.length ? ' ' : '') + this.args.map(a => '(' + a.toString() + ')').join(' ');
    }
}

class PolyType {
    readonly quantifiedVars: string[];
    readonly monoType: MonoType;

    constructor(quantifiedVars: string[], monoType: MonoType) {
        this.quantifiedVars = quantifiedVars;
        this.monoType = monoType;
    }

    toString(): string {
        return (this.quantifiedVars.length ? (this.quantifiedVars.map(v => '∀' + v).join('') + ': ') : '') + this.monoType.toString();
    }
}

interface Context { [name: string]: PolyType | undefined }
interface Substitution { [name: string]: MonoType | undefined }

class TypeInferenceError extends Error {
    expr?: Expr;

    constructor(message: string, expr?: Expr) {
        super(message);
        this.name = "TypeInferenceError";
        this.expr = expr;
    }
}

const isTypeInferenceError = (e: unknown): e is TypeInferenceError => e instanceof Error && e.name === "TypeInferenceError";
const assertIsTypeInferenceError = (e: unknown): asserts e is TypeInferenceError => {
    if (!isTypeInferenceError(e)) throw new Error('Expected TypeInferenceError but got ' + e);
}

/* Type utilities */

// Utilities which make creating types easier
const number = new TypeFuncApp('Int');
const char = new TypeFuncApp('Char');
const boolean = new TypeFuncApp('Bool');
const f = (one: MonoType, two: MonoType, ...extra: MonoType[]): TypeFuncApp => {
    if (extra.length === 0) return new TypeFuncApp('->', one, two)
    return new TypeFuncApp('->', one, f(two, extra[0], ...extra.slice(1)))
}
const list = (monoType: MonoType): TypeFuncApp => new TypeFuncApp('[]', monoType);
const tuple = (...monoTypes: MonoType[]): TypeFuncApp => {
    if (monoTypes.length <= 1) throw new Error('Tuple has too few elements, minimum of 2 but given ' + monoTypes.length)
    if (monoTypes.length > 9) throw new Error('Tuple has too many elements, maximum of 9 but given ' + monoTypes.length)
    return new TypeFuncApp(','.repeat(monoTypes.length - 1) as TypeFunc, ...monoTypes);
}
const maybe = (monoType: MonoType): TypeFuncApp => new TypeFuncApp('Maybe', monoType);
const either = (left: MonoType, right: MonoType): TypeFuncApp => new TypeFuncApp('Either', left, right);

const a = new TypeVar('a');
const b = new TypeVar('b');
const c = new TypeVar('c');
const d = new TypeVar('d');
const pt = (mt: MonoType) => new PolyType([], mt);

// Set up some basic things so the langauge is interesting
const standardCtx: Context = {
    // Arithmetic
    '+': pt(f(number, number, number)),
    '*': pt(f(number, number, number)),
    '-': pt(f(number, number, number)),
    '/': pt(f(number, number, number)),
    '%': pt(f(number, number, number)),
    'negate': pt(f(number, number)),
    'abs': pt(f(number, number)),
    'signum': pt(f(number, number)),
    'even': pt(f(number, boolean)),
    'odd': pt(f(number, boolean)),
    'gt': pt(f(number, number, boolean)),
    'gte': pt(f(number, number, boolean)),
    'lt': pt(f(number, number, boolean)),
    'lte': pt(f(number, number, boolean)),
    'eq': pt(f(number, number, boolean)),

    // Booleans
    'not': pt(f(boolean, boolean)),
    '&&': pt(f(boolean, boolean, boolean)),
    '||': pt(f(boolean, boolean, boolean)),
    'True': pt(boolean),
    'False': pt(boolean),

    // Example variables
    'myNumber': pt(number),
    'myBoolean': pt(boolean),
    'age': pt(number),
    'hungry': pt(boolean),

    // Lists
    '[]': new PolyType(['a'], list(a)),
    ':': new PolyType(['a'], f(a, list(a), list(a))),
    'cons': new PolyType(['a'], f(a, list(a), list(a))),
    '++': new PolyType(['a'], f(list(a), list(a), list(a))),
    'head': new PolyType(['a'], f(list(a), a)),
    'last': new PolyType(['a'], f(list(a), a)),
    'tail': new PolyType(['a'], f(list(a), list(a))),
    'init': new PolyType(['a'], f(list(a), list(a))),
    'uncons': new PolyType(['a'], f(list(a), maybe(tuple(a, list(a))))),
    'null': new PolyType(['a'], f(list(a), boolean)),
    'length': new PolyType(['a'], f(list(a), number)),
    'map': new PolyType(['a', 'b'], f(f(a, b), list(a), list(b))),
    'reverse': new PolyType(['a'], f(list(a), list(a))),
    'intersperse': new PolyType(['a'], f(a, list(a), list(a))),
    'intercalate': new PolyType(['a'], f(list(a), list(list(a)), list(a))),
    'transpose': new PolyType(['a'], f(list(list(a)), list(list((a))))),
    'subsequences': new PolyType(['a'], f(list(a), list(list((a))))),
    'permutations': new PolyType(['a'], f(list(a), list(list((a))))),
    'foldl': new PolyType(['a'], f(f(b, a, b), b, list(a), b)),
    'foldl\'': new PolyType(['a'], f(f(b, a, b), b, list(a), b)),
    'foldl1': new PolyType(['a'], f(f(a, a, a), list(a), a)),
    'foldl1\'': new PolyType(['a'], f(f(a, a, a), list(a), a)),
    'foldr': new PolyType(['a'], f(f(a, b, b), b, list(a), b)),
    'foldr1': new PolyType(['a'], f(f(a, a, a), list(a), a)),
    'concat': new PolyType(['a'], f(list(list(a)), list(a))),
    'concatMap': new PolyType(['a'], f(f(a, list(a)), list(a), list(b))),
    'and': pt(f(list(boolean), boolean)),
    'or': pt(f(list(boolean), boolean)),
    'any': new PolyType(['a'], f(f(a, boolean), list(a), boolean)),
    'all': new PolyType(['a'], f(f(a, boolean), list(a), boolean)),
    'sum': pt(f(list(number), number)),
    'product': pt(f(list(number), number)),
    'maximum': pt(f(list(number), number)),
    'minimum': pt(f(list(number), number)),
    'take': new PolyType(['a'], f(number, list(a), list(a))),
    'drop': new PolyType(['a'], f(number, list(a), list(a))),
    'splitAt': new PolyType(['a'], f(number, list(a), tuple(list(a), list(a)))),
    'takeWhile': new PolyType(['a'], f(f(a, boolean), list(a), list(a))),
    'dropWhile': new PolyType(['a'], f(f(a, boolean), list(a), list(a))),
    'elem': new PolyType(['a'], f(a, list(a), boolean)),
    'notElem': new PolyType(['a'], f(a, list(a), boolean)),
    'lookup': new PolyType(['a', 'b'], f(a, list(tuple(a, b)), maybe(b))),
    'find': new PolyType(['a'], f(f(a, boolean), list(a), maybe(a))),
    'filter': new PolyType(['a'], f(f(a, boolean), list(a), list(a))),
    'partition': new PolyType(['a'], f(f(a, boolean), list(a), tuple(list(a), list(a)))),
    '!!': new PolyType(['a'], f(list(a), number, a)),
    'zip': new PolyType(['a', 'b'], f(list(a), list(b), list(tuple(a, b)))),
    'zipWith': new PolyType(['a', 'b', 'c'], f(f(a, b, c), list(a), list(b), list(c))),
    'unzip': new PolyType(['a', 'b'], f(list(tuple(a, b)), tuple(list(a), list(b)))),
    'nub': new PolyType(['a'], f(list(a), list(a))),
    'delete': new PolyType(['a'], f(a, list(a), list(a))),
    'union': new PolyType(['a'], f(list(a), list(a), list(a))),
    'intersect': new PolyType(['a'], f(list(a), list(a), list(a))),
    'sort': new PolyType(['a'], f(list(a), list(a))),

    // Tuples
    ',': new PolyType(['a', 'b'], f(a, b, tuple(a, b))),
    ',,': new PolyType(['a', 'b', 'c'], f(a, b, c, tuple(a, b, c))),
    ',,,': new PolyType(['a', 'b', 'c', 'd'], f(a, b, c, d, tuple(a, b, c, d))),
    ',,,,': new PolyType(['a', 'b', 'c', 'd', 'e'], f(a, b, c, d, new TypeVar('e'), tuple(a, b, c, d, new TypeVar('e')))),
    ',,,,,': new PolyType(['a', 'b', 'c', 'd', 'e', 'f'], f(a, b, c, d, new TypeVar('e'), new TypeVar('f'), tuple(a, b, c, d, new TypeVar('e'), new TypeVar('f')))),
    ',,,,,,': new PolyType(['a', 'b', 'c', 'd', 'e', 'f', 'g'], f(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g'), tuple(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g')))),
    ',,,,,,,': new PolyType(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], f(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g'), new TypeVar('h'), tuple(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g'), new TypeVar('h')))),
    ',,,,,,,,': new PolyType(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], f(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g'), new TypeVar('h'), new TypeVar('i'), tuple(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g'), new TypeVar('h'), new TypeVar('i')))),
    't': new PolyType(['a', 'b'], f(a, b, tuple(a, b))),
    'tt': new PolyType(['a', 'b', 'c'], f(a, b, c, tuple(a, b, c))),
    'ttt': new PolyType(['a', 'b', 'c', 'd'], f(a, b, c, d, tuple(a, b, c, d))),
    'tttt': new PolyType(['a', 'b', 'c', 'd', 'e'], f(a, b, c, d, new TypeVar('e'), tuple(a, b, c, d, new TypeVar('e')))),
    'ttttt': new PolyType(['a', 'b', 'c', 'd', 'e', 'f'], f(a, b, c, d, new TypeVar('e'), new TypeVar('f'), tuple(a, b, c, d, new TypeVar('e'), new TypeVar('f')))),
    'tttttt': new PolyType(['a', 'b', 'c', 'd', 'e', 'f', 'g'], f(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g'), tuple(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g')))),
    'ttttttt': new PolyType(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], f(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g'), new TypeVar('h'), tuple(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g'), new TypeVar('h')))),
    'tttttttt': new PolyType(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], f(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g'), new TypeVar('h'), new TypeVar('i'), tuple(a, b, c, d, new TypeVar('e'), new TypeVar('f'), new TypeVar('g'), new TypeVar('h'), new TypeVar('i')))),
    'fst': new PolyType(['a', 'b'], f(tuple(a, b), a)),
    'snd': new PolyType(['a', 'b'], f(tuple(a, b), b)),
    'curry': new PolyType(['a', 'b', 'c'], f(f(tuple(a, b), c), a, b, c)),
    'uncurry': new PolyType(['a', 'b', 'c'], f(f(a, b, c), tuple(a, b), c)),

    // Maybe
    'Just': new PolyType(['a'], f(a, maybe(a))),
    'Nothing': new PolyType(['a'], maybe(a)),

    // Either
    'Left': new PolyType(['a', 'b'], f(a, either(a, b))),
    'Right': new PolyType(['a', 'b'], f(b, either(a, b))),

    // Id
    'id': new PolyType(['a'], f(a, a)),
}

/** @returns whether a type contains a type variable */
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

/** Instantiates a type with fresh type variables */
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

/* Substitution utilities */

/** Applies a susbstitution to a type or context */
function apply<T extends MonoType | PolyType | Context>(substitution: Substitution, type: T): T;
function apply(substitution: Substitution, type: MonoType | PolyType | Context): MonoType | PolyType | Context {
    if (type instanceof TypeVar) {
        return type.name in substitution ? (substitution[type.name] as MonoType) : type;
    }

    if (type instanceof TypeFuncApp) {
        return new TypeFuncApp(type.constructorName, ...type.args.map(arg => apply(substitution, arg)));
    }

    if (type instanceof PolyType) {
        return new PolyType(type.quantifiedVars, apply(substitution, type.monoType));
    }

    if (type) {
        // type: Context
        const context = type;
        let mappedContext: Context = {};
        for (const key in context) {
            mappedContext[key] = apply(substitution, context[key] as PolyType);
        }
        return mappedContext;
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

/** Combines substitutions. Applies leftmost substitution first, e.g. apply(combine(a, b), e) == apply(b, apply(a, e)) */
function combine(...substitutions: Substitution[]): Substitution {
    if (substitutions.length === 0) return {};
    if (substitutions.length === 1) return substitutions[0];
    if (substitutions.length > 2) return combine(substitutions[0], combine(...substitutions.slice(1)));

    const a = substitutions[0];
    const b = substitutions[1];
    let newSubstitution: Substitution = {}
    for (const key in a) {
        newSubstitution[key] = apply(b, a[key] as MonoType);
    }
    for (const key in b) {
        if (!(key in a)) {
            newSubstitution[key] = b[key];
        }
    }
    return newSubstitution;
}

/** Returns a unifying susbtitution to unify two monotypes. Throws a TypeInferenceError iff no such substitution exists */
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
            sub = combine(sub, unify(apply(sub, type1.args[i]), apply(sub, type2.args[i])));
        }
        return sub;
    }

    // Should be unreachable...
    throw new Error('Internal error, this should never happen');
}

/** Returns a collection with duplicate elements removed */
function unique<T>(xs: T[]): T[] {
    const vs: T[] = [];
    new Set(xs).forEach(x => vs.push(x));
    return vs;
}

/** Returns the first collection with any elements in the second removed, i.e. a \ b */
function diff<T>(a: T[], b: T[]): T[] {
    const bset = new Set(b);
    return a.filter(v => !bset.has(v));
}

/** Returns a list of free type variable names in a given type or context */
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

/** Fully generalises a monotype type, for-all qualifying any free type variables not free in the context */
function generalise(ctx: Context, type: MonoType): PolyType {
    return new PolyType(unique(diff(freeVars(type), freeVars(ctx))), type);
}

/* Utility types */

interface Rejected<T> {
    readonly value?: T;
    readonly accepted: false;
    readonly issuePosition: Position;
    readonly message: string;
}
interface Accepted<T> {
    readonly value: T;
    readonly accepted: true;
}
type Response<A, R = undefined> = Rejected<R> | Accepted<A>

interface TypeResult {
    type: MonoType; // The overall type of the expression
    steps: { message: string, ast: Expr }[]; // An array of steps showing the derivation
}

/* Lexer */

const genlex = new GenLex();
const identifier = genlex.tokenize(C.charIn('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*+-/%<>^:_|&!\'').rep().map(t => t.join()), 'identifier');
const letTok = genlex.tokenize(C.string('let '), 'let');
const inTok = genlex.tokenize(C.string('in '), 'in');
const charLiteral = genlex.tokenize(C.charLiteral(), 'char');
const stringLiteral = genlex.tokenize(C.stringLiteral(), 'string');
const numberLiteral = genlex.tokenize(N.integer(), 'number');
const lbracket = genlex.tokenize(C.char('['), 'lbracket');
const rbracket = genlex.tokenize(C.char(']'), 'rbracket');
const backslash = genlex.tokenize(C.char('\\'), 'backslash');
const arrow = genlex.tokenize(C.string('->'), 'arrow');
const lparen = genlex.tokenize(C.char('('), 'lparen');
const rparen = genlex.tokenize(C.char(')'), 'rparen');
const equal = genlex.tokenize(C.char('='), 'equal');
const comma = genlex.tokenize(C.char(','), 'comma');

/* Parser */

const expression = (): SingleParser<Expr> =>
        F.try(LIT_NUM())
    .or(F.try(LIT_CHAR()))
    .or(F.try(LIT_STRING()))
    .or(F.try(TUPLE()))
    .or(F.try(LIST()))
    .or(F.try(VAR()))
    .or(F.try(ABS()))
    .or(F.try(LET()))
    .or(F.try(PAR()))
    .rep().array().map(nestLeft);

/* Construct-specific parsers */
// We have to SHOUT as var and let are restricted keywords in JavaScript
const LIT_NUM = (): SingleParser<NumberLiteral> => numberLiteral.map((value, r) => new NumberLiteral(value, getPos(r))); 
const LIT_CHAR = (): SingleParser<CharLiteral> => charLiteral.map((value, r) => new CharLiteral(value, getPos(r)));
const LIT_STRING = (): SingleParser<Expr> => stringLiteral.map(toCharList);
const TUPLE = (): SingleParser<Expr> => lparen.map((v, r) => r.location() - 1).then((F.lazy(expression).then((comma.drop().then(F.lazy(expression))).rep())).array()).then(rparen.map((s, r) => getPos(r).end)).map(toTuple);
const LIST = (): SingleParser<Expr> => lbracket.map((v, r) => r.location() - 1).then((F.lazy(expression).then((comma.drop().then(F.lazy(expression))).optrep())).opt()).then(rbracket.map((s, r) => getPos(r).end)).map(toList);
const VAR = (): SingleParser<Var> => identifier.map((value, r) => new Var(value, getPos(r)));
const ABS = (): SingleParser<Abs> => backslash.map((v, r) => r.location() - 1).then(identifier).then(arrow.drop()).then(F.lazy(expression)).map((tuple, r) => new Abs(tuple.at(1) as string, tuple.at(2) as Expr, { start: tuple.at(0) as number, end: r.location() }))
const PAR = (): SingleParser<Expr> => lparen.drop().then(F.lazy(expression)).then(rparen.drop()).single().map(expandPosToParentheses)
const LET = (): SingleParser<Let> => letTok.map((v, r) => getPos(r).start).then(identifier).then(equal.drop()).then(F.lazy(expression)).then(inTok.drop()).then(F.lazy(expression)).map((tuple, r) => new Let(tuple.at(1) as string, tuple.at(2) as Expr, tuple.at(3) as Expr, { start: tuple.at(0) as number, end: r.location() }))

// Given a list of expressions, return left-nested function applications e.g. [a, b, c, d] -> (((a b) c) d)
const nestLeft = (v: Expr[]) => v.reduce((prev, cur) => new App(prev, cur, { start: prev.pos.start, end: cur.pos.end }));

// Given a string, return an equivalent list of chars constructed with cons
const toCharList = (string: string, r: MasalaResponse<string>) => {
    const chars = string.split('');
    const pos = getPos(r);
    let expr: Expr = new Var('[]', { start: pos.end - 1, end: pos.end });
    for (let i = chars.length - 1; i >= 0; i--) {
        const charPos = { start: pos.start + 1 + i, end: pos.start + 2 + i };
        expr = new App(new App(new Var(':', charPos), new CharLiteral(chars[i], charPos), charPos), expr, { start: pos.start + 1 + i, end: pos.end - 1 });
    }
    expr.pos.start = pos.start;
    expr.pos.end = pos.end;
    return expr;
}

// Given several matched expressions, return a list of all of them
const toList = (tuple: Tuple<unknown | number | Option<Tuple<Expr>>>): Expr => {
    const start = tuple.first() as number;
    const end = tuple.last() as number;
    const elements = (tuple.at(1) as Option<Tuple<Expr>>).map(t => t.array()).orElse([]);

    const pos = { start, end };
    let expr: Expr = new Var('[]', { start: pos.end - 1, end: pos.end });
    for (let i = elements.length - 1; i >= 0; i--) {
        expr = new App(new App(new Var(':', elements[i].pos), elements[i], elements[i].pos), expr, { start: elements[i].pos.start, end: pos.end });
    }
    expr.pos.start = pos.start;
    expr.pos.end = pos.end;
    return expr;
}

// Given several matched expressions, return a tuple of all of them
const toTuple = (tuple: Tuple<unknown | number | Expr[]>): Expr => {
    const start = tuple.first() as number;
    const end = tuple.last() as number;
    const elements = tuple.at(1) as Expr[];

    const result = nestLeft([new Var(','.repeat(elements.length - 1), { start: start, end: start + 1 }), ...elements]);
    result.pos.start = start;
    result.pos.end = end;
    return result;
}

// Extract the position of a matched token given the MasalaResponse
const getPos = <T>(r: MasalaResponse<T>): Position => {
    const offset = (r as any).getOffset() - 1;
    const start = (r as any).input.location(offset);
    const guessedEnd = (r as any).input.location(offset + 1);
    
    const rawString = ((r as any).input.source.input.source as string).slice(start, guessedEnd);
    const end = guessedEnd - (rawString.length - rawString.trimEnd().length)

    return { start, end }
}

// Expand a position to the next pair of surrounding parentheses
const expandPosToParentheses = <T extends Expr>(v: T, r: MasalaResponse<T>): T => {
    const rawString = ((r as any).input.source.input.source as string);
    v.pos.end += rawString.slice(v.pos.end).indexOf(')') + 1
    v.pos.start = rawString.slice(0, v.pos.start).lastIndexOf('(')
    return v;
}

// Handle a couple special cases that the parsers construction can't handle due to keyword/identifier confusion
const specialCases = (code: string): undefined | Rejected<undefined> => {
    if (code == 'let' || code.endsWith(' let')) {
        return {
            accepted: false,
            issuePosition: { start: code.length - 3, end: code.length },
            message: 'Failed to parse'
        };
    }
    if (code == 'in' || code.endsWith(' in')) {
        return {
            accepted: false,
            issuePosition: { start: code.length - 2, end: code.length },
            message: 'Failed to parse'
        };
    }
}

// Error class for parse errors
class ParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ParseError";
    }
}

const parser: SingleParser<Expr> = genlex.use(expression().then(F.eos().drop()).single());
function parse(code: string): Expr;
function parse(code: string, forResponse: true): Response<Expr>;
function parse(code: string, forResponse: boolean = false): Expr | Response<Expr> {
    const specialCase = specialCases(code);
    if (specialCase) {
        if (forResponse) return specialCase;
        throw new ParseError('Failed to parse:\n\t' + code + '\n\t' + ' '.repeat(specialCase.issuePosition.start) + '^')
    }

    const response = parser.parse(Streams.ofString(code));
    if (forResponse) {
        if (response.isAccepted()) return { accepted: true, value: response.value }
        return { accepted: false, issuePosition: { start: response.location(), end: code.length }, message: 'Failed to parse' }
    }
    if (response.isAccepted()) return response.value;
    throw new ParseError('Failed to parse:\n\t' + code + '\n\t' + ' '.repeat(response.location()) + '^')
}

const typeUtils = { number, char, boolean, f, list, tuple, maybe, either, a, b, c, d, pt, standardCtx };
export {
    CharLiteral, NumberLiteral, Var, App, Abs, Let, Expr,
    MonoType, TypeVar, TypeFunc, TypeFuncApp, PolyType, Context, Substitution,
    ParseError, TypeInferenceError, isTypeInferenceError, assertIsTypeInferenceError,
    Response, Rejected, Accepted, TypeResult,
    typeUtils,
    parse, contains, inst, apply, combine, unify, unique, diff, freeVars, generalise
};
