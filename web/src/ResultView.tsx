import React, { useEffect } from 'react';
import { parse } from 'language'
import { infer } from 'algorithm-w'
import ASTView from './ASTView';

export interface Highlight {
  start: number;
  end: number;
  className: string;
}

function ResultView({ code, setHighlights }: { code: string, setHighlights: (h: Highlight[]) => void }) {
  // Parse the code, highlighting any errors
  const parseResult = parse(code, true);
  useEffect(() => setHighlights(parseResult.accepted ? [] : [{ start: parseResult.issuePosition.start, end: parseResult.issuePosition.end, className: 'highlight-error' }]), [parseResult, setHighlights]);

  // Infer the types, highlighting any errors
  const inferenceResult = !parseResult.accepted ? undefined! : infer(parseResult.value, true);
  useEffect(() => inferenceResult && setHighlights(inferenceResult.accepted ? [] : [{ start: inferenceResult.issuePosition.start, end: inferenceResult.issuePosition.end, className: 'highlight-error' }]), [inferenceResult, setHighlights]);

  if (!parseResult.accepted) {
    return <>
      <h2>Parse error</h2>
      <p>{parseResult.message}</p>
    </>;
  }

  const hoverCallback = createHoverCallback(setHighlights, inferenceResult.accepted ? [] : [{ start: inferenceResult.issuePosition.start, end: inferenceResult.issuePosition.end, className: 'highlight-error' }]);
  if (inferenceResult.value!.steps.length === 0) {
    <>
      <h2>Type-inference error</h2>
      <p>Something went wrong trying to infer types</p>

      <h2>AST</h2>
      <ASTView ast={parseResult.value} hoverCallback={hoverCallback} />
    </>
  }

  return <>    
    {inferenceResult.accepted
    ? <><h2>Expression type</h2><p><code>{inferenceResult.value.type.toString()}</code></p></>
    : <><h2>Type error</h2><p>The expression does not have a valid type</p></>}

    <h2>Type derivation</h2>
    {inferenceResult.value!.steps.map((step, i) => <div key={i} className='type-derivation-step'><h3>Step {i+1}</h3><p>{step.message.split('`').map((s, j) => j % 2 === 0 ? s : <code key={j}>{s}</code>)}</p><ASTView ast={step.ast} hoverCallback={hoverCallback} /></div>)}
  </>;
}

const createHoverCallback = (setHighlights: (h: Highlight[]) => void, otherHighlights: Highlight[]) => (active: boolean, p: { start: number, end: number }) => {
  setHighlights(active ? [...otherHighlights, { start: p.start, end: p.end, className: 'highlight-white' }] : otherHighlights);
}

export default ResultView;