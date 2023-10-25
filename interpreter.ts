
import {
	Comment, Declaration, Expression, Abstraction, Application, Variable,
	Alpha, Beta, Rho
} from "./tree.ts";

const SCHEME = {
	lambda: 42, alpha: 5, beta: 33, rho: 9,
	punctuation: 243, function: 208,
	arrow: 197, constant: 230, kappa: 93
};
function $(s: string, c: number) { return `\x1b[38;5;${c}m${s}\x1b[0m`; }
export function highlight(code: string) {
	code = code.replace(/"/g, "");
	return code.replace(/λ/g, $('λ', SCHEME.lambda))
		.replace(/\./g, $( '.', SCHEME.punctuation))
		.replace( /ƒ/g, $( 'ƒ', SCHEME.function))
		.replace( /_/g, $( '_', SCHEME.punctuation))
		.replace(/->/g, $("->", SCHEME.arrow))
		.replace( /α/g, $( 'α', SCHEME.alpha))
		.replace( /β/g, $( 'β', SCHEME.beta))
		.replace( /ρ/g, $( 'ρ', SCHEME.rho))
		.replace( /κ/g, $( 'κ', SCHEME.kappa))
		.replace( /[()]+/g, m => $(m, SCHEME.punctuation))
		.replace(/[A-Z]+/g, m => $(m, SCHEME.constant));
}

function abstraction(node: Expression): boolean {
	return node instanceof Abstraction;
}

function shift_handler(node: Expression, from: number, by: number): Expression {
	if (node instanceof Application)
		return new Application(
			shift_handler(node.lhs, from, by),
			shift_handler(node.rhs, from, by)
		);
	else if (node instanceof Abstraction)
		return new Abstraction(
			node.lambda, [ node.parameter ], node.dot,
			shift_handler(node.body, from + 1, by)
		);
	else if (node instanceof Variable)
		return new Variable(
			node.literal,
			node.index! + (node.index! >= from ? by : 0)
		);
	throw new Error("Invalid node type");
}
function shift(by: number, node: Expression): Expression {
	return shift_handler(node, 0, by);
}

function substitute(value: Expression, node: Expression): Expression {
	return shift(-1, substitute_handler(shift(1, value), node, 0));
}
function substitute_handler(
	value: Expression, node: Expression, depth: number
): Expression {
	if (node instanceof Application)
		return new Application(
			substitute_handler(value, node.lhs, depth),
			substitute_handler(value, node.rhs, depth)
		);
	else if (node instanceof Abstraction)
		return new Abstraction(
			node.lambda, [ node.parameter ], node.dot,
			substitute_handler(value, node.body, depth + 1)
		);
	else if (node instanceof Variable)
		if (depth === node.index) return shift(depth, value);
		else return node;
	throw new Error("Invalid node type");
}

type Redex = (redex: Expression) => void;
function reduce(ast: Expression, redex?: Redex): Expression {
	while (true) {
		if (!(ast instanceof Application)) return ast;
		if (abstraction(ast.lhs) && abstraction(ast.rhs))
			ast = substitute(ast.rhs, (ast.lhs as Abstraction).body);
		else if (abstraction(ast.lhs)) ast.rhs = reduce(ast.rhs, redex);
		else ast.lhs = reduce(ast.lhs, redex);
		if (redex !== undefined) redex(ast);
	}
}

function display(text: string, HIGHLIGHT: boolean): void {
	console.log(HIGHLIGHT ? highlight(text) : text);
}

export function interpret(ast: Expression[], HIGHLIGHT = true): void {
	const declarations: { [id: string] : string } = { };
	for (const node of ast) {
		if (node instanceof Comment) {
			display(node.description(), false);
		} else if (node instanceof Declaration) {
			display(node.description(), HIGHLIGHT);
		} else if (node instanceof Alpha) {
			display(node.description(), HIGHLIGHT);
			display("| " + reduce(node.e).debruijn!(), HIGHLIGHT);
		} else if (node instanceof Beta) {
			display(node.description(), HIGHLIGHT);
			display("| " + reduce(node.e).description!(), HIGHLIGHT);
		} else if (node instanceof Rho) {
			display(node.description(), HIGHLIGHT);
			reduce(node.e, (redex: Expression) => {
				display("| " + redex.description!(), HIGHLIGHT);
			});
		}
	}
}