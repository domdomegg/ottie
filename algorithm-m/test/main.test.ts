/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {test, expect} from 'vitest';
import extendWithInfer from 'type-test-helpers';
import {
	Var, Abs, Let, CharLiteral, NumberLiteral, typeUtils, parse, App,
} from 'language';
import {infer} from '../src/index';
const {number, char, boolean, f, list, tuple, maybe, either, a, b} = typeUtils;

extendWithInfer(infer);

test('arithmetic expressions', () => {
	expect(parse('myNumber')).toHaveType(number);
	expect(parse('3')).toHaveType(number);
	expect(parse('\'a\'')).toHaveType(char);
	expect(new NumberLiteral(3, undefined!)).toHaveType(number);
	expect(new CharLiteral('a', undefined!)).toHaveType(char);
	expect(parse('cons \'a\' []')).toHaveType(list(char));
	expect(parse('+ myNumber myNumber')).toHaveType(number);
	expect(parse('* (+ myNumber myNumber)')).toHaveType(f(number, number));
	expect(parse('+ myNumber')).toHaveType(f(number, number));
	expect(parse('- myNumber')).toHaveType(f(number, number));
	expect(parse('+')).toHaveType(f(number, number, number));
});

test('boolean expressions', () => {
	expect(parse('True')).toHaveType(boolean);
	expect(parse('True')).not.toHaveType(number);
	expect(parse('&& True False')).toHaveType(boolean);
	expect(parse('&& True')).toHaveType(f(boolean, boolean));
	expect(parse('not True')).toHaveType(boolean);
	expect(parse('not (not True)')).toHaveType(boolean);
});

test('lists', () => {
	expect(parse('[]')).toHaveType(list(a));
	expect(parse('cons False []')).toHaveType(list(boolean));
	expect(parse('++ [] []')).toHaveType(list(a));
	expect(parse('uncons []')).toHaveType(maybe(tuple(a, list(a))));
	expect(parse('uncons (cons False (cons (&& True True) []))')).toHaveType(maybe(tuple(boolean, list(boolean))));
	expect(parse('nub (cons myNumber [])')).toHaveType(list(number));
	expect(parse('delete myNumber (cons myNumber [])')).toHaveType(list(number));
});

test('mapping', () => {
	expect(parse('[]')).toHaveType(list(a));
	expect(parse('map not []')).toHaveType(list(boolean));
	expect(parse('map not')).toHaveType(f(list(boolean), list(boolean)));
	expect(parse('map fst')).toHaveType(f(list(tuple(a, b)), list(a)));
	expect(parse('map + []')).toHaveType(list(f(number, number)));
	expect(parse('map Just []')).toHaveType(list(maybe(a)));
	expect(parse('map Just (cons myNumber [])')).toHaveType(list(maybe(number)));
	expect(parse('map not (map fst (cons (myBoolean, myNumber) []))')).toHaveType(list(boolean));
});

test('maybes', () => {
	expect(parse('Nothing')).toHaveType(maybe(a));
	expect(parse('Just myNumber')).toHaveType(maybe(number));
	expect(parse('Just (+ myNumber)')).toHaveType(maybe(f(number, number)));
	expect(parse('Just Just')).toHaveType(maybe(f(a, maybe(a))));
});

test('tuples', () => {
	expect(parse('fst')).toHaveType(f(tuple(a, b), a));
	expect(parse('snd')).toHaveType(f(tuple(a, b), b));
	expect(parse('fst')).not.toHaveType(f(tuple(a, b), b));
	expect(parse('(myNumber, myNumber)')).toHaveType(tuple(number, number));
	expect(parse('fst (myNumber, myNumber)')).toHaveType(number);
	expect(parse('(curry fst) myNumber myNumber')).toHaveType(number);
});

test('eithers', () => {
	expect(parse('Left')).toHaveType(f(a, either(a, b)));
	expect(parse('Left')).not.toHaveType(f(a, either(b, a)));
	expect(parse('Right')).toHaveType(f(a, either(b, a)));
	expect(parse('Left myNumber')).toHaveType(either(number, a));
	expect(parse('Right myNumber')).toHaveType(either(a, number));
	expect(parse('Left not')).toHaveType(either(f(boolean, boolean), a));
});

test('invalid vars', () => {
	expect(() => infer(parse('thingNotInScope'))).toThrow('`thingNotInScope` is not in scope');
	expect(() => infer(parse('fst (x, 3)'))).toThrow('`x` is not in scope');
});

test('fails to add bad types', () => {
	expect(parse('+ myBoolean myNumber')).toHaveInvalidType();
	expect(parse('+ myNumber myBoolean')).toHaveInvalidType();
	expect(parse('+ myBoolean myBoolean')).toHaveInvalidType();
	expect(parse('+ +')).toHaveInvalidType();
});

test('fails to and bad types', () => {
	expect(parse('&& myBoolean myNumber')).toHaveInvalidType();
	expect(parse('&& myNumber myBoolean')).toHaveInvalidType();
	expect(parse('&& myNumber myNumber')).toHaveInvalidType();
});

test('fails to map over non list', () => {
	expect(parse('map + myNumber')).toHaveInvalidType();
	expect(parse('map && myNumber')).toHaveInvalidType();
	expect(parse('map Just myNumber')).toHaveInvalidType();
});

test('fails list operations with differnt types', () => {
	expect(parse('delete myBoolean (cons myNumber [])')).toHaveInvalidType();
	expect(parse('delete myNumber (cons myBoolean [])')).toHaveInvalidType();
	expect(parse('delete myNumber (cons (Just myNumber) [])')).toHaveInvalidType();
});

test('function definitions', () => {
	expect(parse('\\x -> not x')).toHaveType(f(boolean, boolean));
	expect(parse('\\x -> (\\y -> + x y)')).toHaveType(f(number, number, number));
	expect(parse('\\x -> (\\y -> (\\z -> + x y))')).toHaveType(f(number, number, a, number));
	expect(new Abs('x', new Abs('y', new Abs('z', parse('+ (+ x y) z'), undefined!), undefined!), undefined!)).toHaveType(f(number, number, number, number));
	expect(new Abs('x', parse('map not x'), undefined!)).toHaveType(f(list(boolean), list(boolean)));
	expect(new Abs('x', parse('map fst x'), undefined!)).toHaveType(f(list(tuple(a, b)), list(a)));
	expect(new Abs('x', parse('map not (map fst x)'), undefined!)).toHaveType(f(list(tuple(boolean, b)), list(boolean)));
	expect(new Abs('x', parse('t x'), undefined!)).toHaveType(f(a, f(b, tuple(a, b))));
	expect(new Abs('x', parse('map not (map fst x)'), undefined!)).toHaveType(f(list(tuple(boolean, a)), list(boolean)));
	expect(parse('\\x -> map (\\y -> (\\z -> - myNumber (y z))) (map + x)')).toHaveType(f(list(number), list(f(number, number))));
	expect(new Abs('x', parse('map && (map not x)'), undefined!)).toHaveType(f(list(boolean), list(f(boolean, boolean))));
	expect(new Var('fst', undefined!)).toHaveType(f(tuple(a, b), a));
	expect(new Abs('x', new App(new Var('fst', undefined!), new Var('x', undefined!), undefined!), undefined!)).toHaveType(f(tuple(a, b), a));
});

test('invalid function definitions', () => {
	expect(new Abs('x', new Abs('y', parse('+ x (not y)'), undefined!), undefined!)).toHaveInvalidType();
	expect(new Abs('x', parse('map + (map not x)'), undefined!)).toHaveInvalidType();
	expect(parse('(\\x -> not x) id')).toHaveInvalidType();
});

test('let bindings', () => {
	expect(new Let('unused', parse('myNumber'), parse('myNumber'), undefined!)).toHaveType(number);
	expect(new Let('unused', parse('myNumber'), parse('myBoolean'), undefined!)).toHaveType(boolean);

	expect(new Let('x', parse('myNumber'), parse('x'), undefined!)).toHaveType(number);
	expect(new Let('x', parse('map'), parse('x not []'), undefined!)).toHaveType(list(boolean));
	expect(new Let('x', parse('map'), parse('x not'), undefined!)).toHaveType(f(list(boolean), list(boolean)));
	expect(new Let('x', parse('map'), new Let('y', parse('not'), parse('x y []'), undefined!), undefined!)).toHaveType(list(boolean));
	expect(new Let('x', parse('map'), new Let('y', parse('not'), parse('x y'), undefined!), undefined!)).toHaveType(f(list(boolean), list(boolean)));

	// NB: x is both
	// (boolean -> boolean) -> list(boolean) -> boolean
	// (tuple(boolean, a) -> boolean) -> list(tuple(boolean, a)) -> boolean
	expect(parse('let x = map in x not (x fst (cons (myBoolean, myNumber) []))')).toHaveType(list(boolean));

	expect(new Let('id', new Abs('x', new Var('x', undefined!), undefined!), parse('id myBoolean'), undefined!)).toHaveType(boolean);
	expect(new Let('id', new Abs('x', new Var('x', undefined!), undefined!), parse('id myNumber'), undefined!)).toHaveType(number);
	expect(new Let('id', new Abs('x', new Var('x', undefined!), undefined!), parse('map even (map id [])'), undefined!)).toHaveType(list(boolean));

	// NB: id is both
	// boolean -> boolean
	// number -> number
	expect(parse('let id = (\\x -> x) in map id (map even (map id []))')).toHaveType(list(boolean));
});
