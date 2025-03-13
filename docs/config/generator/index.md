# Generators

A generator is responsible for creating events on a scheduled basis.

Currently, there is only a single generator available, the `interval` generator.

## Interval Generator

The interval generator creates events at a fixed interval. This interval is specified in seconds.

Example:
```yaml
generators:
  simple:
    interval: 1
    samples:
      - hello
```

Would generate an event with the payload of `hello` every 1 second.
