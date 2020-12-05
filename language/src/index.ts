import { C, N, F, GenLex, Streams, TupleParser, SingleParser, Response } from '@masala/parser';

/* AST expression nodes */

type Expr = CharLiteral | NumberLiteral | Var | App | Abs | Let

class CharLiteral {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    toString(): string {
        return this.value;
    }
}

class NumberLiteral {
    readonly value: number;

    constructor(value: number) {
        this.value = value;
    }

    toString(): string {
        return this.value.toString();
    }
}

class Var {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    toString(): string {
        return this.name;
    }
}

class App {
    readonly func: Expr;
    readonly arg: Expr;

    constructor(fun: Expr, arg: Expr) {
        this.func = fun;
        this.arg = arg;
    }

    toString(): string {
        return '(' + this.func.toString() + ' ' + this.arg.toString() + ')'
    }
}

class Abs {
    readonly param: string;
    readonly body: Expr;

    constructor(param: string, body: Expr) {
        this.param = param;
        this.body = body;
    }

    toString(): string {
        return '(\\' + this.param + ' -> ' + this.body.toString() + ')'
    }
}

class Let {
    readonly param: string;
    readonly def: Expr;
    readonly body: Expr;

    constructor(param: string, def: Expr, body: Expr) {
        this.param = param;
        this.def = def;
        this.body = body;
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
        return this.quantifiedVars.map(v => '∀' + v).join('') + ': ' + this.monoType.toString();
    }
}

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
const identifier = genlex.tokenize(C.charIn('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*+-/%<>^:[]_').rep().map(t => t.join()), 'identifier');
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

const expression = (): SingleParser<Expr> =>
        F.try(optApp(LEAF()))
    .or(F.try(optApp(ABS())))
    .or(F.try(optApp(LET())))
    .or(F.try(optApp(PAR())))

const expressionNoApp = (): SingleParser<Expr> =>
        F.try(LEAF())
    .or(F.try(ABS()))
    .or(F.try(LET()))
    .or(F.try(PAR()))

const toCharArray = (string: string) => {
    const chars = string.split('');
    let expr: Expr = new Var('[]');
    while (chars.length) {
        expr = new App(new App(new Var(':'), new CharLiteral(chars.pop() as string)), expr);
    }
    return expr;
}

// We have to SHOUT as var and let are restricted keywords in JavaScript
const LEAF = (): SingleParser<Expr> => F.try(numberLiteral.map(value => new NumberLiteral(value))).or(F.try(stringLiteral.map(toCharArray))).or(F.try(charLiteral.map(value => new CharLiteral(value)))).or(F.try(identifier.map(value => new Var(value))))
const ABS = (): SingleParser<Abs> => lparen.drop().then(backslash.drop()).then(identifier).then(arrow.drop()).then(F.lazy(expression)).then(rparen.drop()).map(tuple => new Abs(tuple.at(0), tuple.at(1)))
const PAR = (): SingleParser<Expr> => lparen.drop().then(F.lazy(expression)).then(rparen.drop()).single()
const LET = (): SingleParser<Let> => lparen.drop().then(letTok.drop()).then(identifier).then(equal.drop()).then(F.lazy(expression)).then(inTok.drop()).then(F.lazy(expression)).then(rparen.drop()).map(tuple => new Let(tuple.at(0), tuple.at(1), tuple.at(2)))

const optApp = (parser: SingleParser<Expr>): SingleParser<Expr> => parser.then(expressionPrime()).array().map(nestLeft);
const expressionPrime = (): TupleParser<Expr> => F.lazy(expressionNoApp).optrep();
const nestLeft = (v: Expr[]) => v.reduce((prev, cur) => new App(prev, cur));

const parser: SingleParser<Expr> = genlex.use(expression().then(F.eos().drop()).single());
function parse(code: string): Expr;
function parse(code: string, forResponse: true): Response<Expr>;
function parse(code: string, forResponse: boolean = false) {
    const response = parser.parse(Streams.ofString(code));
    if (forResponse) return response;
    if (response.isAccepted()) return response.value;
    throw new ParseError('Failed to parse:\n\t' + code + '\n\t' + ' '.repeat(response.location()) + '^')
}

export {
    CharLiteral, NumberLiteral, Var, App, Abs, Let, Expr,
    MonoType, TypeVar, TypeFunc, TypeFuncApp, PolyType,
    parse, ParseError
};