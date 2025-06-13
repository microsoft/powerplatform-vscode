# Instructions

## Coding guidelines

These are the coding guidelines which are used in this repository. Always follow these guidelines when generating code..

### Indentation

We use spaces, not tabs. Indentation level is 4 spaces.

### Naming Conventions

* Use PascalCase for `type` names
* Use PascalCase for `enum` values
* Use camelCase for `function` and `method` names
* Use camelCase for `property` names and `local variables`
* Use whole words in names when possible
* Use UPPER_CASE for constants.

### Comments

* When there are comments for `functions`, `interfaces`, `enums`, and `classes` use JSDoc style comments

### Strings

* Use "double quotes" for strings shown to the user that need to be externalized (localized)
* Use 'single quotes' otherwise
* All strings visible to the user need to be externalized

### Style

* Use arrow functions `=>` over anonymous function expressions
* Only surround arrow function parameters when necessary. For example, `(x) => x + x` is wrong but the following are correct:

```javascript
x => x + x
(x, y) => x + y
<T>(x: T, y: T) => x === y
```

* Always surround loop and conditional bodies with curly braces
* Open curly braces always go on the same line as whatever necessitates them
* Parenthesized constructs should have no surrounding whitespace. A single space follows commas, colons, and semicolons in those constructs. For example:

```javascript
for (let i = 0, n = str.length; i < 10; i++) {
    if (x < 10) {
        foo();
    }
}

function f(x: number, y: string): void { }
```

## Test instructions

Follow below along with [Coding Guidelines](#coding-guidelines) when generating tests.

* Use `expect` from `chai` for writing assertions.
* Generate mocha style tests with `describe` and `it` blocks.
* Use `sinon` for creating stubs and spies.
* Mock dependencies as much as possible when writing tests for a particular function.
* To run tests inside `client/test/integration` folder, you can ask to run `npm run test-desktop-int` command.
* To run tests inside `web/test/integration` folder, you can ask to run `npm run test-web-integration` command.
* Write tests to cover all possible scenarios.
* Do not write the comments //Arrange, //Act and //Assert before code.
