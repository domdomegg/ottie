import React, { useState } from 'react';
import './Main.css';
import { MonoType, Expr, Var, App, Abs, Let, parse, ParseError, NumberLiteral, CharLiteral } from 'language'
import { infer, TypeInferenceError } from 'algorithm-w'

function Main() {
  const [code, setCode] = useState('map not []');
  // Either the result or error message
  let ast: Expr | string = 'Failed to parse';
  let type: MonoType | string = 'Failed to infer type';
  try {
    ast = parse(code);
    if (!(ast instanceof CharLiteral) && !(ast instanceof NumberLiteral) && !(ast instanceof Var) && !(ast instanceof App) && !(ast instanceof Abs) && !(ast instanceof Let)) {
      throw new Error('Not a valid expression');
    }
    type = infer(ast);
  } catch (e) {
    if (e.name === ParseError.name) {
      ast = (e as ParseError).message;
    } else if (e.name === TypeInferenceError.name) {
      type = (e as TypeInferenceError).message;
    } else {
      ast = 'Not a valid expression: ' + JSON.stringify(e.message);
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
        <button onClick={() => setCode('let x = 3 in + x')}>let x = 3 in + x</button>
      </h2>
      <textarea placeholder="Enter code here..." value={code} onChange={e => setCode(e.target.value)}></textarea>

      <h2>AST</h2>
      <p>{ast.toString()}</p>

      <h2>Type</h2>
      <p>{type.toString()}</p>
    </>
  );
}

export default Main;
