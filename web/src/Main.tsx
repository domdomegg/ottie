import React, { useState } from 'react';
import './Main.css';
import ResultView, { Highlight } from './ResultView';

function Main() {
  const [code, setCode] = useState('map not []');
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  return (
    <>
      <h1>interactive type inference</h1>
      <h2>
        Play with algorithm W in your browser.
      </h2>
      <h2>Samples:
        <button onClick={() => setCode('4')}>4</button>
        <button onClick={() => setCode('not')}>not</button>
        <button onClick={() => setCode('not True')}>not True</button>
        <button onClick={() => setCode('+')}>+</button>
        <button onClick={() => setCode('map not []')}>map not []</button>
        <button onClick={() => setCode('fst')}>fst</button>
        <button onClick={() => setCode('Just')}>Just</button>
        <button onClick={() => setCode('let x = 3 in + x')}>let x = 3 in + x</button>
        <button onClick={() => setCode('\\x -> / x 2')}>\x -{'>'} / x 2</button>
        <button onClick={() => setCode('cons 23 []')}>cons 23 []</button>
      </h2>
      <div className='code-container'>
        <input placeholder="Enter code..." value={code} onChange={e => setCode(e.target.value)} />
        {code && highlights.map((h, i) => <p key={i}>{code.slice(0, h.start)}<span className={h.className}>{code.slice(h.start, h.end)}</span>{code.slice(h.end)}</p>)}
      </div>
      {code && <ResultView code={code} setHighlights={setHighlights} />}
    </>
  );
}

export default Main;
