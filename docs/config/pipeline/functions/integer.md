# Random Integer

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
