
# Timestamp

Timestamp uses the [`d3-time-format`](https://d3js.org/d3-time-format) library to format a timestamp.

Sample
```text
{{ts}}
```

Example:
```yaml
type: timestamp
token: ts
format: "%Y-%m-%d %H:%M:%S"
```

This would generate the following event:
```text
2025-01-01 12:00:00
```

### Timestamp Offset

You can use an optional `offset` to adjust the timestamp by a number of seconds. The offset value is provided in milliseconds.

Example:
```yaml
type: timestamp
token: ts
format: "%Y-%m-%d %H:%M:%S"
offset: -3600000
```
