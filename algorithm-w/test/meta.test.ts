import { TypeVar, TypeFuncApp, Var, App, Abs } from 'language'
import { number, boolean, e, f, list, tuple, maybe, either, a, b, c, d } from './utilities';

test('function currying', () => {
    expect(f(number, number, number)).toEqual(f(number, f(number, number)));
    expect(f(number, f(number, number))).toEqual(f(number, number, number));
});

test('e parses variables', () => {
    expect(e('myNumber')).toEqual(new Var('myNumber'));
    expect(e('myBoolean')).toEqual(new Var('myBoolean'));
    expect(e('map')).toEqual(new Var('map'));
});

test('e parses function application', () => {
    expect(e('map', 'not')).toEqual(new App(new Var('map'), new Var('not')));
    expect(e('map', 'not', '[]')).toEqual(new App(new App(new Var('map'), new Var('not')), new Var('[]')));
});

test('e parses nested expressions', () => {
    expect(e('map', 'not', e('cons', 'True', '[]'))).toEqual(new App(new App(new Var('map'), new Var('not')), new App(new App(new Var('cons'), new Var('True')), new Var('[]'))));
    expect(e(new Abs('x', e('not', 'x')))).toEqual(new Abs('x', new App(new Var('not'), new Var('x'))));
    expect(e(new Abs('x', e('not', 'x')), 'True')).toEqual(new App(new Abs('x', new App(new Var('not'), new Var('x'))), new Var('True')));
});

test('list helper works', () => {
    expect(list(a)).toEqual(new TypeFuncApp('[]', new TypeVar('a')));
    expect(list(number)).toEqual(new TypeFuncApp('[]', new TypeFuncApp('number')));
})

test('tuple helper works', () => {
    expect(() => tuple(a)).toThrow();
    expect(tuple(a, b)).toEqual(new TypeFuncApp(',', a, b));
    expect(tuple(a, b, c)).toEqual(new TypeFuncApp(',,', a, b, c));
    expect(tuple(a, b, c, d)).toEqual(new TypeFuncApp(',,,', a, b, c, d));
    expect(tuple(a, b, c, d, a)).toEqual(new TypeFuncApp(',,,,', a, b, c, d, a));
    expect(tuple(a, b, c, d, a, b)).toEqual(new TypeFuncApp(',,,,,', a, b, c, d, a, b));
    expect(tuple(a, b, c, d, a, b, c)).toEqual(new TypeFuncApp(',,,,,,', a, b, c, d, a, b, c));
    expect(tuple(a, b, c, d, a, b, c, d)).toEqual(new TypeFuncApp(',,,,,,,', a, b, c, d, a, b, c, d));
    expect(() => tuple(a, b, c, d, a, b, c, d, a)).toThrow();
})

test('maybe helper works', () => {
    expect(maybe(a)).toEqual(new TypeFuncApp('Maybe', new TypeVar('a')));
    expect(maybe(number)).toEqual(new TypeFuncApp('Maybe', new TypeFuncApp('number')));
})

test('either helper works', () => {
    expect(either(a, b)).toEqual(new TypeFuncApp('Either', new TypeVar('a'), new TypeVar('b')));
    expect(either(a, number)).toEqual(new TypeFuncApp('Either', new TypeVar('a'), new TypeFuncApp('number')));
    expect(either(boolean, number)).toEqual(new TypeFuncApp('Either', new TypeFuncApp('boolean'), new TypeFuncApp('number')));
})