# Outputs

Outputs receive the events emitted by a route after any configured pipelines run.

Define outputs under the `outputs` section of the config file, then reference them by name from `routes`.

```yaml
outputs:
  console:
    type: console
  archive:
    type: s3
    bucket: logs
    partition: "year=${new Date(event.time).getFullYear()}"
    spoolSize: 25000
    flushInterval: 60000
    s3config:
      endPoint: localhost
      port: 9000
      useSSL: false
      accessKey: minioadmin
      secretKey: minioadmin
routes:
  - generator: simple
    output:
      - console
      - archive
```

`routes[].output` can be a single output name or a list of output names.

## console

Writes the full event as JSON to stdout.

```yaml
outputs:
  console:
    type: console
```

## devnull

Discards events without writing them anywhere.

```yaml
outputs:
  sink:
    type: devnull
```

## http

Sends each event to an HTTP endpoint with `POST` and `application/json`.

Options:

* `endpoint` - Full URL to send requests to
* `headers` - Optional map of extra HTTP headers

```yaml
outputs:
  webhook:
    type: http
    endpoint: http://localhost:8080/events
    headers:
      Authorization: Bearer token
```

## kafka

Publishes each event to a Kafka topic.

Options:

* `topic` - Kafka topic name
* `config` - KafkaJS client configuration

```yaml
outputs:
  kafka:
    type: kafka
    topic: events
    config:
      clientId: cgen
      brokers:
        - localhost:19092
```

## postgres

Converts `event.event` key/value pairs into an `INSERT` statement for a table.

Options:

* `connectionString` - PostgreSQL connection string
* `tableName` - Destination table name

`event.event` should be an object whose keys match the destination columns.

```yaml
outputs:
  db:
    type: postgres
    connectionString: postgresql://postgres:postgres@localhost:5432/events
    tableName: generated_events
```

## prometheusremotewrite

Writes metrics to a Prometheus `remote_write` endpoint.

Options:

* `url` - Remote write endpoint URL
* `mode` - `metrics` (default) or `timeseries`
* `auth` - Optional basic auth credentials
* `labels` - Optional labels added to outgoing metrics
* `headers` - Optional extra HTTP headers
* `timeout` - Optional request timeout

When `mode: metrics`, `event.event` must be an object whose values are numbers.

```yaml
outputs:
  metrics:
    type: prometheusremotewrite
    url: http://localhost:9090/api/v1/write
    labels:
      job: cgen
```

When `mode: timeseries`, `event.event` must be a Prometheus remote write timeseries object or an array of timeseries objects.

## s3

Buffers events in memory and uploads them to object storage when the spool size or flush interval is reached.

Options:

* `bucket` - Bucket name
* `partition` - JavaScript template string used to build the object prefix from `event`
* `spoolSize` - Flush threshold in bytes
* `flushInterval` - Maximum time between uploads in milliseconds
* `s3config` - MinIO client configuration

```yaml
outputs:
  archive:
    type: s3
    bucket: logs
    partition: "year=${new Date(event.time).getFullYear()}/month=${new Date(event.time).getMonth() + 1}"
    spoolSize: 25000
    flushInterval: 60000
    s3config:
      endPoint: localhost
      port: 9000
      useSSL: false
      accessKey: minioadmin
      secretKey: minioadmin
```

## hec

Sends events to the Splunk HTTP Event Collector.

Options:

* `endpoint` - HEC endpoint URL
* `authToken` - Splunk HEC token
* `headers` - Optional extra HTTP headers

The output uses event metadata for Splunk fields such as `host`, `source`, `sourcetype`, and `index`.

```yaml
outputs:
  splunk:
    type: hec
    endpoint: http://localhost:8088/services/collector/event
    authToken: 00000000-0000-0000-0000-000000000000
```

## syslog

Writes events to a remote syslog listener over TCP.

Options:

* `host` - Remote hostname
* `port` - Remote port

If present, `event.severity` and `event.facility` are used to build the syslog priority. Otherwise they default to `6` and `1`. `event.metadata.host` is used as the hostname field.

```yaml
outputs:
  syslog:
    type: syslog
    host: localhost
    port: 514
```

## tcp

Writes `event.event` followed by a newline to a TCP socket.

Options:

* `host` - Remote hostname
* `port` - Remote port

```yaml
outputs:
  tcp:
    type: tcp
    host: localhost
    port: 9000
```
