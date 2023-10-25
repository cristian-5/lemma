
# Lemma, λ-Calculus Interpreter

Lemma Calculator is a simple
[λ-calculus](https://en.wikipedia.org/wiki/Lambda_calculus) interpreter
for students, build with ❤️, [Deno](https://deno.land/) and *javascript*.
The language is based on the λ-calculus, with the addition of constants
and comments.

> ✳️ **Update**: Silly me had to rewrite this fully cause I originally
> implemented this with eager evaluation, twice. Ye pretty stupid.
> *Right now it works perfectly and is just as **lazy** as you would expect.*


## Syntax

This is a simple example of the syntax; for a smoother experience you should
set-up an additional input method to switch back and forth to greek letters.

```
; In λ-calculus we use functions to encode data.
; The Church encoding system is the simplest way to encode boolean values.
; That means that redexes (ρ) are kept to a minimum.

T := λtf.t
F := λtf.f

; To create the NOT operator we use `NOT := λp.p F T`.
; The parameter p acts as a selector, if it's T it selects F and vice versa.

NOT := λp.p F T

β NOT T
β NOT F
```

* Lambdas are defined with `λ`, the parameters, `.` and the body.
* Constant definitions are achieved through `<CONSTANT> := <expression>`.
* Only one expression per line is allowed.
* Contstants are defined with uppercase letters.
* Parameters are defined with a single lowercase letter.
* Line comments start with `;` proceed until the end of line.
* Alpha conversion (de Bruijn) is performed with the `α` unary function.
* Beta reduction output is performed with the `β` unary function.
* Rho display of redexes is performed with the `ρ` unary function.
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
flags: --help, --version, --highlight
```

## Requirements and Dependencies

* The project is build on top of [Deno](https://deno.land/).
