
import { parse as Arguments } from "https://deno.land/std@0.119.0/flags/mod.ts";

import { lex } from "./lexer.ts";
import { parse } from "./parser.ts";
import { JSCompiler, Mode } from "./compiler/javascript.ts";

const VERSION = "0.0.1";

const flags = Arguments(Deno.args, {
	boolean: [ "help", "version", "javascript", "highlight" ],
	string: [ "mode" ],
	default: { "highlight": true },
});

if (flags["help"]) {
	console.log('usage: deno run --allow-read lemma.ts <filename.lc>');
	console.log('flags: --help, --version, --javascript, --highlight');
	console.log('modes: --mode=[paper|script]');
	Deno.exit(0);
} else if (flags["version"]) {
	console.log('lemma λ-calculus interpreter v' + VERSION);
	Deno.exit(0);
} else if (flags["_"].length == 0) {
	console.log('usage: deno run --allow-read lemma.ts <filename.lc>');
	Deno.exit(1);
}

let mode = "paper";
if (flags["mode"] !== undefined) {
	switch (flags["mode"].toLowerCase()) {
		case "paper": mode = "paper"; break;
		case "script": mode = "script"; break;
		default:
			console.log('lemma: invalid mode "' + flags["mode"] + '"');
			console.log('usage: deno run --allow-read lemma.ts <filename.lc>');
			console.log('modes: --mode=[paper|script]');
			Deno.exit(1);
	}
}

const code = new TextDecoder().decode(
	Deno.readFileSync(flags["_"][0].toString())
);

try {
	const tokens = lex(code);
	const ast = parse(tokens);
	const compiler = new JSCompiler();
	compiler.mode = mode as Mode;
	const js = compiler.compile(ast);
	if (flags["javascript"]) {
		console.log('==== JavaScript ======================================');
		console.log(compiler.code);
		console.log('======================================================');
	}
	if (mode === "paper") console.log('');
	eval("const HIGHLIGHT = " + flags["highlight"] + ";" + js);
	if (mode === "paper") console.log('');
} catch (e) {
	console.error(e.message);
	console.log(code.substring(e.bounds[0], e.bounds[1]));
}
