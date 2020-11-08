import { Abs, TypeVar, combine, unify, Let, Var } from '../src/index';
import { number, boolean, e, f, list, tuple, maybe, either, a, b, t0, t1, t2, t3 } from './utilities';

test('arithmetic expressions', () => {
    expect(e('myNumber')).toHaveType(number);
    expect(e('+', 'myNumber', 'myNumber')).toHaveType(number);
    expect(e('*', e('+', 'myNumber', 'myNumber'))).toHaveType(f(number, number));
    expect(e('+', 'myNumber')).toHaveType(f(number, number));
    expect(e('-', 'myNumber')).toHaveType(f(number, number));
    expect(e('+')).toHaveType(f(number, number, number));
});

test('boolean expressions', () => {
    expect(e('True')).toHaveType(boolean);
    expect(e('True')).not.toHaveType(number);
    expect(e('&&', 'True', 'False')).toHaveType(boolean);
    expect(e('&&', 'True')).toHaveType(f(boolean, boolean));
    expect(e('not', 'True')).toHaveType(boolean);
    expect(e('not', e('not', 'True'))).toHaveType(boolean);
});

test('lists', () => {
    expect(e('[]')).toHaveType(list(a));
    expect(e('cons', 'False', '[]')).toHaveType(list(boolean));
    expect(e('++', '[]', '[]')).toHaveType(list(a));
    expect(e('uncons', '[]')).toHaveType(maybe(tuple(a, list(a))));
    expect(e('uncons', e('cons', 'False', e('cons', e('&&', 'True', 'True'), '[]')))).toHaveType(maybe(tuple(boolean, list(boolean))));
    expect(e('nub', e('cons', 'myNumber', '[]'))).toHaveType(list(number));
    expect(e('delete', 'myNumber', e('cons', 'myNumber', '[]'))).toHaveType(list(number));
});

test('mapping', () => {
    expect(e('[]')).toHaveType(list(a));
    expect(e('map', 'not', '[]')).toHaveType(list(boolean));
    expect(e('map', 'not')).toHaveType(f(list(boolean), list(boolean)));
    expect(e('map', 'fst')).toHaveType(f(list(tuple(a, b)), list(a)));
    expect(e('map', '+', '[]')).toHaveType(list(f(number, number)));
    expect(e('map', 'Just', '[]')).toHaveType(list(maybe(a)));
    expect(e('map', 'Just', e('cons', 'myNumber', '[]'))).toHaveType(list(maybe(number)));
    expect(e('map', 'not', e('map', 'fst', e('cons', e(',', 'myBoolean', 'myNumber'), '[]')))).toHaveType(list(boolean));
});

test('maybes', () => {
    expect(e('Nothing')).toHaveType(maybe(a));
    expect(e('Just', 'myNumber')).toHaveType(maybe(number));
    expect(e('Just', e('+', 'myNumber'))).toHaveType(maybe(f(number, number)));
    expect(e('Just', 'Just')).toHaveType(maybe(f(a, maybe(a))));
});

test('tuples', () => {
    expect(e('fst')).toHaveType(f(tuple(a, b), a));
    expect(e('snd')).toHaveType(f(tuple(a, b), b));
    expect(e('fst')).not.toHaveType(f(tuple(a, b), b));
    expect(e(',', 'myNumber', 'myNumber')).toHaveType(tuple(number, number));
    expect(e('fst', e(',', 'myNumber', 'myNumber'))).toHaveType(number);
    expect(e(e('curry', 'fst'), 'myNumber', 'myNumber')).toHaveType(number);
});

test('eithers', () => {
    expect(e('Left')).toHaveType(f(a, either(a, b)));
    expect(e('Left')).not.toHaveType(f(a, either(b, a)));
    expect(e('Right')).toHaveType(f(a, either(b, a)));
    expect(e('Left', 'myNumber')).toHaveType(either(number, a));
    expect(e('Right', 'myNumber')).toHaveType(either(a, number));
    expect(e('Left', 'not')).toHaveType(either(f(boolean, boolean), a));
});

test('fails to add bad types', () => {
    expect(e('+', 'myBoolean', 'myNumber')).toHaveInvalidType();
    expect(e('+', 'myNumber', 'myBoolean')).toHaveInvalidType();
    expect(e('+', 'myBoolean', 'myBoolean')).toHaveInvalidType();
    expect(e('+', '+')).toHaveInvalidType();
});

test('fails to and bad types', () => {
    expect(e('&&', 'myBoolean', 'myNumber')).toHaveInvalidType();
    expect(e('&&', 'myNumber', 'myBoolean')).toHaveInvalidType();
    expect(e('&&', 'myNumber', 'myNumber')).toHaveInvalidType();
});

test('fails to map over non list', () => {
    expect(e('map', '+', 'myNumber')).toHaveInvalidType();
    expect(e('map', '&&', 'myNumber')).toHaveInvalidType();
    expect(e('map', 'Just', 'myNumber')).toHaveInvalidType();
});

test('fails list operations with differnt types', () => {
    expect(e('delete', 'myBoolean', e('cons', 'myNumber', '[]'))).toHaveInvalidType();
    expect(e('delete', 'myNumber', e('cons', 'myBoolean', '[]'))).toHaveInvalidType();
    expect(e('delete', 'myNumber', e('cons', e('Just', 'myNumber'), '[]'))).toHaveInvalidType();
});

test('function definitions', () => {
    expect(new Abs('x', e('not', 'x'))).toHaveType(f(boolean, boolean));
    expect(new Abs('x', new Abs('y', e('+', 'x', 'y')))).toHaveType(f(number, number, number));
    expect(new Abs('x', new Abs('y', new Abs('z', e('+', 'x', 'y'))))).toHaveType(f(number, number, a, number));
    expect(new Abs('x', new Abs('y', new Abs('z', e('+', e('+', 'x', 'y'), 'z'))))).toHaveType(f(number, number, number, number));
    expect(new Abs('x', e('map', 'not', 'x'))).toHaveType(f(list(boolean), list(boolean)));
    expect(new Abs('x', e('map', 'fst', 'x'))).toHaveType(f(list(tuple(a, b)), list(a)));
    expect(new Abs('x', e('map', 'not', e('map', 'fst', 'x')))).toHaveType(f(list(tuple(boolean, b)), list(boolean)));
    expect(new Abs('x', e(',', 'x'))).toHaveType(f(a, f(b, tuple(a, b))));
    expect(new Abs('x', e('map', 'not', e('map', 'fst', 'x')))).toHaveType(f(list(tuple(boolean, a)), list(boolean)));
    expect(new Abs('x', e('map', new Abs('y', new Abs('z', e('-', 'myNumber', e('y', 'z')))), e('map', '+', 'x')))).toHaveType(f(list(number), list(f(number, number))));
    expect(new Abs('x', e('map', '&&', e('map', 'not', 'x')))).toHaveType(f(list(boolean), list(f(boolean, boolean))));
});

test('invalid function definitions', () => {
    expect(new Abs('x', new Abs('y', e('+', 'x', e('not', 'y'))))).toHaveInvalidType();
    expect(new Abs('x', e('map', '+', e('map', 'not', 'x')))).toHaveInvalidType();
});

test('let bindings', () => {
    expect(new Let('unused', e('myNumber'), e('myNumber'))).toHaveType(number);
    expect(new Let('unused', e('myNumber'), e('myBoolean'))).toHaveType(boolean);

    expect(new Let('x', e('myNumber'), e('x'))).toHaveType(number);
    expect(new Let('x', e('map'), e('x', 'not', '[]'))).toHaveType(list(boolean));
    expect(new Let('x', e('map'), e('x', 'not'))).toHaveType(f(list(boolean), list(boolean)));
    expect(new Let('x', e('map'), new Let('y', e('not'), e('x', 'y', '[]')))).toHaveType(list(boolean));
    expect(new Let('x', e('map'), new Let('y', e('not'), e('x', 'y')))).toHaveType(f(list(boolean), list(boolean)));

    // NB: x is both
    // (boolean -> boolean) -> list(boolean) -> boolean
    // (tuple(boolean, a) -> boolean) -> list(tuple(boolean, a)) -> boolean
    expect(new Let('x', e('map'), e('x', 'not', e('x', 'fst', e('cons', e(',', 'myBoolean', 'myNumber'), '[]'))))).toHaveType(list(boolean))

    expect(new Let('id', new Abs('x', new Var('x')), e('id', 'myBoolean'))).toHaveType(boolean);
    expect(new Let('id', new Abs('x', new Var('x')), e('id', 'myNumber'))).toHaveType(number);
    expect(new Let('id', new Abs('x', new Var('x')), e('map', 'even', e('map', 'id', '[]')))).toHaveType(list(boolean));
    
    // NB: id is both
    // boolean -> boolean
    // number -> number
    expect(new Let('id', new Abs('x', new Var('x')), e('map', 'id', e('map', 'even', e('map', 'id', '[]'))))).toHaveType(list(boolean));
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
    expect(t0.apply({ t0: t1 })).toEqual(t1);
    expect(t0.apply(combine({ t0: t1 }))).toEqual(t1);
    
    expect(t0.apply({ t0: t1 }).apply({ t1: t2 })).toEqual(t2);
    expect(t0.apply(combine({ t0: t1 }, { t1: t2 }))).toEqual(t2);

    expect(t0.apply({ t0: t1 }).apply({ t1: t2 }).apply({ t2: t3 })).toEqual(t3);
    expect(t0.apply(combine({ t0: t1 }, { t1: t2 }, { t2: t3 }))).toEqual(t3);

    expect(t0.apply({ t0: t1 }).apply({ t1: t2 }).apply({ t2: t3 }).apply({ t3: number })).toEqual(number);
    expect(t0.apply(combine({ t0: t1 }, { t1: t2 }, { t2: t3 }, { t3: number }))).toEqual(number);

    // NB: substitution should happen at once, so only t1/t0 gets applied
    expect(t0.apply({ t0: t1, t1: t2 })).toEqual(t1);
    expect(t0.apply(combine({ t0: t1, t1: t2 }))).toEqual(t1);
    
    // ...but applying a t2/t1 afterwards should still get applied
    expect(t0.apply({ t0: t1, t1: t2 }).apply({ t1: t2 })).toEqual(t2);
    expect(t0.apply(combine({ t0: t1, t1: t2 }, { t1: t2 }))).toEqual(t2);

    // If we apply the number/t2 first, there are no t2s to match at that point
    expect(t0.apply({ t2: number }).apply({ t0: t1 }).apply({ t1: t2 })).toEqual(t2);
    expect(t0.apply(combine({ t2: number }, { t0: t1 }, { t1: t2 }))).toEqual(t2);

    expect(t0.apply({})).toEqual(t0);
    expect(t0.apply(combine())).toEqual(t0);
    expect(t0.apply(combine({}))).toEqual(t0);
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
    expect(() => unify(number, boolean)).toThrow();
    expect(() => unify(boolean, number)).toThrow();
    expect(() => unify(maybe(number), number)).toThrow();
    expect(() => unify(number, maybe(number))).toThrow();
    expect(() => unify(maybe(boolean), maybe(number))).toThrow();
    expect(() => unify(maybe(maybe(maybe(number))), maybe(maybe(number)))).toThrow();
    expect(() => unify(maybe(maybe(maybe(number))), maybe(maybe(maybe(boolean))))).toThrow();
    expect(() => unify(f(number, number), number)).toThrow();
    expect(() => unify(f(number, number), f(number, boolean))).toThrow();
    expect(() => unify(f(number, number), f(number, number, number))).toThrow();
});