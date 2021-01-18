import './jest.setup'
import { TypeVar, Var, Abs, Let, CharLiteral, NumberLiteral, typeUtils, parse, App } from 'language'
import { combine, unify, apply, infer } from '../src/index';
const { number, char, boolean, f, list, tuple, maybe, either, a, b } = typeUtils;
const [t0, t1, t2, t3] = [0, 1, 2, 3].map(v => new TypeVar('t' + v.toString()))

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
    expect(() => infer(parse('thingNotInScope'))).toThrow('`thingNotInScope` is not in scope')
    expect(() => infer(parse('fst (x, 3)'))).toThrow('`x` is not in scope')
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
    expect(new Var('fst', undefined!)).toHaveType(f(tuple(a, b), a))
    expect(new Abs('x', new App(new Var('fst', undefined!), new Var('x', undefined!), undefined!), undefined!)).toHaveType(f(tuple(a, b), a))
});

test('invalid function definitions', () => {
    expect(new Abs('x', new Abs('y', parse('+ x (not y)'), undefined!), undefined!)).toHaveInvalidType();
    expect(new Abs('x', parse('map + (map not x)'), undefined!)).toHaveInvalidType();
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
    expect(parse('let x = map in x not (x fst (cons (myBoolean, myNumber) []))')).toHaveType(list(boolean))

    expect(new Let('id', new Abs('x', new Var('x', undefined!), undefined!), parse('id myBoolean'), undefined!)).toHaveType(boolean);
    expect(new Let('id', new Abs('x', new Var('x', undefined!), undefined!), parse('id myNumber'), undefined!)).toHaveType(number);
    expect(new Let('id', new Abs('x', new Var('x', undefined!), undefined!), parse('map even (map id [])'), undefined!)).toHaveType(list(boolean));
    
    // NB: id is both
    // boolean -> boolean
    // number -> number
    expect(parse('let id = (\\x -> x) in map id (map even (map id []))')).toHaveType(list(boolean));
});

test('combines substitutions correctly', () => {
    expect(combine()).toEqual({});
    expect(combine({})).toEqual({});
    expect(combine({ t0: t1 })).toEqual({ t0: t1 });

    expect(combine({ t0: t2 }, { t1: t3 })).toEqual({ t0: t2, t1: t3 });
    expect(combine({ t0: number }, { t1: boolean })).toEqual({ t0: number, t1: boolean });

    expect(combine({ t0: t1 }, { t1: t2 })).toEqual({ t0: t2, t1: t2 });
    expect(combine({ t1: t2 }, { t0: t1 })).toEqual({ t1: t2, t0: t1 });

    expect(combine({ t0: t2 }, { t0: number, t1: number })).toEqual({ t0: t2, t1: number });

    expect(combine({ t0: boolean }, { t0: number })).toEqual({ t0: boolean });
    expect(combine({ t0: boolean, t1: boolean }, { t0: number, t1: number })).toEqual({ t0: boolean, t1: boolean });
    expect(combine({ t0: boolean, t1: number }, { t0: number, t1: boolean })).toEqual({ t0: boolean, t1: number });
})

test('combines equivalence', () => {
    expect(apply(t0, { t0: t1 })).toEqual(t1);
    expect(apply(t0, combine({ t0: t1 }))).toEqual(t1);
    
    expect(apply(apply(t0, { t0: t1 }), ({ t1: t2 }))).toEqual(t2);
    expect(apply(t0, combine({ t0: t1 }, { t1: t2 }))).toEqual(t2);

    expect(apply(apply(apply(t0, { t0: t1 }), { t1: t2 }), { t2: t3 })).toEqual(t3);
    expect(apply(t0, combine({ t0: t1 }, { t1: t2 }, { t2: t3 }))).toEqual(t3);

    expect(apply(apply(apply(apply(t0, { t0: t1 }), { t1: t2 }), { t2: t3 }), { t3: number })).toEqual(number);
    expect(apply(t0, combine({ t0: t1 }, { t1: t2 }, { t2: t3 }, { t3: number }))).toEqual(number);

    // NB: substitution should happen at once, so only t1/t0 gets applied
    expect(apply(t0, { t0: t1, t1: t2 })).toEqual(t1);
    expect(apply(t0, combine({ t0: t1, t1: t2 }))).toEqual(t1);
    
    // ...but applying a t2/t1 afterwards should still get applied
    expect(apply(apply(t0, { t0: t1, t1: t2 }), { t1: t2 })).toEqual(t2);
    expect(apply(t0, combine({ t0: t1, t1: t2 }, { t1: t2 }))).toEqual(t2);

    // If we apply the number/t2 first, there are no t2s to match at that point
    expect(apply(apply(apply(t0, { t2: number }), { t0: t1 }), { t1: t2 })).toEqual(t2);
    expect(apply(t0, combine({ t2: number }, { t0: t1 }, { t1: t2 }))).toEqual(t2);

    expect(apply(t0, {})).toEqual(t0);
    expect(apply(t0, combine())).toEqual(t0);
    expect(apply(t0, combine({}))).toEqual(t0);
})

test('unifies types correctly', () => {
    expect(unify(new TypeVar('t0'), new TypeVar('t1')))
        .toEqual({ t0: new TypeVar('t1') });

    expect(unify(new TypeVar('t1'), new TypeVar('t0')))
        .toEqual({ t1: new TypeVar('t0') });

    expect(unify(maybe(number), new TypeVar('t0')))
        .toEqual({ t0: maybe(number) });

    expect(unify(maybe(number), maybe(new TypeVar('t0'))))
        .toEqual({ t0: number });

    expect(unify(new TypeVar('t0'), maybe(number)))
        .toEqual({ t0: maybe(number) });

    expect(unify(maybe(new TypeVar('t0')), maybe(number)))
        .toEqual({ t0: number });

    expect(unify(f(number, number), new TypeVar('t0')))
        .toEqual({ t0: f(number, number) });

    expect(unify(f(number, number), f(new TypeVar('t0'), new TypeVar('t1'))))
        .toEqual({ t0: number, t1: number });

    expect(unify(maybe(maybe(maybe(maybe(f(number, f(number, boolean)))))), maybe(maybe(maybe(new TypeVar('t0'))))))
        .toEqual({ t0: maybe(f(number, f(number, boolean))) });

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
});

test('unifying rejects un-unifyable types', () => {
    expect(() => unify(number, boolean)).toThrow('Could not unify types `number` and `boolean` with different constructors `number` and `boolean`');
    expect(() => unify(boolean, number)).toThrow();
    expect(() => unify(maybe(number), number)).toThrow('Could not unify types `Maybe number` and `number` with different constructors `Maybe` and `number`');
    expect(() => unify(number, maybe(number))).toThrow();
    expect(() => unify(maybe(boolean), maybe(number))).toThrow('Could not unify types `boolean` and `number` with different constructors `boolean` and `number`');
    expect(() => unify(maybe(maybe(maybe(number))), maybe(maybe(number)))).toThrow();
    expect(() => unify(maybe(maybe(maybe(number))), maybe(maybe(maybe(boolean))))).toThrow();
    expect(() => unify(f(number, number), number)).toThrow('Could not unify types `number -> number` and `number` with different constructors `->` and `number`');
    expect(() => unify(f(number, number), f(number, boolean))).toThrow('Could not unify types `number` and `boolean` with different constructors `number` and `boolean`');
    expect(() => unify(f(number, number), f(number, number, number))).toThrow();
});