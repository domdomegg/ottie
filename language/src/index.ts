import { C, F, GenLex, Streams, TupleParser, SingleParser, Response } from '@masala/parser';

interface Expr {}

class Var implements Expr {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    toString() {
        return this.name;
    }
}

class App implements Expr {
    private func: Expr;
    private arg: Expr;

    constructor(fun: Expr, arg: Expr) {
        this.func = fun;
        this.arg = arg;
    }

    toString() {
        return '(' + this.func.toString() + ' ' + this.arg.toString() + ')'
    }
}

class Abs implements Expr {
    private param: string;
    private body: Expr;

    constructor(param: string, body: Expr) {
        this.param = param;
        this.body = body;
    }

    toString() {
        return '(\\' + this.param + ' -> ' + this.body.toString() + ')'
    }
}

class Let implements Expr {
    private param: string;
    private def: Expr;
    private body: Expr;

    constructor(param: string, def: Expr, body: Expr) {
        this.param = param;
        this.def = def;
        this.body = body;
    }

    toString() {
        return '(let ' + this.param + ' = ' + this.def.toString() + ' in ' + this.body.toString() + ')'
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
const identifier = genlex.tokenize(C.letters(), 'identifier');
const backslash = genlex.tokenize(C.char('\\'), 'backslash');
const arrow = genlex.tokenize(C.string('->'), 'arrow');
const lparen = genlex.tokenize(C.char('('), 'lparen');
const rparen = genlex.tokenize(C.char(')'), 'rparen');
const letTok = genlex.tokenize(C.string('let'), 'let');
const equal = genlex.tokenize(C.char('='), 'equal');
const inTok = genlex.tokenize(C.string('in'), 'in');

const expression = (): SingleParser<Expr> =>
        F.try(optApp(VAR()))
    .or(F.try(optApp(ABS())))
    .or(F.try(optApp(PAR())))
    .or(F.try(optApp(LET())))

const expressionNoApp = (): SingleParser<Expr> =>
        F.try(VAR())
    .or(F.try(ABS()))
    .or(F.try(PAR()))
    .or(F.try(LET()))

// We have to SHOUT as var and let are restricted keywords in JavaScript
const VAR = (): SingleParser<Var> => identifier.map(value => new Var(value))
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

export { Var, App, Abs, Let, Expr, parse, ParseError };