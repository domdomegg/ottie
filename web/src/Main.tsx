import React, { useMemo, useState } from 'react';
import './Main.css';
import ResultView, { Highlight } from './ResultView';
import { typeUtils } from 'language';
import a, { b } from './analytics';

const body = document.getElementById('body') || { style: { overflow: '' } };

function Main() {
  const [code, setCode] = useState<string>('map not []');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showingHelp, setShowingHelp] = useState<boolean>(false);
  const showHelp = () => { setShowingHelp(true); a({ name: 'help', value: 'show' }); }
  const hideHelp = () => { setShowingHelp(false); a({ name: 'help', value: 'hide' });  }

  body.style.overflow = showingHelp ? 'hidden' : '';

  const resultview = useMemo(() => code && <ResultView code={code} setHighlights={setHighlights} />, [code]);

  return (
    <div id="main">
      {showingHelp && <div className="modal" onClick={(e) => { if ((e.target as any).className === 'modal') hideHelp() }}>
        <div className="modal-content">
          <button className="sans-serif" onClick={() => hideHelp()}>Close</button>
          <h2>Language reference</h2>
          <p>The language is similar in syntax to Haskell. All functions are applied in prefix notation, i.e. <code>+ 3 4</code> instead of <code>3 + 4</code>. Anonymous functions only take one parameter, i.e. <code>\x -{'>'} \y -{'>'} y x</code> instead of <code>\x y -{'>'} y x</code>.</p>
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
      <p>This tool allows you to enter expressions in syntax similar to Haskell and view how a type inference algorithm (algorithm W) could work out the types. A full list of built-in functions and their types is available <button className="sans-serif" onClick={() => showHelp()} data-testid="help-open-button">here</button>. Expressions must be given in prefix notation, i.e. <SetCodeButton value='+ 3 4' setCode={setCode} /> instead of <SetCodeButton value='3 + 4' setCode={setCode} />.</p>
      <p>Usage data such as button clicks and evaluated expressions may be collected to evaluate and improve the tool.</p>
      <h2>Samples:
        <SetCodeButton value='4' setCode={setCode} />
        <SetCodeButton value='not' setCode={setCode} />
        <SetCodeButton value='odd 5' setCode={setCode} />
        <SetCodeButton value='map not []' setCode={setCode} />
        <SetCodeButton value='fst' setCode={setCode} /><br className="md-only" />
        <SetCodeButton value='Just' setCode={setCode} />
        <SetCodeButton value='let x = 3 in (+, x)' setCode={setCode} />
        <SetCodeButton value='\x -> / x 2' setCode={setCode} />
        <SetCodeButton value=': 23 [1]' setCode={setCode} />
      </h2>
      <div className='code-container'>
        <input placeholder="Enter code..." value={code} onChange={e => { setCode(e.target.value); b({ name: 'codeChange', value: e.target.value }); }} />
        {code && highlights.map((h, i) => <p key={i}>{code.slice(0, h.start)}<span className={h.className}>{code.slice(h.start, h.end)}</span>{code.slice(h.end)}</p>)}
      </div>
      {resultview}
    </div>
  );
}

function SetCodeButton({ value, setCode }: { value: string, setCode: (code: string) => void }) {
  return <button onClick={() => { setCode(value); a({ name: 'codeButtonSet', value }); }}>{value}</button>
}

export default Main;
