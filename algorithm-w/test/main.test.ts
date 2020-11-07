import { Var, App, TypeVar, TypeFuncApp, Expr, combine, unify } from '../src/index';
import { number, boolean, f, list, tuple, maybe, either, a, b } from './utilities';

// Helper to make writing out the AST less painful
// e('+', 'myNum', 'myNum')
// will result in
// new App(new App(v('+'), v('myNum')), new Var('myNum'))
const e = (v: string | Expr, ...args: (string | Expr)[]): Expr => {
    if (typeof v === 'string') {
        if (args.length === 0) return new Var(v);
    } else {
        if (args.length === 0) return v;
    }
    return new App(e(v, ...args.slice(0, args.length - 1)), e(args[args.length - 1]));
}

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

test('combines substitutions correctly', () => {
    expect(combine({
        t0: new TypeVar('t2'),
    }, {
        t1: new TypeVar('t3')
    })).toEqual({
        t0: new TypeVar('t2'),
        t1: new TypeVar('t3')
    });

    expect(combine({
        t0: new TypeVar('t1'),
    }, {
        t1: new TypeVar('t2'),
    })).toEqual({
        t0: new TypeVar('t2'),
        t1: new TypeVar('t2'),
    });

    expect(combine({
        t0: new TypeFuncApp('number'),
        t1: new TypeFuncApp('number')
    }, {
        t0: new TypeVar('t2')
    })).toEqual({
        t0: new TypeFuncApp('number'),
        t1: new TypeFuncApp('number')
    });
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