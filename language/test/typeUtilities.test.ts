import { test, expect } from 'vitest';
import { TypeVar, TypeFuncApp, Var, App, Abs, typeUtils } from '../src/index';
const { number, boolean, f, list, tuple, maybe, either, a, b, c, d } = typeUtils;

test('function currying', () => {
    expect(f(number, number, number)).toEqual(f(number, f(number, number)));
    expect(f(number, f(number, number))).toEqual(f(number, number, number));
});

test('list helper works', () => {
    expect(list(a)).toEqual(new TypeFuncApp('[]', new TypeVar('a')));
    expect(list(number)).toEqual(new TypeFuncApp('[]', new TypeFuncApp('Int')));
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
    expect(() => tuple(a, b, c, d, a, b, c, d, a, b)).toThrow();
})

test('maybe helper works', () => {
    expect(maybe(a)).toEqual(new TypeFuncApp('Maybe', new TypeVar('a')));
    expect(maybe(number)).toEqual(new TypeFuncApp('Maybe', new TypeFuncApp('Int')));
})

test('either helper works', () => {
    expect(either(a, b)).toEqual(new TypeFuncApp('Either', new TypeVar('a'), new TypeVar('b')));
    expect(either(a, number)).toEqual(new TypeFuncApp('Either', new TypeVar('a'), new TypeFuncApp('Int')));
    expect(either(boolean, number)).toEqual(new TypeFuncApp('Either', new TypeFuncApp('Bool'), new TypeFuncApp('Int')));
})