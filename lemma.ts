
import { parse as Arguments } from "https://deno.land/std@0.119.0/flags/mod.ts";

import { lex } from "./lexer.ts";
import { parse } from "./parser.ts";
import { interpret } from "./interpreter.ts";

const VERSION = "0.0.1";

const flags = Arguments(Deno.args, {
	boolean: [ "help", "version", "highlight" ],
	default: { "highlight": true },
});

if (flags["help"]) {
	console.log('usage: deno run --allow-read lemma.ts <filename.lc>');
	console.log('flags: --help, --version, --highlight');
	Deno.exit(0);
} else if (flags["version"]) {
	console.log('lemma λ-calculus interpreter v' + VERSION);
	Deno.exit(0);
} else if (flags["_"].length == 0) {
	console.log('usage: deno run --allow-read lemma.ts <filename.lc>');
	Deno.exit(1);
}

const code = new TextDecoder().decode(
	Deno.readFileSync(flags["_"][0].toString())
);
const HIGHLIGHT = flags["highlight"];

try {
	const tokens = lex(code);
	const ast = parse(tokens);
	interpret(ast, HIGHLIGHT);
} catch (e) {
	console.error(e.message);
	console.error(e.print(code));
}
