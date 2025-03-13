# Lookup

The lookup function allows you to replace a token with a value from a lookup file.

### Sample Config

```yaml
type: lookup
file: lookup.csv
fields:
  - token: example
  - token: another
    field: replaceme
```

Example lookup:

```csv
id,example,replaceme
1,hello,world
```

Example event:
```
event: {{example}} {{another}}
```

Would generate:
```
event: hello world
```
