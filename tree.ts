
// ==== TOKENS =================================================================

export enum TokenType {
	begin, variable, constant, lambda, dot, under, comment,
	open, close, other, warlus, end, lf,
	alpha, beta, delta, eta, rho, kappa
}
export type Token = { type: TokenType, lexeme: string, position: number };

// ==== EXPRESSIONS ============================================================

export class Expression {
	start = 0; end = 0;
	get bounds() { return [ this.start, this.end ]; }
	public description?(): string;
	public debruijn?(): string;
	public copy?(): Expression;
}

export class Comment extends Expression {
	data: Token;
	constructor(data: Token) {
		super();
		this.data = data;
		this.start = data.position;
		this.end = data.position + data.lexeme.length;
	}
	description(): string {
		return this.data.lexeme.replace(/\s*;\s*/gm, "\n")
							   .replace(/[\n\r]+/gm, "")
							   .replace(/\\\s*/gm, "\n");
	}
	copy(): Expression { return new Comment(this.data); }
}

export class Declaration extends Expression {
	constant: Token; value: Expression;
	constructor(constant: Token, value: Expression) {
		super();
		this.constant = constant;
		this.value = value;
		this.start = constant.position;
		this.end = value.end;
	}
	copy(): Expression {
		return new Declaration(this.constant, this.value.copy!());
	}
}

export class Operator extends Expression {
	e: Expression; token: Token;
	constructor(t: Token, e: Expression) {
		super();
		this.token = t;
		this.e = e;
		this.start = t.position;
		this.end = e.end;
	}
	copy(): Expression { return new Operator(this.token, this.e.copy!()); }
}

export class Alpha extends Operator {
	constructor(t: Token, e: Expression) { super(t, e); }
}

export class Beta extends Operator {
	constructor(t: Token, e: Expression) { super(t, e); }
}

export class Rho extends Operator {
	constructor(t: Token, e: Expression) { super(t, e); }
}

export class Kappa extends Operator {
	constructor(t: Token, e: Expression) { super(t, e); }
}

export class Variable extends Expression {
	literal: Token; index: number;
	constructor(literal: Token, index?: number) {
		super();
		this.literal = literal;
		this.index = index || 0;
		this.start = literal.position;
		this.end = literal.position + 1;
	}
	description(): string { return this.literal.lexeme; }
	debruijn(): string { return `${this.index + 1} `; }
	copy(): Expression { return new Variable(this.literal, this.index); }
}

export class Abstraction extends Expression {
	parameter: Token; body: Expression; lambda: Token; dot: Token;
	constructor(lambda: Token, p: Token[], dot: Token, body: Expression) {
		super();
		this.lambda = lambda;
		this.dot = dot;
		this.start = lambda.position;
		this.parameter = p[0];
		if (p.length === 1) this.body = body;
		else this.body = new Abstraction(lambda, p.slice(1), dot, body);
		this.end = this.body.end;
	}
	description(): string {
		return 'λ' + this.parameter.lexeme +
			   '.' + this.body.description!();
	}
	debruijn(): string { return `λ ${this.body.debruijn!()} `; }
	copy(): Expression { return new Abstraction(
		this.lambda, [ this.parameter ], this.dot, this.body.copy!()
	); }
}

export class Application extends Expression {
	lhs: Expression; rhs: Expression;
	constructor(lhs: Expression, rhs: Expression) {
		super();
		this.start = lhs.start;
		this.end = rhs.end;
		this.lhs = lhs;
		this.rhs = rhs;
	}
	description(): string {
		let result = "";
		let actualised = this.lhs.description!();
		if (actualised.length > 1) result = '(' + actualised + ')';
		else result = actualised;
		actualised = this.rhs.description!();
		if (actualised.length > 1) result += '(' + actualised + ')';
		else result += actualised;
		return result;
	}
	debruijn(): string {
		let result = "";
		let actualised = this.lhs.debruijn!();
		if (actualised.length > 2) result = '(' + actualised.trim() + ')';
		else result = actualised;
		actualised = this.rhs.debruijn!();
		if (actualised.length > 2) result += '(' + actualised.trim() + ')';
		else result += actualised;
		return result;
	}
	copy(): Expression {
		return new Application(this.lhs.copy!(), this.rhs.copy!());
	}
}
