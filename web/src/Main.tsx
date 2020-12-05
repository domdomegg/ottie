import React, { useState } from 'react';
import './Main.css';
import { TypeVar, TypeFunc, TypeFuncApp, MonoType, PolyType, Expr, Var, App, Abs, Let, parse, ParseError, NumberLiteral, CharLiteral } from 'language'
import { Context, infer, TypeInferenceError } from 'algorithm-w'

// Helper to make writing out the AST less painful
// e('+', 'myNum', 'myNum')
// will result in
// new App(new App(v('+'), v('myNum')), new Var('myNum'))
export const e = (v: string | Expr, ...args: (string | Expr)[]): Expr => {
  if (typeof v === 'string') {
      if (args.length === 0) return new Var(v);
  } else {
      if (args.length === 0) return v;
  }
  return new App(e(v, ...args.slice(0, args.length - 1)), e(args[args.length - 1]));
}

// Utilities which make creating types easier
export const number = new TypeFuncApp('number');
export const boolean = new TypeFuncApp('boolean');
export const f = (one: MonoType, two: MonoType, ...extra: MonoType[]): TypeFuncApp => {
    if (extra.length === 0) return new TypeFuncApp('->', one, two)
    return new TypeFuncApp('->', one, f(two, extra[0], ...extra.slice(1)))
}
export const list = (monoType: MonoType): TypeFuncApp => new TypeFuncApp('[]', monoType);
export const tuple = (...monoTypes: MonoType[]): TypeFuncApp => {
    if (monoTypes.length <= 1) throw new Error('Tuple has too few elements, minimum of 2 but given ' + monoTypes.length)
    if (monoTypes.length > 8) throw new Error('Tuple has too many elements, maximum of 8 but given ' + monoTypes.length)
    return new TypeFuncApp(','.repeat(monoTypes.length - 1) as TypeFunc, ...monoTypes);
}
export const maybe = (monoType: MonoType): TypeFuncApp => new TypeFuncApp('Maybe', monoType);
export const either = (left: MonoType, right: MonoType): TypeFuncApp => new TypeFuncApp('Either', left, right);

export const a = new TypeVar('a');
export const b = new TypeVar('b');
export const c = new TypeVar('c');
export const d = new TypeVar('d');
const pt = (mt: MonoType) => new PolyType([], mt);

// Set up some basic things so the langauge is interesting
export const standardCtx: Context = {
  // Arithmetic
  '+': pt(f(number, number, number)),
  '*': pt(f(number, number, number)),
  '-': pt(f(number, number, number)),
  '/': pt(f(number, number, number)),
  '%': pt(f(number, number, number)),
  'negate': pt(f(number, number)),
  'abs': pt(f(number, number)),
  'signum': pt(f(number, number)),
  'even': pt(f(number, boolean)),
  'odd': pt(f(number, boolean)),

  // Booleans
  'not': pt(f(boolean, boolean)),
  '&&': pt(f(boolean, boolean, boolean)),
  '||': pt(f(boolean, boolean, boolean)),
  'True': pt(boolean),
  'False': pt(boolean),

  // Example variables
  'myNumber': pt(number),
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

function Main() {
  const [code, setCode] = useState('map not []');
  let result = 'Error: ';
  try {
    const r = parse(code);
    if (!(r instanceof CharLiteral) && !(r instanceof NumberLiteral) && !(r instanceof Var) && !(r instanceof App) && !(r instanceof Abs) && !(r instanceof Let)) {
      throw new Error('Not a valid expression');
    }
    result = infer(r, standardCtx).toString();
  } catch (e) {
    if (e.name === TypeInferenceError.name) {
      result += (e as TypeInferenceError).message;
    } else if (e.name === ParseError.name) {
      result += (e as ParseError).message;
    } else {
      result += 'Not a valid expression: ' + e.message;
    }
  }

  return (
    <>
      <h1>interactive type inference</h1>
      <h2>
        Play with algorithm W in your browser.
      </h2>
      <h2>Samples:
        <button onClick={() => setCode('4')}>4</button>
        <button onClick={() => setCode('+')}>+</button>
        <button onClick={() => setCode('map not []')}>map not []</button>
        <button onClick={() => setCode('fst')}>fst</button>
        <button onClick={() => setCode('Just')}>Just</button>
      </h2>
      <textarea placeholder="Enter code here..." value={code} onChange={e => setCode(e.target.value)}></textarea>
      <h2>Result</h2>
      <p>{result}</p>
    </>
  );
}

export default Main;
