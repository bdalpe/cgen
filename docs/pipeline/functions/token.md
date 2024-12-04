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

The following token replacement strategies are available:
* [Timestamp](#timestamp)
* [Random](#random)
* [Weighted Random](#weighted-replacement)
* [Random Integer](#random-integer)
* [Random Hex](#random-hex)
* [Lookup](#lookup)
* [Eval](#eval)

## Timestamp

## Random

The random strategy picks a replacement value at random from the list of replacements.

The function ID is simply `token`.

### Sample Config

If you wanted to build a simple "hello, world" replacement generator, you could use the following configuration:

Sample:
```text
hello, {{world}}
```

Config:
```yaml
type: token
token: world
pickFrom:
- world
- you
- there
```

This would generate the following events:
* hello, world
* hello, you
* hello, there

## Weighted Replacement

The weighted replacement strategy is similar in behavior to the random replacement, however the replacement values have defined weights.

If a set of replacements have the weights of 9 and 1, then you would expect to see the first replacement 90% of the time and the second replacement 10% of the time.

### Sample Config

This config would generate the same hello, world|you|there samples, however world would be expected 62.5% of the time, with you and there being expected 31.25% and 6.25%

```yaml
type: weighted
token: world
weightedPick:
- value: world
  weight: 10
- value: you
  weight: 5
- value: there
  weight: 1
```

## Random Integer

### Sample Config

The following example config would generate events, randomly picking an integer between 0 and 100, inclusively.

```yaml
type: int
token: value
int:
  min: 0
  max: 50
```

The temperature today is {{value}} C.

Sample output:
* The temperature today is 0 C.
* The temperature today is 10 C.
* The temperature today is 45 C.

## Random Hex

### Sample Config

```yaml
type: hex
token: value
hex:
  min: 00
  max: ff
```

Would generate samples like:
* The value is `01`.
* The value is `9c`.
* The value is `ff`

## Eval

The eval function supports setting field values dynamically. Simple javascript can be used to manipulate events.

To reference fields in the event, you can use the `event` variable.

### Sample Config

The following would create a new field called `hello` with a value of `world`.

```yaml
type: eval
expr: |
  event.hello = "world"
```

Example event:
```json
{"time": "<date>", "hello": "world"}
```
