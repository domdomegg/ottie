/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {test, expect} from 'vitest';
import {
	CharLiteral, NumberLiteral, Var, App, Abs, Let, parse, typeUtils,
} from '../src/index';

test('general: syntax error', () => {
	expect(() => parse('')).toThrow();
	expect(parse('', true).accepted).toBe(false);
});

test('var: valid', () => {
	expect(parse('True')).toEqual(new Var('True', {start: 0, end: 4}));
	expect(parse('True ')).toEqual(new Var('True', {start: 0, end: 4}));
	expect(parse('myIdentifier', true).accepted).toBe(true);
	expect(parse('myBooleans')).toEqual(new Var('myBooleans', {start: 0, end: 10}));
	expect(parse('3')).toEqual(new NumberLiteral(3, {start: 0, end: 1}));
	expect(parse('23')).toEqual(new NumberLiteral(23, {start: 0, end: 2}));
	expect(parse('add')).toEqual(new Var('add', {start: 0, end: 3}));
	expect(parse('add 3')).toEqual(new App(new Var('add', {start: 0, end: 3}), new NumberLiteral(3, {start: 4, end: 5}), {start: 0, end: 5}));
	expect(parse('h3llo')).toEqual(new Var('h3llo', {start: 0, end: 5}));
	expect(parse('\'h\'')).toEqual(new CharLiteral('h', {start: 0, end: 3}));
	expect(parse('hell0')).toEqual(new Var('hell0', {start: 0, end: 5}));
	expect(parse('_')).toEqual(new Var('_', {start: 0, end: 1}));
	expect(parse('+')).toEqual(new Var('+', {start: 0, end: 1}));
	expect(parse('-')).toEqual(new Var('-', {start: 0, end: 1}));
	expect(parse('/')).toEqual(new Var('/', {start: 0, end: 1}));
	expect(parse('*')).toEqual(new Var('*', {start: 0, end: 1}));
	expect(parse(':')).toEqual(new Var(':', {start: 0, end: 1}));
	expect(parse('-3')).toEqual(new NumberLiteral(-3, {start: 0, end: 2}));
	expect(parse('+3')).toEqual(new NumberLiteral(3, {start: 0, end: 2}));
	expect(parse('+ 3')).toEqual(new App(new Var('+', {start: 0, end: 1}), new NumberLiteral(3, {start: 2, end: 3}), {start: 0, end: 3}));
	// expect(parse('3e2')).toEqual(new NumberLiteral(300, { start: 0, end: 3 }))
});

test('var: all items in context except tuples parse', () => {
	for (const name in typeUtils.standardCtx) {
		if (name.startsWith(',')) {
			continue;
		}

		expect(parse(name)).toEqual(new Var(name, {start: 0, end: name.length}));
	}
});

test('var: syntax error', () => {
	expect(() => parse('let')).toThrow();
	expect(() => parse('🤔')).toThrow();
	expect(() => parse('#')).toThrow();
	expect(() => parse('->')).toThrow();
});

test('strings', () => {
	expect(parse('"hi"')).toEqual(new App(new App(new Var(':', {start: 1, end: 2}), new CharLiteral('h', {start: 1, end: 2}), {start: 1, end: 2}), new App(new App(new Var(':', {start: 2, end: 3}), new CharLiteral('i', {start: 2, end: 3}), {start: 2, end: 3}), new Var('[]', {start: 3, end: 4}), {start: 2, end: 3}), {start: 0, end: 4}));
	expect(parse('"I\'m"')).toEqual(new App(new App(new Var(':', {start: 1, end: 2}), new CharLiteral('I', {start: 1, end: 2}), {start: 1, end: 2}), new App(new App(new Var(':', {start: 2, end: 3}), new CharLiteral('\'', {start: 2, end: 3}), {start: 2, end: 3}), new App(new App(new Var(':', {start: 3, end: 4}), new CharLiteral('m', {start: 3, end: 4}), {start: 3, end: 4}), new Var('[]', {start: 4, end: 5}), {start: 3, end: 4}), {start: 2, end: 4}), {start: 0, end: 5}));
});

test('lists', () => {
	expect(parse('[]')).toEqual(new Var('[]', {start: 0, end: 2}));
	expect(parse('[] ')).toEqual(new Var('[]', {start: 0, end: 2}));
	expect(parse('[1]')).toEqual(new App(new App(new Var(':', {start: 1, end: 2}), new NumberLiteral(1, {start: 1, end: 2}), {start: 1, end: 2}), new Var('[]', {start: 2, end: 3}), {start: 0, end: 3}));
	expect(parse('[1] ')).toEqual(new App(new App(new Var(':', {start: 1, end: 2}), new NumberLiteral(1, {start: 1, end: 2}), {start: 1, end: 2}), new Var('[]', {start: 2, end: 3}), {start: 0, end: 3}));
	expect(parse(': 1 []')).toEqual(new App(new App(new Var(':', {start: 0, end: 1}), new NumberLiteral(1, {start: 2, end: 3}), {start: 0, end: 3}), new Var('[]', {start: 4, end: 6}), {start: 0, end: 6}));
	expect(parse('[1, 2]')).toEqual(new App(new App(new Var(':', {start: 1, end: 2}), new NumberLiteral(1, {start: 1, end: 2}), {start: 1, end: 2}), new App(new App(new Var(':', {start: 4, end: 5}), new NumberLiteral(2, {start: 4, end: 5}), {start: 4, end: 5}), new Var('[]', {start: 5, end: 6}), {start: 4, end: 6}), {start: 0, end: 6}));
	expect(parse('[1, 2, 3]')).toEqual(new App(new App(new Var(':', {start: 1, end: 2}), new NumberLiteral(1, {start: 1, end: 2}), {start: 1, end: 2}), new App(new App(new Var(':', {start: 4, end: 5}), new NumberLiteral(2, {start: 4, end: 5}), {start: 4, end: 5}), new App(new App(new Var(':', {start: 7, end: 8}), new NumberLiteral(3, {start: 7, end: 8}), {start: 7, end: 8}), new Var('[]', {start: 8, end: 9}), {start: 7, end: 9}), {start: 4, end: 9}), {start: 0, end: 9}));
	expect(parse('[a, b, c]')).toEqual(new App(new App(new Var(':', {start: 1, end: 2}), new Var('a', {start: 1, end: 2}), {start: 1, end: 2}), new App(new App(new Var(':', {start: 4, end: 5}), new Var('b', {start: 4, end: 5}), {start: 4, end: 5}), new App(new App(new Var(':', {start: 7, end: 8}), new Var('c', {start: 7, end: 8}), {start: 7, end: 8}), new Var('[]', {start: 8, end: 9}), {start: 7, end: 9}), {start: 4, end: 9}), {start: 0, end: 9}));
	expect(parse('[\'h\', \'i\']')).toEqual(new App(new App(new Var(':', {start: 1, end: 4}), new CharLiteral('h', {start: 1, end: 4}), {start: 1, end: 4}), new App(new App(new Var(':', {start: 6, end: 9}), new CharLiteral('i', {start: 6, end: 9}), {start: 6, end: 9}), new Var('[]', {start: 9, end: 10}), {start: 6, end: 10}), {start: 0, end: 10}));

	expect(parse('[not True]')).toEqual(new App(new App(new Var(':', {start: 1, end: 9}), new App(new Var('not', {start: 1, end: 4}), new Var('True', {start: 5, end: 9}), {start: 1, end: 9}), {start: 1, end: 9}), new Var('[]', {start: 9, end: 10}), {start: 0, end: 10}));
	expect(parse('[[a]]')).toEqual(new App(new App(new Var(':', {start: 1, end: 4}), new App(new App(new Var(':', {start: 2, end: 3}), new Var('a', {start: 2, end: 3}), {start: 2, end: 3}), new Var('[]', {start: 3, end: 4}), {start: 1, end: 4}), {start: 1, end: 4}), new Var('[]', {start: 4, end: 5}), {start: 0, end: 5}));
	expect(parse('[[[]]]')).toEqual(new App(new App(new Var(':', {start: 1, end: 5}), new App(new App(new Var(':', {start: 2, end: 4}), new Var('[]', {start: 2, end: 4}), {start: 2, end: 4}), new Var('[]', {start: 4, end: 5}), {start: 1, end: 5}), {start: 1, end: 5}), new Var('[]', {start: 5, end: 6}), {start: 0, end: 6}));

	// This should parse, even if it doesn't typecheck
	expect(parse('[1, a, \'a\']')).toEqual(new App(new App(new Var(':', {start: 1, end: 2}), new NumberLiteral(1, {start: 1, end: 2}), {start: 1, end: 2}), new App(new App(new Var(':', {start: 4, end: 5}), new Var('a', {start: 4, end: 5}), {start: 4, end: 5}), new App(new App(new Var(':', {start: 7, end: 10}), new CharLiteral('a', {start: 7, end: 10}), {start: 7, end: 10}), new Var('[]', {start: 10, end: 11}), {start: 7, end: 11}), {start: 4, end: 11}), {start: 0, end: 11}));
});

test('tuples', () => {
	expect(parse('(1, \'a\')')).toEqual(new App(new App(new Var(',', {start: 0, end: 1}), new NumberLiteral(1, {start: 1, end: 2}), {start: 0, end: 2}), new CharLiteral('a', {start: 4, end: 7}), {start: 0, end: 8}));
	expect(parse('(1, \'a\') ')).toEqual(new App(new App(new Var(',', {start: 0, end: 1}), new NumberLiteral(1, {start: 1, end: 2}), {start: 0, end: 2}), new CharLiteral('a', {start: 4, end: 7}), {start: 0, end: 8}));
	expect(parse('(1, \'a\', a)')).toEqual(new App(new App(new App(new Var(',,', {start: 0, end: 1}), new NumberLiteral(1, {start: 1, end: 2}), {start: 0, end: 2}), new CharLiteral('a', {start: 4, end: 7}), {start: 0, end: 7}), new Var('a', {start: 9, end: 10}), {start: 0, end: 11}));
	expect(parse('(not True, 17)')).toEqual(new App(new App(new Var(',', {start: 0, end: 1}), new App(new Var('not', {start: 1, end: 4}), new Var('True', {start: 5, end: 9}), {start: 1, end: 9}), {start: 0, end: 9}), new NumberLiteral(17, {start: 11, end: 13}), {start: 0, end: 14}));
	expect(parse('t 1 \'a\'')).toEqual(new App(new App(new Var('t', {start: 0, end: 1}), new NumberLiteral(1, {start: 2, end: 3}), {start: 0, end: 3}), new CharLiteral('a', {start: 4, end: 7}), {start: 0, end: 7}));
});

test('app: valid', () => {
	expect(parse('not True')).toEqual(new App(new Var('not', {start: 0, end: 3}), new Var('True', {start: 4, end: 8}), {start: 0, end: 8}));
	expect(parse('not (not True)')).toEqual(new App(new Var('not', {start: 0, end: 3}), new App(new Var('not', {start: 5, end: 8}), new Var('True', {start: 9, end: 13}), {start: 4, end: 14}), {start: 0, end: 14}));
	expect(parse('(map not) myBooleans')).toEqual(new App(new App(new Var('map', {start: 1, end: 4}), new Var('not', {start: 5, end: 8}), {start: 0, end: 9}), new Var('myBooleans', {start: 10, end: 20}), {start: 0, end: 20}));
	expect(parse('map not myBooleans')).toEqual(new App(new App(new Var('map', {start: 0, end: 3}), new Var('not', {start: 4, end: 7}), {start: 0, end: 7}), new Var('myBooleans', {start: 8, end: 18}), {start: 0, end: 18}));
	expect(parse('a b c d e f')).toEqual(new App(new App(new App(new App(new App(new Var('a', {start: 0, end: 1}), new Var('b', {start: 2, end: 3}), {start: 0, end: 3}), new Var('c', {start: 4, end: 5}), {start: 0, end: 5}), new Var('d', {start: 6, end: 7}), {start: 0, end: 7}), new Var('e', {start: 8, end: 9}), {start: 0, end: 9}), new Var('f', {start: 10, end: 11}), {start: 0, end: 11}));
});

test('app: syntax error', () => {
	expect(() => parse('not let')).toThrow();
	expect(() => parse('not in')).toThrow();
	expect(() => parse('not =')).toThrow();
	expect(() => parse('not ->')).toThrow();
	expect(() => parse('not \\')).toThrow();

	expect(() => parse('let not')).toThrow();
	expect(() => parse('in not')).toThrow();
	expect(() => parse('= not')).toThrow();
	expect(() => parse('-> not')).toThrow();
	expect(() => parse('\\ not')).toThrow();
});

test('abs: valid', () => {
	expect(parse('\\x -> x')).toEqual(new Abs('x', new Var('x', {start: 6, end: 7}), {start: 0, end: 7}));
	expect(parse('\\x -> (\\y -> x y)')).toEqual(new Abs('x', new Abs('y', new App(new Var('x', {start: 13, end: 14}), new Var('y', {start: 15, end: 16}), {start: 13, end: 16}), {start: 6, end: 17}), {start: 0, end: 17}));
	expect(parse('\\x -> \\y -> x y')).toEqual(new Abs('x', new Abs('y', new App(new Var('x', {start: 12, end: 13}), new Var('y', {start: 14, end: 15}), {start: 12, end: 15}), {start: 6, end: 15}), {start: 0, end: 15}));
	expect(parse('(\\x -> x)')).toEqual(new Abs('x', new Var('x', {start: 7, end: 8}), {start: 0, end: 9}));
	expect(parse('(\\x -> x True)')).toEqual(new Abs('x', new App(new Var('x', {start: 7, end: 8}), new Var('True', {start: 9, end: 13}), {start: 7, end: 13}), {start: 0, end: 14}));
	expect(parse('(\\x -> x True) not')).toEqual(new App(new Abs('x', new App(new Var('x', {start: 7, end: 8}), new Var('True', {start: 9, end: 13}), {start: 7, end: 13}), {start: 0, end: 14}), new Var('not', {start: 15, end: 18}), {start: 0, end: 18}));
	expect(parse('(\\x -> (\\y -> if x y False)) True False')).toEqual(new App(new App(new Abs('x', new Abs('y', new App(new App(new App(new Var('if', {start: 14, end: 16}), new Var('x', {start: 17, end: 18}), {start: 14, end: 18}), new Var('y', {start: 19, end: 20}), {start: 14, end: 20}), new Var('False', {start: 21, end: 26}), {start: 14, end: 26}), {start: 7, end: 27}), {start: 0, end: 28}), new Var('True', {start: 29, end: 33}), {start: 0, end: 33}), new Var('False', {start: 34, end: 39}), {start: 0, end: 39}));
});

test('abs: syntax error', () => {
	expect(() => parse('(\\ -> x)')).toThrow();
	expect(() => parse('(\\\\ -> x)')).toThrow();
	expect(() => parse('(\\\\x -> x)')).toThrow();
	expect(() => parse('(\\x = x)')).toThrow();
	expect(() => parse('(\\x --> x)')).toThrow();
	expect(() => parse('(\\x -> \\x)')).toThrow();
});

test('let: valid', () => {
	expect(parse('let x = True in x')).toEqual(new Let('x', new Var('True', {start: 8, end: 12}), new Var('x', {start: 16, end: 17}), {start: 0, end: 17}));
	expect(parse('(let x = True in x)')).toEqual(new Let('x', new Var('True', {start: 9, end: 13}), new Var('x', {start: 17, end: 18}), {start: 0, end: 19}));
	expect(parse('(let x = myBooleans in map not x)')).toEqual(new Let('x', new Var('myBooleans', {start: 9, end: 19}), new App(new App(new Var('map', {start: 23, end: 26}), new Var('not', {start: 27, end: 30}), {start: 23, end: 30}), new Var('x', {start: 31, end: 32}), {start: 23, end: 32}), {start: 0, end: 33}));
	expect(parse('(let x = not in map x myBooleans)')).toEqual(new Let('x', new Var('not', {start: 9, end: 12}), new App(new App(new Var('map', {start: 16, end: 19}), new Var('x', {start: 20, end: 21}), {start: 16, end: 21}), new Var('myBooleans', {start: 22, end: 32}), {start: 16, end: 32}), {start: 0, end: 33}));
	expect(parse('(let x = not in map x) myBooleans')).toEqual(new App(new Let('x', new Var('not', {start: 9, end: 12}), new App(new Var('map', {start: 16, end: 19}), new Var('x', {start: 20, end: 21}), {start: 16, end: 21}), {start: 0, end: 22}), new Var('myBooleans', {start: 23, end: 33}), {start: 0, end: 33}));
	expect(parse('(let x = (not) in (map x)) myBooleans')).toEqual(new App(new Let('x', new Var('not', {start: 9, end: 14}), new App(new Var('map', {start: 19, end: 22}), new Var('x', {start: 23, end: 24}), {start: 18, end: 25}), {start: 0, end: 26}), new Var('myBooleans', {start: 27, end: 37}), {start: 0, end: 37}));
	expect(parse('nub (let x = map not in x) myBooleans')).toEqual(new App(new App(new Var('nub', {start: 0, end: 3}), new Let('x', new App(new Var('map', {start: 13, end: 16}), new Var('not', {start: 17, end: 20}), {start: 13, end: 20}), new Var('x', {start: 24, end: 25}), {start: 4, end: 26}), {start: 0, end: 26}), new Var('myBooleans', {start: 27, end: 37}), {start: 0, end: 37}));
	expect(parse('map (let x = True in (\\y -> if x y (not y))) myBooleans')).toEqual(new App(new App(new Var('map', {start: 0, end: 3}), new Let('x', new Var('True', {start: 13, end: 17}), new Abs('y', new App(new App(new App(new Var('if', {start: 28, end: 30}), new Var('x', {start: 31, end: 32}), {start: 28, end: 32}), new Var('y', {start: 33, end: 34}), {start: 28, end: 34}), new App(new Var('not', {start: 36, end: 39}), new Var('y', {start: 40, end: 41}), {start: 35, end: 42}), {start: 28, end: 42}), {start: 21, end: 43}), {start: 4, end: 44}), {start: 0, end: 44}), new Var('myBooleans', {start: 45, end: 55}), {start: 0, end: 55}));
});

test('let: syntax error', () => {
	expect(() => parse('let x = True in')).toThrow();
	expect(() => parse('let')).toThrow();
	expect(() => parse('let ')).toThrow();
	expect(() => parse('in')).toThrow();
	expect(() => parse('in ')).toThrow();
	expect(() => parse('not let')).toThrow();
	expect(() => parse('not let 3')).toThrow();
	expect(() => parse('not in')).toThrow();
	expect(() => parse('(let x = True in )')).toThrow();
	expect(() => parse('(let x = True i x)')).toThrow();
	expect(() => parse('(let x = True in in x)')).toThrow();
	expect(() => parse('(let x = let in x)')).toThrow();
	expect(() => parse('(let x = = in x)')).toThrow();
	expect(() => parse('(let x in x)')).toThrow();
});
