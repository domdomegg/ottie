/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {test, expect} from 'vitest';
import {
	TypeVar, typeUtils, combine, unify, apply,
} from '../src';
const {number, boolean, f, tuple, maybe} = typeUtils;
const [t0, t1, t2, t3] = [0, 1, 2, 3].map((v) => new TypeVar(`t${v.toString()}`));

test('combines substitutions correctly', () => {
	expect(combine()).toEqual({});
	expect(combine({})).toEqual({});
	expect(combine({t0: t1})).toEqual({t0: t1});

	expect(combine({t0: t2}, {t1: t3})).toEqual({t0: t2, t1: t3});
	expect(combine({t0: number}, {t1: boolean})).toEqual({t0: number, t1: boolean});

	expect(combine({t0: t1}, {t1: t2})).toEqual({t0: t2, t1: t2});
	expect(combine({t1: t2}, {t0: t1})).toEqual({t1: t2, t0: t1});

	expect(combine({t0: t2}, {t0: number, t1: number})).toEqual({t0: t2, t1: number});

	expect(combine({t0: boolean}, {t0: number})).toEqual({t0: boolean});
	expect(combine({t0: boolean, t1: boolean}, {t0: number, t1: number})).toEqual({t0: boolean, t1: boolean});
	expect(combine({t0: boolean, t1: number}, {t0: number, t1: boolean})).toEqual({t0: boolean, t1: number});
});

test('combines equivalence', () => {
	expect(apply({t0: t1}, t0)).toEqual(t1);
	expect(apply(combine({t0: t1}), t0)).toEqual(t1);

	expect(apply(({t1: t2}), apply({t0: t1}, t0))).toEqual(t2);
	expect(apply(combine({t0: t1}, {t1: t2}), t0)).toEqual(t2);

	expect(apply({t2: t3}, apply({t1: t2}, apply({t0: t1}, t0)))).toEqual(t3);
	expect(apply(combine({t0: t1}, {t1: t2}, {t2: t3}), t0)).toEqual(t3);

	expect(apply({t3: number}, apply({t2: t3}, apply({t1: t2}, apply({t0: t1}, t0))))).toEqual(number);
	expect(apply(combine({t0: t1}, {t1: t2}, {t2: t3}, {t3: number}), t0)).toEqual(number);

	// NB: substitution should happen at once, so only t1/t0 gets applied
	expect(apply({t0: t1, t1: t2}, t0)).toEqual(t1);
	expect(apply(combine({t0: t1, t1: t2}), t0)).toEqual(t1);

	// ...but applying a t2/t1 afterwards should still get applied
	expect(apply({t1: t2}, apply({t0: t1, t1: t2}, t0))).toEqual(t2);
	expect(apply(combine({t0: t1, t1: t2}, {t1: t2}), t0)).toEqual(t2);

	// If we apply the number/t2 first, there are no t2s to match at that point
	expect(apply({t1: t2}, apply({t0: t1}, apply({t2: number}, t0)))).toEqual(t2);
	expect(apply(combine({t2: number}, {t0: t1}, {t1: t2}), t0)).toEqual(t2);

	expect(apply({}, t0)).toEqual(t0);
	expect(apply(combine(), t0)).toEqual(t0);
	expect(apply(combine({}), t0)).toEqual(t0);
});

test('unifies types correctly', () => {
	expect(unify(new TypeVar('t0'), new TypeVar('t1')))
		.toEqual({t0: new TypeVar('t1')});

	expect(unify(new TypeVar('t1'), new TypeVar('t0')))
		.toEqual({t1: new TypeVar('t0')});

	expect(unify(maybe(number), new TypeVar('t0')))
		.toEqual({t0: maybe(number)});

	expect(unify(maybe(number), maybe(new TypeVar('t0'))))
		.toEqual({t0: number});

	expect(unify(new TypeVar('t0'), maybe(number)))
		.toEqual({t0: maybe(number)});

	expect(unify(maybe(new TypeVar('t0')), maybe(number)))
		.toEqual({t0: number});

	expect(unify(f(number, number), new TypeVar('t0')))
		.toEqual({t0: f(number, number)});

	expect(unify(f(number, number), f(new TypeVar('t0'), new TypeVar('t1'))))
		.toEqual({t0: number, t1: number});

	expect(unify(maybe(maybe(maybe(maybe(f(number, f(number, boolean)))))), maybe(maybe(maybe(new TypeVar('t0'))))))
		.toEqual({t0: maybe(f(number, f(number, boolean)))});

	expect(unify(maybe(f(number, f(number, boolean))), maybe(f(new TypeVar('t0'), new TypeVar('t1')))))
		.toEqual({
			t0: number,
			t1: f(number, boolean),
		});

	expect(unify(tuple(number, number), tuple(new TypeVar('t0'), new TypeVar('t1'))))
		.toEqual({
			t0: number,
			t1: number,
		});

	expect(unify(f(tuple(number, number), number), f(tuple(new TypeVar('t0'), new TypeVar('t1')), number)))
		.toEqual({
			t0: number,
			t1: number,
		});

	expect(unify(f(new TypeVar('t0'), number), f(number, new TypeVar('t1'))))
		.toEqual({
			t0: number,
			t1: number,
		});

	expect(unify(f(new TypeVar('t0'), new TypeVar('t0')), f(number, new TypeVar('t1'))))
		.toEqual({
			t0: number,
			t1: number,
		});

	expect(unify(f(tuple(new TypeVar('t0'), new TypeVar('t1')), new TypeVar('t0')), f(tuple(number, number), new TypeVar('t2'))))
		.toEqual({
			t0: number,
			t1: number,
			t2: number,
		});

	expect(unify(new TypeVar('t0'), new TypeVar('t0')))
		.toEqual({});
});

test('unifying rejects un-unifyable types', () => {
	expect(() => unify(number, boolean)).toThrow('Could not unify types `Int` and `Bool` with different constructors `Int` and `Bool`');
	expect(() => unify(boolean, number)).toThrow();
	expect(() => unify(maybe(number), number)).toThrow('Could not unify types `Maybe Int` and `Int` with different constructors `Maybe` and `Int`');
	expect(() => unify(number, maybe(number))).toThrow();
	expect(() => unify(maybe(boolean), maybe(number))).toThrow('Could not unify types `Bool` and `Int` with different constructors `Bool` and `Int`');
	expect(() => unify(maybe(maybe(maybe(number))), maybe(maybe(number)))).toThrow();
	expect(() => unify(maybe(maybe(maybe(number))), maybe(maybe(maybe(boolean))))).toThrow();
	expect(() => unify(f(number, number), number)).toThrow('Could not unify types `Int -> Int` and `Int` with different constructors `->` and `Int`');
	expect(() => unify(f(number, number), f(number, boolean))).toThrow('Could not unify types `Int` and `Bool` with different constructors `Int` and `Bool`');
	expect(() => unify(f(number, number), f(number, number, number))).toThrow();
});
