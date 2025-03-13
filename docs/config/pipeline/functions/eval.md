# Eval

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
