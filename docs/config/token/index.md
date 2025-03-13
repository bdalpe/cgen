# Token Replacement

cgen supports a number of strategies for token replacement in sample events.

A token is defined by `{{token}}`, where token is the variable name. There can be any number of whitespace characters between the curly braces and the variable name.

For example, the following are all valid token patterns.

```text
{{token}}
{{ token }}
{{  token   }}
{{token }}
```

The following token replacement functions are available:

<TokenList />

