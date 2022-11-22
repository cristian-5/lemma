
const SCHEME = {
	lambda: 42, alpha: 5, beta: 33, rho: 9,
	punctuation: 243, function: 208,
	arrow: 197, constant: 230, kappa: 93
};

const $ = (s, c) => `\x1b[38;5;${c}m${s}\x1b[0m`;
function highlight(code) {
	code = code.replace(/"/g, '');
	if (HIGHLIGHT === false) return code;
	return code.replace(/λ/g, $('λ', SCHEME.lambda))
		.replace(/\./g, $('.', SCHEME.punctuation))
		.replace(/ƒ/g, $('ƒ', SCHEME.function))
		.replace(/_/g, $('_', SCHEME.punctuation))
		.replace(/->/g, $('->', SCHEME.arrow))
		.replace(/α/g, $('α', SCHEME.alpha))
		.replace(/β/g, $('β', SCHEME.beta))
		.replace(/ρ/g, $('ρ', SCHEME.rho))
		.replace(/κ/g, $('κ', SCHEME.kappa))
		.replace(/[()]+/g, m => $(m, SCHEME.punctuation))
		.replace(/[A-Z]+/g, m => $(m, SCHEME.constant));

}

// comment function
function _comment(...c) {
	let h = true;
	if (typeof c !== "string") {
		if (c[c.length - 1] === false) {
			c.pop(); h = false;
		}
		c = c.join(' ');
	}
	c = c.replace(/^\s*;\s*/g, '').replace(/\n$/g, '').replace(/^\n+/gm, ' ');
	if (c.length > 0) console.log(h ? highlight(c) : c);
}

// β-reduction: execution output
function _beta(e, log = true) {
	const data = Deno.inspect(e).includes("Function") ?
		_actualise(parseScript(e.toString()).body[0]) : e;
	if (log) console.log(data);
	else return Deno.inspect(data);
}

function _actualise(node) {
	switch (node.type) {
		case "ExpressionStatement":
			return _actualise(node.expression);
		case "ArrowFunctionExpression":
			return 'λ' + node.params.map(p => p.name).join('') +
				   '.' + _actualise(node.body);
		case "CallExpression": {
			let result = '';
			let actualised = _actualise(node.callee);
			if (actualised.length > 1) result = '(' + actualised + ')';
			else result = actualised;
			actualised = _actualise(node.arguments[0]);
			if (actualised.length > 1) result += '(' + actualised + ')';
			else result += actualised;
			return result;
		}
		case "Identifier": return node.name.replace(/f/g, 'ƒ');
	}
	return "[unknown]";
}

// α-equivalence if 2 parameters, α-conversion (de bruijn) if 1 parameter
function _alpha(a, b) {
	a = _actualise(parseScript(a.toString()).body[0]);
	b = _actualise(parseScript(b.toString()).body[0]);
	// two trees are alpha-equivalent if they are structurally identical
	// except that variables are renamed
	if (a.type !== b.type) return false;
	switch (a.type) {
		case "ExpressionStatement":
			return _alpha(a.expression, b.expression);
		case "ArrowFunctionExpression":
			return _alpha(a.params[0], b.params[0]) && _alpha(a.body, b.body);
		case "CallExpression":
			return _alpha(a.callee, b.callee) &&
				   _alpha(a.arguments[0], b.arguments[0]);
		case "Identifier": // todo: de brujin indices (make sure to account for ouside scope)
			return a.name === b.name;
	}
	return false;
}

// ρ counts the number of applications (redexes)
function _rho(r, log = true) {
	function rho(node) {
		switch (node.type) {
			case "ExpressionStatement": return rho(node.expression);
			case "ArrowFunctionExpression": return rho(node.body);
			case "CallExpression":
				return 1 + rho(node.callee) + rho(node.arguments[0]);
			case "Identifier": return 0;
		}
		return 0;
	}
	const data = parseScript(r.toString()).body[0];
	if (log) console.log(rho(data));
	else return rho(data);
}

// κ applies a numeric counter to a function
function _kappa(n, log = true) {
	let result = 0;
	try {
		result = n(x => x + 1)(0);
		if (typeof result !== "number") result = 0;
	} catch { result = 0; }
	if (log) console.log(result);
	else return result;
}
