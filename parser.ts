
import {
	LANGUAGE, Token, TokenType,
	Expression, Declaration, Abstraction, Application, Variable, Reduction, Comment,
} from "./tree.ts";

const errors: { [code: string]: string } = {
	"EVA": "expected variable in assignment",
	"DOT": "missing '.' symbol in abstraction",
	"MBA": "missing body of abstraction",
	"VAR": "invalid variable symbol",
	"RDC": "variable redeclaration",
	"END": "expected end of line after expression",
	"QUE": "expected query symbol '?'",
	"UID": "unexpected identifier",
	"IND": "invalid nested declaration",
	"IEX": "invalid expression",
};

const LF = '\n'.charCodeAt(0);

class SyntaxError {

	message = "";
	bounds: number[] = [ 0, 0 ];

	constructor(message: string, bounds: number[]) {
		this.message = message;
		this.bounds = bounds;
	}

	print(code: string) {
		const N = 40 - 4;
		const H = (d: string) => `${LANGUAGE}: syntax error on [${d}]`;
		const lines = (from: number, to: number) => {
			let lines = 1;
			for (let i = from; i < to; i++)
				if (code.charCodeAt(i) == LF) lines++;
			return lines;
		};
		const beginning = (of: number) => {
			let i = of;
			while (i > 0 && code.charCodeAt(i) != LF) i--;
			return i + 1;
		};
		const ending = (of: number) => {
			let i = of;
			while (i < code.length && code.charCodeAt(i) != LF) i++;
			return i;
		};
		const from = beginning(this.bounds[0]);
		const to = ending(this.bounds[1]);
		const l = [
			lines(0, this.bounds[0]), lines(this.bounds[0], this.bounds[1])
		];
		if (l[1] == 1) {
			// error on one line,
			// show the partial string if <= N characters
			if (to - from <= N) {
				console.log(H(`${l[0]}:${this.bounds[0]}:${this.bounds[1]}`));
				console.log("    " + code.substring(from, to));
				console.log("    " + '~'.repeat(from - to));
			} else {
				// the line is too long, try to only show the error
				// if error alone is > N characters, show the error
				// shortened to N characters
			}
			console.log(H + `[${l[0]}:${this.bounds[0]}:${this.bounds[1]}]:`);
		}
		
	}

	/*private range(code: string) {
		for (let i = 0; i < this.bounds[0]; i++) {
			const c = code.charCodeAt(i);
			if (c === 10) {
				this.startLine++; this.startColumn = 1;
			} else this.startColumn++;
		}
		this.endColumn = this.startColumn;
		for (let i = this.bounds[0]; i < this.bounds[1]; i++) {
			const c = code.charCodeAt(i);
			if (c === 10) { this.endLine++; this.endColumn = 1;}
			this.endColumn++;
		}
	}*/

}

export const parse = (tokens: Token[]): Expression[] => {

	// ==== Core ===============================================================

	let current = 1;

	const bounds = (token: Token) => [
		token.position, token.position + token.lexeme.length
	];

	const error = (code: string, bounds: number[] = []) =>
		new SyntaxError(errors[code], bounds);
	const advance = () => { if (!is_at_end()) current++; return prev(); };
	const receed = () => { if (!is_at_start()) current--; return prev(); };
	const peek = () => tokens[current], prev = () => tokens[current - 1];
	const is_at_start = () => peek().type === TokenType.begin;
	const is_at_end = () => peek().type === TokenType.end;
	const check = (t: TokenType) => is_at_end() ? false : peek().type === t;
	const match = (type: TokenType, lexemes?: string[] | string) => {
		if (lexemes === undefined) {
			if (!check(type)) return false;
			advance(); return true;
		}
		if (typeof lexemes === "string") lexemes = [ lexemes ];
		if (!check(type)) return false;
		const p = peek();
		if (lexemes.includes(p.lexeme)) {
			advance(); return true;
		} else return false;
	};
	const consume = (type: TokenType, lexeme: string, error: SyntaxError) => {
		if (!check(type)) throw error;
		if (lexeme === null || peek().lexeme === lexeme) return advance();
		throw error;
	};

	// ==== Expressions ========================================================

	const globals: string[] = [];
	const expression = (): Expression => {
		const context: string[] = [];
		// declaration = (variable ':=' abstraction) | [ 'β' | 'ρ' ] abstraction
		const declaration = (): Expression => {
			if (match(TokenType.beta) || match(TokenType.rho)) {
				return new Reduction(prev(), abstraction());
			} else if (match(TokenType.variable)) {
				const v = prev();
				const i = globals.indexOf(v.lexeme);
				if (!match(TokenType.warlus)) {
					receed();
					return abstraction();
				}
				if (i !== -1) throw error("RDC", bounds(v));
				const w = prev();
				globals.push(v.lexeme);
				return new Declaration(v, w, abstraction());
			}
			return abstraction();
		};
		// abstraction = ('λ' variable '.' abstraction) | application
		const abstraction = (): Expression => {
			if (!match(TokenType.lambda)) return application();
			const lam = prev();
			const par = [ ];
			while (match(TokenType.variable)) {
				const v = prev();
				if (context.includes(v.lexeme)) throw error("RDC", bounds(v));
				par.push(v); context.push(v.lexeme);
			}
			if (par.length === 0) throw error("VAR", bounds(lam));
			const dot = consume(TokenType.dot, '.', error("DOT", bounds(lam)));
			return new Abstraction(lam, par, dot, abstraction());
		};
		// application = atom { application }
		const application = (): Expression => {
			let e = atom();
			while (!is_at_end() && !(
				peek().type === TokenType.lf ||
				peek().type === TokenType.close
			)) e = new Application(e, atom());
			return e;
		};
		// atom = variable | '(' abstraction ')'
		const atom = (): Expression => {
			if (match(TokenType.open)) {
				const e = abstraction();
				consume(TokenType.close, ")", error("CLO"));
				return e;
			}
			if (match(TokenType.variable)) {
				const v = prev();
				const i = context.indexOf(v.lexeme);
				const j = globals.indexOf(v.lexeme);
				if (i === - 1 && j === -1) throw error("UID", bounds(v));
				return new Variable(v, i);
			}
			throw error("IEX", bounds(peek()));
		};
		return declaration();
	};

	// ==== Parser =============================================================

	const instructions: Expression[] = [];
	while (!is_at_end()) {
		while (match(TokenType.lf)) instructions.push(new Comment(prev()));
		if (is_at_end()) break;
		instructions.push(expression());
		if (is_at_end()) break;
		while (match(TokenType.lf)) instructions.push(new Comment(prev()));
	}
	return instructions;

};
