
export const LANGUAGE = "axiom-calc";

// ==== TOKENS =================================================================

export enum TokenType {
	begin, variable, lambda, dot, under,
	open, close, other, warlus, end, lf,
	alpha, beta, eta, rho, kappa
}
export type Token = { type: TokenType, lexeme: string, position: number };

// ==== EXPRESSIONS ============================================================

export class Expression {
	start = 0; end = 0;
	get bounds() { return [ this.start, this.end ]; }
	public accept?(visitor: ASTVisitor): void;
	public compile?(visitor: Compiler): string;
}

export class Comment extends Expression {
	data: Token;
	constructor(data: Token) {
		super();
		this.data = data;
		this.start = data.position;
		this.end = data.position + data.lexeme.length;
	}
	accept(visitor: ASTVisitor) { visitor.comment(this); }
	compile(visitor: Compiler) { return visitor.comment(this); }
}

export class Reduction extends Expression {
	e: Expression; type: Token;
	constructor(t: Token, e: Expression) {
		super();
		this.type = t;
		this.e = e;
		this.start = t.position;
		this.end = e.end;
	}
	accept(visitor: ASTVisitor) { visitor.reduction(this); }
	compile(visitor: Compiler) { return visitor.reduction(this); }
}

export class Declaration extends Expression {
	name: Token; e: Expression; warlus: Token;
	constructor(name: Token, w: Token, e: Expression) {
		super();
		this.warlus = w;
		this.start = name.position;
		this.end = e.end;
		this.name = name;
		this.e = e;
	}
	accept(visitor: ASTVisitor) { visitor.declaration(this); }
	compile(visitor: Compiler) { return visitor.declaration(this); }
}

export class Variable extends Expression {
	literal: Token; index?: number;
	constructor(literal: Token, index?: number) {
		super();
		this.literal = literal;
		this.index = index;
		this.start = literal.position;
		this.end = literal.position + 1;
	}
	accept(visitor: ASTVisitor) { visitor.variable(this); }
	compile(visitor: Compiler) { return visitor.variable(this); }
}

export class Abstraction extends Expression {
	parameters: Token[]; body: Expression; lambda: Token; dot: Token;
	constructor(lambda: Token, p: Token[], dot: Token, body: Expression) {
		super();
		this.lambda = lambda;
		this.dot = dot;
		this.start = lambda.position;
		this.end = body.end;
		this.parameters = p;
		this.body = body;
	}
	accept(visitor: ASTVisitor) { visitor.abstraction(this); }
	compile(visitor: Compiler) { return visitor.abstraction(this); }
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
	accept(visitor: ASTVisitor) { visitor.application(this); }
	compile(visitor: Compiler) { return visitor.application(this); }
}

export interface ASTVisitor {
	comment(node: Comment): void;
	declaration(d: Declaration): void;
	abstraction(a: Abstraction): void;
	application(a: Application): void;
	reduction(r: Reduction): void;
	variable(v: Variable): void;
}

export interface Compiler {
	comment(node: Comment): string;
	declaration(d: Declaration): string;
	abstraction(a: Abstraction): string;
	application(a: Application): string;
	reduction(r: Reduction): string;
	variable(v: Variable): string;
	compile(ast: Expression[]): string;
}
