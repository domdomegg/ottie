import { Var, App, Abs, Let, Expr } from '../src/index'
import { C, F, GenLex, TupleParser, Streams, Option, Tuple, tuple, Accept, Reject, IParser } from '@masala/parser';

test('scratch', () => {
    // const parser = C
    //     .string("hello").drop()
    //     .then(C.char(' ').rep().drop())
    //     .then(C.letters())
    //     .then(C.char(' ').rep().drop())
    //     .then(C.letters())
    //     .map(tuple => tuple.at(0))

    // console.log(parser.val('hello Adam Jones'))


    // expr ::= identifier expr' # var
    //        | ( \ identifier -> expr ) expr' # abs
    //        | ( expr ) expr'
    //        | ( let identifier = expr in expr ) expr' # let

    // expr' ::= identifier A' | eps # app

    const genlex = new GenLex();
    const identifier = genlex.tokenize(C.letters(), 'identifier');
    const backslash = genlex.tokenize(C.char('\\'), 'backslash');
    const arrow = genlex.tokenize(C.string('->'), 'arrow');
    const lparen = genlex.tokenize(C.char('('), 'lparen');
    const rparen = genlex.tokenize(C.char(')'), 'rparen');
    const letTok = genlex.tokenize(C.string('let'), 'let');
    const equal = genlex.tokenize(C.char('='), 'equal');
    const inTok = genlex.tokenize(C.string('in'), 'in');

    // const expressionPrime = (): SingleParser<Tuple<Var>> => identifier.map(v => new Var(v)).then(F.lazy(expressionPrime)).opt().map(value => {
    //     // console.log('1', value)
    //     return value.map(v => new Var(v)).orElse(tuple());
    //     // if (v.isPresent()) {

    //     // }
    //     // // if (!v.isPresent());
    //     // return v.isPresent() ? v.value.at(0) : 'empty';
    // });

    const nestLeft = (v: Expr[]) => {
        // console.log(v);

        let expr: Expr = v[0];
        for (let i = 1; i < v.length; i++) {
            expr = new App(expr, v[i]);
        }
        return expr;
    }

    const app = () => identifier.map(value => new Var(value))
        .then(expressionPrime()).array().map(nestLeft)

    const abs = () => lparen.drop().then(backslash.drop()).then(identifier).then(arrow.drop()).then(F.lazy(expression)).then(rparen.drop()).map(tuple => new Abs(tuple.at(0), tuple.at(1)))

    const parens = () => lparen.drop().then(F.lazy(expression)).then(rparen.drop()).single()
    
    const letParser = () => lparen.drop().then(letTok.drop()).then(identifier).then(equal.drop()).then(F.lazy(expression)).then(inTok.drop()).then(F.lazy(expression)).then(rparen.drop()).map(tuple => new Let(tuple.at(0), tuple.at(1), tuple.at(2)))

    const expression = () => F.try(app())
        .or(F.try(abs()))
        .or(F.try(parens()))
        .or(F.try(letParser()))

    const expressionPrime = (): TupleParser<Var> => identifier.map(v => new Var(v)).optrep();

    const result: IParser<Expr> = genlex.use(expression().then(F.eos().drop()).single());

    expect(result.parse(Streams.ofString('(\\x -> something)')).constructor.name).toBe('Accept')
    expect(result.parse(Streams.ofString('(let x = value in something even more)')).constructor.name).toBe('Accept')
    console.log(result.parse(Streams.ofString('(let x = value in something even more)')).value.toString())
    // expect(result.parse(Streams.ofString('(let x = some value in something even more)')).constructor.name).toBe('Accept')
    // expect(result.parse(Streams.ofString('(let x = some value in (\\y -> y))')).constructor.name).toBe('Accept')
    // expect(result.parse(Streams.ofString('(let x = some value in (\\y -> y)) value')).constructor.name).toBe('Accept')
});