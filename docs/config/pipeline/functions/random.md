# Random

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
