import React, { useState } from 'react';
import './Main.css';
import ResultView, { Highlight } from './ResultView';
import { typeUtils } from 'language';

function Main() {
  const [code, setCode] = useState<string>('map not []');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  if (document.getElementById('body')) document.getElementById('body')!.style.overflow = showHelp ? 'hidden' : '';

  return (
    <div id="main">
      {showHelp && <div className="modal" onClick={(e) => { if ((e.target as any).className === 'modal') setShowHelp(false) }}>
        <div className="modal-content">
          <button className="sans-serif" onClick={() => setShowHelp(false)}>Close</button>
          <h2>Language reference</h2>
          <p>The language is similar in syntax to Haskell. All functions are applied in prefix notation, i.e. <code>+ 3 4</code> instead of <code>3 + 4</code>.</p>
          <p>The type constructors available are:</p>
          <ul>
            <li><code>Int</code></li>
            <li><code>Char</code></li>
            <li><code>Bool</code></li>
            <li><code>-{'>'}</code> for functions</li>
            <li><code>[]</code> for lists</li>
            <li><code>,</code>, <code>,,</code>, <code>,,,</code> etc. for tuples</li>
            <li><code>Maybe</code></li>
            <li><code>Either</code></li>
          </ul>
          <p>The available set of built-in functions and their types are:</p>
          <ul>
            {Object.entries(typeUtils.standardCtx).filter(([name]) => name[0] !== ',').map(([name, type]) => <li key={name}><code>{name} :: {type?.toString()}</code></li>)}
          </ul>
        </div>
      </div>}

      <h1>interactive type inference</h1>
      <h2>
        Play with algorithm W in your browser.
      </h2>
      <p>Type inference is the ability to determine an expression's type in a language. Hindley-Milner (HM) is a typed λ-calculus which allows for complete type inference without explicit type annotations. Haskell's type system is based on HM.</p>
      <p>This tool allows you to enter expressions in syntax similar to Haskell and view how a type inference algorithm (algorithm W) could work out the types. A full list of built-in functions and their types is available <button className="sans-serif" onClick={() => setShowHelp(true)}>here</button>. Expressions must be given in prefix notation, i.e. <button onClick={() => setCode('+ 3 4')}>+ 3 4</button> instead of <button onClick={() => setCode('3 + 4')}>3 + 4</button>.</p>
      <h2>Samples:
        <button onClick={() => setCode('4')}>4</button>
        <button onClick={() => setCode('not')}>not</button>
        <button onClick={() => setCode('odd 5')}>odd 5</button>
        <button onClick={() => setCode('map not []')}>map not []</button>
        <button onClick={() => setCode('fst')}>fst</button><br className="md-only" />
        <button onClick={() => setCode('Just')}>Just</button>
        <button onClick={() => setCode('let x = 3 in (+, x)')}>let x = 3 in (+, x)</button>
        <button onClick={() => setCode('\\x -> / x 2')}>\x -{'>'} / x 2</button>
        <button onClick={() => setCode(': 23 [1]')}>: 23 [1]</button>
      </h2>
      <div className='code-container'>
        <input placeholder="Enter code..." value={code} onChange={e => setCode(e.target.value)} />
        {code && highlights.map((h, i) => <p key={i}>{code.slice(0, h.start)}<span className={h.className}>{code.slice(h.start, h.end)}</span>{code.slice(h.end)}</p>)}
      </div>
      {code && <ResultView code={code} setHighlights={setHighlights} />}
    </div>
  );
}

export default Main;
