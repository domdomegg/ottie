import { Streams, C, GenLex } from '@masala/parser';

class ParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ParseError";
    }
}

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

const pVar = () => C.letters()

const parser = C
    .string("Hello")
    .then(C.char(' ').rep())
    .then(C.letters())
    .last();

const parse = (expression: string): Expr => {
    return new Var('test');
}

export { Var, App, Abs, Let, Expr, parse };