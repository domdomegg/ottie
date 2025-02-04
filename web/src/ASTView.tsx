import {type ReactNode} from 'react';
import {
	type Expr, Var, App, Abs, Let, NumberLiteral, CharLiteral,
} from 'language';

type HoverCallback = (active: boolean, p: {start: number; end: number}) => void;

const ASTView = ({ast, hoverCallback}: {ast: Expr; hoverCallback: HoverCallback}) => {
	return <div className='ast-view'><NodeView node={ast} hoverCallback={hoverCallback} /></div>;
};

const NodeView = ({node, hoverCallback}: {node: Expr; hoverCallback: HoverCallback}) => {
	if (node instanceof CharLiteral || node instanceof NumberLiteral) {
		return <NodeWrapperView node={node} hoverCallback={hoverCallback}>{node.value}</NodeWrapperView>;
	}

	if (node instanceof Var) {
		return <NodeWrapperView node={node} hoverCallback={hoverCallback}>{node.name}</NodeWrapperView>;
	}

	if (node instanceof App) {
		return <>
			<NodeWrapperView node={node} hoverCallback={hoverCallback}><span className='sans-serif'>Function application</span></NodeWrapperView>
			<NodeChildView><NodeView node={node.func} hoverCallback={hoverCallback} /></NodeChildView>
			<NodeChildView><NodeView node={node.arg} hoverCallback={hoverCallback}/></NodeChildView>
		</>;
	}

	if (node instanceof Abs) {
		return <>
			<NodeWrapperView node={node} hoverCallback={hoverCallback}>λ{node.param}</NodeWrapperView>
			<NodeChildView symbol='->'><NodeView node={node.body} hoverCallback={hoverCallback}/></NodeChildView>
		</>;
	}

	if (node instanceof Let) {
		return <>
			<NodeWrapperView node={node} hoverCallback={hoverCallback}>let {node.param}</NodeWrapperView>
			<NodeChildView symbol='='><NodeView node={node.def} hoverCallback={hoverCallback}/></NodeChildView>
			<NodeChildView symbol='in'><NodeView node={node.body} hoverCallback={hoverCallback}/></NodeChildView>
		</>;
	}

	throw new Error(`Attempted to display a node of invalid type ${typeof node}`);
};

const NodeWrapperView = ({children, node, hoverCallback}: {children: ReactNode; node: Expr; hoverCallback: HoverCallback}) => {
	return <div className={`ast-node ${node.notes || ''}`} onMouseOver={() => {
		hoverCallback(true, node.pos);
	}} onMouseOut={() => {
		hoverCallback(false, node.pos);
	}}>{children}</div>;
};

const NodeChildView = ({children, symbol}: {children: ReactNode; symbol?: string}) => {
	return <div className='ast-child' data-symbol={symbol}>{children}</div>;
};

export default ASTView;
