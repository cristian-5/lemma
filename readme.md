
# Lemma, λ-Calculus Interpreter

Lemma Calculator is a simple
[λ-calculus](https://en.wikipedia.org/wiki/Lambda_calculus) interpreter
for students, build with ❤️, [Deno](https://deno.land/) and *javascript*.
The language is based on the λ-calculus, with the addition of constants
and comments. We provide a default `--mode=paper` option to print comments
and useful program insights as well as syntax highlighting for the terminal.

## Syntax

This is a simple example of the syntax; for a smoother experience you should
set-up an additional input method to switch back and forth to greek letters.

```
; In λ-calculus we use functions to encode data.
; This is one of the siplest ways to encode boolean values.
; That means that redexes (ρ) are kept to a minimum.

T := λxy.x
F := λxy.y

; To create the NOT operator we use the following function.
; Parameter p acts as a selector: if it's T it selects F and vice versa.

NOT := λp.p F T

β NOT T
β NOT F
```

* Lambdas are defined with `λ`, the parameters, `.` and the body.
* Constant definitions are achieved through `NAME := expression`.
* Only one expression per line is allowed.
* Contstants are defined with uppercase letters.
* Parameters are defined with a single lowercase letter.
* Line comments start with `;` and get ignored when in `script` mode.
* Beta reduction output is performed with the `β` unary function.
* Rho count of redexes is performed with the `ρ` unary function.
* Kappa counter application is performed with the `κ` unary function.
* Function parameters can be named through the `ƒ` symbol.
* Unused parameters can be named through the `_` symbol.

## Usage

```
deno run --allow-read lemma.ts <filename.lc>
```

#### Options

```
usage: deno run --allow-read lemma.ts <filename.lc>
flags: --help, --version, --javascript, --highlight
modes: --mode=[paper|script]
```

## Requirements and Dependencies

* The project is build on top of [Deno](https://deno.land/).
* It uses the [meriyah](https://github.com/meriyah/meriyah) parser.
