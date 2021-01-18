import { C, N, F, GenLex, Streams, TupleParser, SingleParser, Response as MasalaResponse, Tuple, Option } from '@domdomegg/masala-parser';

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

type TypeFunc = "->" | "[]" | "Maybe" | "Either" | "number" | "char" | "boolean" | "," | ",," | ",,," | ",,,," | ",,,,," | ",,,,,," | ",,,,,,,";

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
        
        if (this.args.every(arg => arg instanceof TypeVar || arg.constructorName == 'number' || arg.constructorName == 'char' || arg.constructorName == 'boolean')) {
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

/* Type utilities */


// Utilities which make creating types easier
const number = new TypeFuncApp('number');
const char = new TypeFuncApp('char');
const boolean = new TypeFuncApp('boolean');
const f = (one: MonoType, two: MonoType, ...extra: MonoType[]): TypeFuncApp => {
    if (extra.length === 0) return new TypeFuncApp('->', one, two)
    return new TypeFuncApp('->', one, f(two, extra[0], ...extra.slice(1)))
}
const list = (monoType: MonoType): TypeFuncApp => new TypeFuncApp('[]', monoType);
const tuple = (...monoTypes: MonoType[]): TypeFuncApp => {
    if (monoTypes.length <= 1) throw new Error('Tuple has too few elements, minimum of 2 but given ' + monoTypes.length)
    if (monoTypes.length > 8) throw new Error('Tuple has too many elements, maximum of 8 but given ' + monoTypes.length)
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

    // Booleans
    'not': pt(f(boolean, boolean)),
    '&&': pt(f(boolean, boolean, boolean)),
    '||': pt(f(boolean, boolean, boolean)),
    'True': pt(boolean),
    'False': pt(boolean),

    // Example variables
    'myNumber': pt(number),
    'myBoolean': pt(boolean),

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
    '\\\\': new PolyType(['a'], f(list(a), list(a), list(a))),
    'union': new PolyType(['a'], f(list(a), list(a), list(a))),
    'intersect': new PolyType(['a'], f(list(a), list(a), list(a))),
    'sort': new PolyType(['a'], f(list(a), list(a))),

    // Tuples
    ',': new PolyType(['a', 'b'], f(a, b, tuple(a, b))),
    ',,': new PolyType(['a', 'b', 'c'], f(a, b, c, tuple(a, b, c))),
    ',,,': new PolyType(['a', 'b', 'c', 'd'], f(a, b, c, d, tuple(a, b, c, d))),
    't': new PolyType(['a', 'b'], f(a, b, tuple(a, b))),
    'tt': new PolyType(['a', 'b', 'c'], f(a, b, c, tuple(a, b, c))),
    'ttt': new PolyType(['a', 'b', 'c', 'd'], f(a, b, c, d, tuple(a, b, c, d))),
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

/* Utilities */

interface Rejected<T> {
    value?: T;
    accepted: false;
    issuePosition: {
        start: number;
        end: number;
    };
    message: string;
}
interface Accepted<T> {
    value: T;
    accepted: true;
}
type Response<A, R = undefined> = Rejected<R> | Accepted<A>

/* Parser */

// expr ::= identifier # var
//        | ( \ identifier -> expr ) # abs
//        | ( expr )
//        | expr expr # app
//        | ( let identifier = expr in expr ) # let

// expr ::= identifier expr' # var
//        | ( \ identifier -> expr ) expr' # abs
//        | ( expr ) expr'
//        | ( let identifier = expr in expr ) expr' # let

// expr' ::= expr A' | eps # app

class ParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ParseError";
    }
}

const genlex = new GenLex();
const identifier = genlex.tokenize(C.charIn('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*+-/%<>^:_|&').rep().map(t => t.join()), 'identifier');
const lbracket = genlex.tokenize(C.char('['), 'lbracket');
const rbracket = genlex.tokenize(C.char(']'), 'rbracket');
const charLiteral = genlex.tokenize(C.charLiteral(), 'char');
const stringLiteral = genlex.tokenize(C.stringLiteral(), 'string');
const numberLiteral = genlex.tokenize(N.number(), 'number');
const backslash = genlex.tokenize(C.char('\\'), 'backslash');
const arrow = genlex.tokenize(C.string('->'), 'arrow');
const lparen = genlex.tokenize(C.char('('), 'lparen');
const rparen = genlex.tokenize(C.char(')'), 'rparen');
const letTok = genlex.tokenize(C.string('let'), 'let');
const equal = genlex.tokenize(C.char('='), 'equal');
const inTok = genlex.tokenize(C.string('in'), 'in');
const comma = genlex.tokenize(C.char(','), 'comma');

const expression1 = (): SingleParser<Expr> =>
        F.try(LET_())
    .or(F.try(ABS_()))
    .or(F.try(expression2()))

const expression2 = (): SingleParser<Expr> =>
        F.try(optApp(LEAF()))
    .or(F.try(optApp(ABS())))
    .or(F.try(optApp(LET())))
    .or(F.try(optApp(PAR())))

const expression3 = (): SingleParser<Expr> =>
        F.try(LEAF())
    .or(F.try(ABS()))
    .or(F.try(LET()))
    .or(F.try(PAR()))

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

const toList = (tuple: Tuple<number | Option<Tuple<Expr>>>, r: MasalaResponse<any>): Expr => {
    const start = tuple.at(0) as number;
    const elements = (tuple.at(1) as Option<Tuple<Expr>>).map(t => t.array()).orElse([]);

    const pos = { start, end: r.location() };
    let expr: Expr = new Var('[]', { start: pos.end - 1, end: pos.end });
    for (let i = elements.length - 1; i >= 0; i--) {
        expr = new App(new App(new Var(':', elements[i].pos), elements[i], elements[i].pos), expr, { start: elements[i].pos.start, end: pos.end });
    }
    expr.pos.start = pos.start;
    expr.pos.end = pos.end;
    return expr;
}

const toTuple = (tuple: Tuple<number | Expr>, r: MasalaResponse<any>): Expr => {
    const start = tuple.at(0) as number;
    const elements = tuple.array().slice(1) as Expr[];

    const result = nestLeft([new Var(','.repeat(elements.length - 1), { start: start, end: start + 1 }), ...elements]);
    result.pos.start = start;
    result.pos.end = r.location();
    return result;
}

const getPos = <T>(r: MasalaResponse<T>): Position => {
    const offset = (r as any).getOffset() - 1;
    const start = (r as any).input.location(offset);
    const guessedEnd = (r as any).input.location(offset + 1);
    
    const rawString = ((r as any).input.source.input.source as string).slice(start, guessedEnd);
    const end = guessedEnd - (rawString.length - rawString.trimEnd().length)

    return { start, end }
}

const expandPos = <T extends Expr>(v: T, r: MasalaResponse<T>): T => {
    const rawString = ((r as any).input.source.input.source as string);
    v.pos.end += rawString.slice(v.pos.end).indexOf(')') + 1
    v.pos.start = rawString.slice(0, v.pos.start).lastIndexOf('(')
    return v;
}

// We have to SHOUT as var and let are restricted keywords in JavaScript
const LEAF = (): SingleParser<Expr> => F
    .try(numberLiteral.map((value, r) => new NumberLiteral(value, getPos(r))))
    .or(F.try(stringLiteral.map(toCharList)))
    .or(F.try(charLiteral.map((value, r) => new CharLiteral(value, getPos(r)))))
    .or(F.try(lbracket.map((v, r) => r.location() - 1).then((F.lazy(expression1).then((comma.drop().then(F.lazy(expression1))).optrep())).opt()).then(rbracket.drop()).map(toList)))
    .or(F.try(lparen.map((v, r) => r.location() - 1).then(F.lazy(expression1).then((comma.drop().then(F.lazy(expression1))).rep())).then(rparen.drop()).map(toTuple)))
    .or(F.try(identifier.map((value, r) => new Var(value, getPos(r)))))
const ABS = (): SingleParser<Abs> => lparen.drop().then(ABS_()).then(rparen.drop()).single().map(expandPos)
const ABS_ = (): SingleParser<Abs> => backslash.map((v, r) => r.location() - 1).then(identifier).then(arrow.drop()).then(F.lazy(expression2)).map((tuple, r) => new Abs(tuple.at(1), tuple.at(2), { start: tuple.at(0), end: r.location() }))
const PAR = (): SingleParser<Expr> => lparen.drop().then(F.lazy(expression2)).then(rparen.drop()).single().map(expandPos)
const LET = (): SingleParser<Abs> => lparen.drop().then(LET_()).then(rparen.drop()).single().map(expandPos)
const LET_ = (): SingleParser<Let> => letTok.map((v, r) => getPos(r).start).then(identifier).then(equal.drop()).then(F.lazy(expression2)).then(inTok.drop()).then(F.lazy(expression2)).map((tuple, r) => new Let(tuple.at(1), tuple.at(2), tuple.at(3), { start: tuple.at(0), end: r.location() }))

const optApp = (parser: SingleParser<Expr>): SingleParser<Expr> => parser.then(expressionPrime()).array().map(nestLeft);
const expressionPrime = (): TupleParser<Expr> => F.lazy(expression3).optrep();
const nestLeft = (v: Expr[]) => v.reduce((prev, cur) => new App(prev, cur, { start: prev.pos.start, end: cur.pos.end }));

const parser: SingleParser<Expr> = genlex.use(expression1().then(F.eos().drop()).single());
function parse(code: string): Expr;
function parse(code: string, forResponse: true): Response<Expr>;
function parse(code: string, forResponse: boolean = false): Expr | Response<Expr> {
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
    MonoType, TypeVar, TypeFunc, TypeFuncApp, PolyType, Context,
    parse, ParseError, Response, Rejected, Accepted,
    typeUtils
};