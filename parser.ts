
import {
	Token, TokenType,
	Comment, Declaration,
	Alpha, Beta, Rho, Kappa,
	Expression, Abstraction, Application, Variable
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

	print(code: string, file: string) {
		const N = 40 - 4;
		const H = (d: string): string => `syntax error on [${file}:${d}]:`;
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
				console.log(H(`${l[0]}`));
				console.log("    " + code.substring(from, to));
				console.log("    " + '~'.repeat(to - from));
			} else {
				// the line is too long, try to only show the error
				// if error alone is > N characters, show the error
				// shortened to N characters
			}
		}
	}

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
	const peek = () => tokens[current], prev = () => tokens[current - 1];
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

	const globals: { [name: string]: Expression } = { };
	const expression = (): Expression => {
		const context: string[] = [];
		// declaration = constant ":=" abstraction ;
		const declaration = (): Expression => {
			if (match(TokenType.constant)) {
				const v = prev();
				if (globals.hasOwnProperty(v.lexeme))
					throw error("RDC", bounds(v));
				if (!match(TokenType.warlus))
					throw error("IEX", bounds(v));
				return new Declaration(v, globals[v.lexeme] = abstraction());
			} else throw error("IEX", bounds(prev()));
		};
		const operator = (): Expression => {
			switch (advance().type) {
				case TokenType.alpha: return new Alpha(prev(), application());
				case  TokenType.beta: return new  Beta(prev(), application());
				case   TokenType.rho: return new   Rho(prev(), application());
				case TokenType.kappa: return new Kappa(prev(), application());
				default: throw error("IEX", bounds(prev()));
			}
		};
		// abstraction = ("λ" variable "." abstraction) | application ;
		const abstraction = (): Expression => {
			if (!match(TokenType.lambda)) return application();
			const lam = prev();
			const par = [ ];
			while (match(TokenType.variable) || match(TokenType.under)) {
				const v = prev();
				if (v.lexeme !== '_' && context.includes(v.lexeme))
					throw error("RDC", bounds(v));
				par.push(v); context.push(v.lexeme);
			}
			if (par.length === 0) throw error("VAR", bounds(peek()));
			const dot = consume(TokenType.dot, '.', error("DOT", bounds(lam)));
			const result = new Abstraction(lam, par, dot, abstraction());
			// remove variables from debrujin index context
			context.splice(context.length - par.length, par.length);
			return result;
		};
		// application = atom { application } ;
		const application = (): Expression => {
			let e = atom();
			while (!is_at_end() && !(
				peek().type === TokenType.lf ||
				peek().type === TokenType.close
			)) e = new Application(e, atom());
			return e;
		};
		// atom = variable | constant | "(" abstraction ")" ;
		const atom = (): Expression => {
			if (match(TokenType.open)) {
				const e = abstraction();
				consume(TokenType.close, ")", error("CLO"));
				return e;
			} else if (match(TokenType.variable)) {
				const v = prev();
				const i = context.lastIndexOf(v.lexeme);
				if (i === - 1) throw error("UID", bounds(v));
				return new Variable(v, context.length - i - 1);
			} else if (match(TokenType.constant)) {
				const c = prev();
				if (globals.hasOwnProperty(c.lexeme)) {
					return globals[c.lexeme].copy!();
				} else throw error("UID", bounds(c));
			}
			throw error("IEX", bounds(peek()));
		};
		
		if (peek().type === TokenType.constant) return declaration();
		else return operator();

	};

	// ==== Parser =============================================================

	const instructions: Expression[] = [];
	while (!is_at_end()) {
		while (match(TokenType.lf));
		while (match(TokenType.comment))
			instructions.push(new Comment(prev()));
		while (match(TokenType.lf));
		if (is_at_end()) break;
		const e = expression();
		if (e !== null) instructions.push(e);
		while (match(TokenType.lf));
	}
	return instructions;

};
