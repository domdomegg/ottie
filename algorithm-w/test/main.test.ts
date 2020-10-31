import { Var, App, Abs, Let, TypeVar, TypeFunc, TypeFuncApp, MonoType, PolyType, Expr, substitute, combine, unify } from '../src/index';

// Utilities which make creating types easier
const number = new TypeFuncApp('number');
const string = new TypeFuncApp('string');
const boolean = new TypeFuncApp('boolean');
const f = (one: MonoType, two: MonoType, ...extra: MonoType[]): TypeFuncApp => {
    if (extra.length === 0) return new TypeFuncApp('->', one, two)
    return new TypeFuncApp('->', one, f(two, extra[0], ...extra.slice(1)))
}
const list = (monoType: MonoType): TypeFuncApp => new TypeFuncApp('[]', monoType);
const tuple = (...monoTypes: MonoType[]): TypeFuncApp => {
    if (monoTypes.length > 8) throw new Error('Tuple has too many elements, maximum of 8 but has ' + monoTypes.length)
    return new TypeFuncApp(','.repeat(monoTypes.length - 1) as TypeFunc, ...monoTypes);
}
const maybe = (monoType: MonoType): TypeFuncApp => new TypeFuncApp('Maybe', monoType);
const either = (left: MonoType, right: MonoType): TypeFuncApp => new TypeFuncApp('Either', left, right);
// Set up some basic things so the langauge is interesting
const standardCtx = (() => {
    const a = new TypeVar('a');
    const b = new TypeVar('b');
    const c = new TypeVar('c');
    const d = new TypeVar('d');
    const pt = (mt: MonoType) => new PolyType([], mt);

    return {
        // Arithmetic
        '+': pt(f(number, number, number)),
        '*': pt(f(number, number, number)),
        '-': pt(f(number, number, number)),
        '/': pt(f(number, number, number)),
        '%': pt(f(number, number, number)),
    
        // Booleans
        'not': pt(f(boolean, boolean)),
        '&&': pt(f(boolean, boolean, boolean)),
        '||': pt(f(boolean, boolean, boolean)),
        'True': pt(boolean),
        'False': pt(boolean),
    
        // Example variables
        'myNumber': pt(number),
        'myString': pt(string),
        'myBoolean': pt(boolean),
    
        // Lists
        '[]': new PolyType(['a'], list(a)),
        ':': new PolyType(['a'], f(a, list(a), list(a))),
        'cons': new PolyType(['a'], f(a, list(a), list(a))),
        '++': new PolyType(['a'], f(list(a), list(a), list(a))),
        'head': new PolyType(['a'], f(list(a), a)),
        'last': new PolyType(['a'], f(list(a), a)),
        'tail': new PolyType(['a'], f(list(a), list(a))),
        'init': new PolyType(['a'], f(list(a), list(a))),
        'uncons': new PolyType(['a'], f(list(a), maybe(tuple(a, list(a))))),
        'null': new PolyType(['a'], f(list(a), boolean)),
        'length': new PolyType(['a'], f(list(a), number)),
        'map': new PolyType(['a', 'b'], f(f(a, b), list(a), list(b))),
        'reverse': new PolyType(['a'], f(list(a), list(a))),
        'intersperse': new PolyType(['a'], f(a, list(a), list(a))),
        'intercalate': new PolyType(['a'], f(list(a), list(list(a)), list(a))),
        'transpose': new PolyType(['a'], f(list(list(a)), list(list((a))))),
        'subsequences': new PolyType(['a'], f(list(a), list(list((a))))),
        'permutations': new PolyType(['a'], f(list(a), list(list((a))))),
        'foldl': new PolyType(['a'], f(f(b, a, b), b, list(a), b)),
        'foldl\'': new PolyType(['a'], f(f(b, a, b), b, list(a), b)),
        'foldl1': new PolyType(['a'], f(f(a, a, a), list(a), a)),
        'foldl1\'': new PolyType(['a'], f(f(a, a, a), list(a), a)),
        'foldr': new PolyType(['a'], f(f(a, b, b), b, list(a), b)),
        'foldr1': new PolyType(['a'], f(f(a, a, a), list(a), a)),
        'concat': new PolyType(['a'], f(list(list(a)), list(a))),
        'concatMap': new PolyType(['a'], f(f(a, list(a)), list(a), list(b))),
        'and': pt(f(list(boolean), boolean)),
        'or': pt(f(list(boolean), boolean)),
        'any': new PolyType(['a'], f(f(a, boolean), list(a), boolean)),
        'all': new PolyType(['a'], f(f(a, boolean), list(a), boolean)),
        'sum': pt(f(list(number), number)),
        'product': pt(f(list(number), number)),
        'maximum': pt(f(list(number), number)),
        'minimum': pt(f(list(number), number)),
        'take': new PolyType(['a'], f(number, list(a), list(a))),
        'drop': new PolyType(['a'], f(number, list(a), list(a))),
        'splitAt': new PolyType(['a'], f(number, list(a), tuple(list(a), list(a)))),
        'takeWhile': new PolyType(['a'], f(f(a, boolean), list(a), list(a))),
        'dropWhile': new PolyType(['a'], f(f(a, boolean), list(a), list(a))),
        'elem': new PolyType(['a'], f(a, list(a), boolean)),
        'notElem': new PolyType(['a'], f(a, list(a), boolean)),
        'lookup': new PolyType(['a', 'b'], f(a, list(tuple(a, b)), maybe(b))),
        'find': new PolyType(['a'], f(f(a, boolean), list(a), maybe(a))),
        'filter': new PolyType(['a'], f(f(a, boolean), list(a), list(a))),
        'partition': new PolyType(['a'], f(f(a, boolean), list(a), tuple(list(a), list(a)))),
        '!!': new PolyType(['a'], f(list(a), number, a)),
        'zip': new PolyType(['a', 'b'], f(list(a), list(b), list(tuple(a, b)))),
        'zipWith': new PolyType(['a', 'b', 'c'], f(f(a, b, c), list(a), list(b), list(c))),
        'unzip': new PolyType(['a', 'b'], f(list(tuple(a, b)), tuple(list(a), list(b)))),
        'nub': new PolyType(['a'], f(list(a), list(a))),
        'delete': new PolyType(['a'], f(a, list(a), list(a))),
        '\\\\': new PolyType(['a'], f(list(a), list(a), list(a))),
        'union': new PolyType(['a'], f(list(a), list(a), list(a))),
        'intersect': new PolyType(['a'], f(list(a), list(a), list(a))),
        'sort': new PolyType(['a'], f(list(a), list(a))),
    
        // Tuples
        ',': new PolyType(['a', 'b'], f(a, b, tuple(a, b))),
        ',,': new PolyType(['a', 'b', 'c'], f(a, b, c, tuple(a, b, c))),
        ',,,': new PolyType(['a', 'b', 'c', 'd'], f(a, b, c, d, tuple(a, b, c, d))),
        'fst': new PolyType(['a', 'b'], f(tuple(a, b), a)),
        'snd': new PolyType(['a', 'b'], f(tuple(a, b), b)),
        'curry': new PolyType(['a', 'b', 'c'], f(f(tuple(a, b), c), a, b, c)),
        'uncurry': new PolyType(['a', 'b', 'c'], f(f(a, b, c), tuple(a, b), c)),
    
        // Maybe
        'Just': new PolyType(['a'], f(a, maybe(a))),
        'Nothing': new PolyType(['a'], maybe(a)),
        
        // Either
        'Left': new PolyType(['a', 'b'], f(a, either(a, b))),
        'Right': new PolyType(['a', 'b'], f(b, either(a, b))),
    }
})()

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

// Helper to infer with standard context
const i = (expr: Expr) => expr.infer(standardCtx)[0];

test('returns expected type', () => {
    expect(i(e('myNumber'))).toEqual(number);
    expect(i(e('+', 'myNumber', 'myNumber'))).toEqual(number);
    expect(i(e('+', 'myNumber'))).toEqual(f(number, number));
    expect(i(e('+'))).toEqual(f(number, number, number));

    expect(i(e('&&', 'True', 'False'))).toEqual(boolean);
    expect(i(e('&&', 'True'))).toEqual(f(boolean, boolean));
    expect(i(e('not', 'True'))).toEqual(boolean);

    // The commented out ones kinda work, just haven't found a nice way to test them
    // Probably need to write a cutom matcher which does variable renaming or capturing
    
    // expect(i(e('[]'))).toEqual(list(a));
    expect(i(e('map', 'not', '[]'))).toEqual(list(boolean));
    expect(i(e('map', 'not'))).toEqual(f(list(boolean), list(boolean)));
    expect(i(e('map', '+', '[]'))).toEqual(list(f(number, number)));
    // expect(i(e('++', '[]', '[]'))).toEqual(list(a));
    // expect(i(e('uncons', '[]'))).toEqual(maybe(a));
    expect(i(e('uncons', e('cons', 'False', e('cons', e('&&', 'True', 'True'), '[]'))))).toEqual(maybe(tuple(boolean, list(boolean))));

    expect(i(e('Just', 'myNumber'))).toEqual(maybe(number));
    expect(i(e('Just', e('+', 'myNumber')))).toEqual(maybe(f(number, number)));
    // expect(i(e('Just', 'Just'))).toEqual(maybe(f(a, maybe(a))));

    // expect(i(e('fst'))).toEqual(f(tuple(a, b), a));
    expect(i(e(',', 'myNumber', 'myNumber'))).toEqual(tuple(number, number));
    expect(i(e('fst', e(',', 'myNumber', 'myNumber')))).toEqual(number);
    expect(i(e(e('curry', 'fst'), 'myNumber', 'myNumber'))).toEqual(number);

})

test('fails when expected', () => {
    expect(() => i(e('+', 'myNumber', 'myBoolean'))).toThrow();
    expect(() => i(e('&&', 'myNumber', 'myNumber'))).toThrow();
    expect(() => i(e('map', '+', 'myNumber'))).toThrow();
})

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