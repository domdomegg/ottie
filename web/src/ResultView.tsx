import React, { useMemo, useEffect } from 'react';
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
  const parseResult = useMemo(() => {
    return parse(code, true);
  }, [code]);
  useEffect(() => setHighlights(parseResult.accepted ? [] : [{ start: parseResult.issuePosition.start, end: parseResult.issuePosition.end || 0, className: 'error' }]), [parseResult, setHighlights]);

  // Infer the types, highlighting any errors
  const inferenceResult = useMemo(() => {
    if (!parseResult.accepted) return;
    return infer(parseResult.value, true);
  }, [parseResult])!;
  useEffect(() => inferenceResult && setHighlights(inferenceResult.accepted ? [] : [{ start: inferenceResult.issuePosition.start, end: inferenceResult.issuePosition.end || 0, className: 'error' }]), [inferenceResult, setHighlights]);

  if (!parseResult.accepted) {
    return <>
      <h2>AST</h2>
      <p>{parseResult.message}</p>
    </>;
  }

  if (!inferenceResult.accepted) {
    return <>
      <h2>AST</h2>
      <ASTView ast={parseResult.value} />

      <h2>Type</h2>
      <p>{inferenceResult.message}</p>
    </>;
  }

  return <>
    <h2>AST</h2>
    <ASTView ast={parseResult.value} />

    <h2>Type</h2>
    <p>{inferenceResult.value.toString()}</p>
  </>;
}

export default ResultView;