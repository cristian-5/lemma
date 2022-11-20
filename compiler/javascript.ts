
import {
	Token, Compiler, Abstraction, Application, Declaration, Expression, Variable,
	Reduction,
Comment, 
} from "../tree.ts";

export type Mode = "paper" | "script";

export class JSCompiler implements Compiler {

	mode: Mode = "paper";

	private pure: string[] = [];
	get code() { return this.pure.join('\n'); }

	declaration(d: Declaration): string {
		const data = d.e.compile!(this);
		return [
			`const ${d.name.lexeme} = ${data};`,
			`${d.name.lexeme}[Deno.customInspect] = () => '${d.name.lexeme}';`,
			this.mode === "paper" ? `_comment('${d.name.lexeme} := ' +
			_actualise(parseScript(\`${data.toString()}\`).body[0]));` : ""
		].join('\n');
	}

	abstraction(a: Abstraction): string {
		return `${ a.parameters.map(
			(p: Token) => p.lexeme.replace(/ƒ/g, 'f')
		).join(' => ') } => ${a.body.compile!(this)}`;
	}

	application(a: Application): string {
		return `(${a.lhs.compile!(this)})(${a.rhs.compile!(this)})`;
	}

	reduction(r: Reduction): string {
		const data = r.e.compile!(this);
		const ds = data.toString();
		switch (r.type.lexeme) {
			case 'β':
				if (this.mode === "paper")
					return `_comment('β', _actualise(parseScript(\`${
					ds}\`).body[0]), '->', _beta(${ds}, false));`
				else return `_beta(${ds});`;
			case 'ρ':
				if (this.mode === "paper")
					return `_comment('ρ', _actualise(parseScript(\`${
					ds}\`).body[0]), '->', _rho(${ds}, false));`
				else return `_rho(${data});`;
		}
		return "";
	}

	variable(v: Variable): string {
		return v.literal.lexeme.replace('ƒ', 'f').replace('#', '_C');
	}

	comment(c: Comment): string {
		return this.mode === "paper" ? `_comment(\`${c.data.lexeme}\`, false);` : "";
	}

	compile(ast: Expression[]): string {
		this.pure = [];
		const decoder = new TextDecoder();
		const code: string[] = [
			decoder.decode(Deno.readFileSync('./compiler/meriyah.esm.js')),
			decoder.decode(Deno.readFileSync('./compiler/helper.js')),
		];
		for (const e of ast) code.push(e.compile!(this));
		this.pure = this.pure.concat(code.slice(2)).filter(
			(c: string) => !c.includes('_comment')
		);
		return code.join('\n');
	}

}
