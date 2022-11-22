
import { Token, TokenType } from "./tree.ts";

const begin_file: Token = { type: TokenType.begin, lexeme: "", position: 0 };
const end_file:   Token = { type: TokenType.end,   lexeme: "", position: 0 };

const is_alpha = (c: number) =>
	(c >= 65 && c <=  90) || (c >= 97 && c <= 122) || c === 402;
const is_upper = (c: number) => (c >= 65 && c <=  90);
const is_lower = (c: number) => !is_upper(c);

export const lex = (code: string): Token[] => {
   
	if (code.length === 0) return [ begin_file, end_file ];

	let index = 0, start = 0; const tokens: Token[] = [ begin_file ];

	const advance = () => code[index++], peek = () => code[index];
	const is_at_end = () => index >= code.length;
	const match = (c: string) =>
		is_at_end() || peek() !== c ? false : !!advance();
	const cursor = (n: number) => code.substring(start, start + n);
	const token = (type: TokenType, lexeme?: string) =>
		tokens.push({ type, lexeme: lexeme || parsed(), position: start });
	const parsed = () => code.substring(start, index);
	const other = (n = 1) => {
		const l = tokens[tokens.length - 1];
		if (l.type !== TokenType.other) token(TokenType.other, cursor(n));
		else tokens[tokens.length - 1].lexeme += cursor(n);
	};

	const scan_comment = () => {
		while (peek() != '\n' && !is_at_end()) advance();
		token(TokenType.lf); // comments are treated as newlines
		start = index;
	};

	while (!is_at_end()) {
		start = index;
		const c = advance();
		if (is_alpha(c.charCodeAt(0))) {
			if (is_lower(c.charCodeAt(0))) {
				token(TokenType.variable);
				continue;
			}
			while (!is_at_end() && is_upper(peek().charCodeAt(0))) advance();
			token(TokenType.variable);
			continue;
		}
		switch(c) {
			case 'λ': token(TokenType.lambda); break;
			case '(': token(TokenType.open); break;
			case ')': token(TokenType.close); break;
			case ' ': case '\t': case ' ': break;
			case '\r': case '\n':
				if (tokens[tokens.length - 1].type !== TokenType.lf)
					token(TokenType.lf);
				else tokens[tokens.length - 1].lexeme += c;
			break;
			case '.': token(TokenType.dot); break;
			case 'α': token(TokenType.alpha); break;
			case 'β': token(TokenType.beta); break;
			case 'η': token(TokenType.eta); break;
			case 'ρ': token(TokenType.rho); break;
			case 'κ': token(TokenType.kappa); break;
			case '_': token(TokenType.under); break;
			case ':':
				if (match('=')) token(TokenType.warlus);
				else token(TokenType.other);
			break;
			case ';': scan_comment(); break;
			default: other(); break;
		}
		
	}

	end_file.position = code.length;
	tokens.push(end_file);
	return tokens;

};
