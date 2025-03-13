# Config 

The config file is written in YAML and is separated into 4 sections:
* `generators`
* `pipelines`
* `outputs`
* `routes`

## Example Config File

The following YAML shows a fully functional config file with a simple generator, a pipeline that randomly picks a replacement for the "hello, world" statement, and then writes to the console.

```yaml
generators:
  simple:
    interval: 1
    samples:
      - hello, {{world}}!
pipelines:
  tokenizer:
    - type: token
      token: world
      pickFrom:
        - world
        - you
        - there
outputs:
  console:
    type: console
routes:
  - generator: simple
    pipelines:
      - tokenizer
    output: console
```
