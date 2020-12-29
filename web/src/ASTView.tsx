import React, { ReactNode } from 'react';
import { Expr, Var, App, Abs, Let, NumberLiteral, CharLiteral } from 'language'

function ASTView({ ast }: { ast: Expr }) {
    return <div className="ast-view"><NodeView node={ast} /></div>
}

function NodeView({ node }: { node: Expr }) {
    if (node instanceof CharLiteral || node instanceof NumberLiteral) {
        return <NodeWrapperView>{node.value}</NodeWrapperView>;
    }

    if (node instanceof Var) {
        return <NodeWrapperView>{node.name}</NodeWrapperView>;
    }

    if (node instanceof App) {
        return <>
            <NodeWrapperView><span className="sans-serif">Function application</span></NodeWrapperView>
            <NodeChildView><NodeView node={node.func}/></NodeChildView>
            <NodeChildView><NodeView node={node.arg}/></NodeChildView>
        </>;
    }

    if (node instanceof Abs) {
        return <>
            <NodeWrapperView>λ{node.param}</NodeWrapperView>
            <NodeChildView symbol='->'><NodeView node={node.body}/></NodeChildView>
        </>
    }

    if (node instanceof Let) {
        return <>
            <NodeWrapperView>let {node.param}</NodeWrapperView>
            <NodeChildView symbol='='><NodeView node={node.def}/></NodeChildView>
            <NodeChildView symbol='in'><NodeView node={node.body}/></NodeChildView>
        </>
    }

    throw new Error('Attempted to display a node of invalid type ' + typeof node);
}

function NodeWrapperView({ children }: { children: ReactNode }) {
    return <div className="ast-node">{children}</div>;
}

function NodeChildView({ children, symbol }: { children: ReactNode, symbol?: string }) {
    return <div className="ast-child" data-symbol={symbol}>{children}</div>
}

export default ASTView;