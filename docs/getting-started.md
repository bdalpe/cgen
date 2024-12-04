# Getting Started

## Usage

```text
Usage: index [options]

Options:
  -c, --config <path>  Path to the configuration file (default: "config.yaml")
  -d, --dir <path>   Change the working directory (default: "/")
  -h, --help           display help for command
```

## Docker Image

A container image is published at [`ghcr.io/bdalpe/cgen`](https://ghcr.io/bdalpe/cgen)

## Running the Docker Image

Running example scenarios:

```
docker run --rm "$(pwd)/examples":/app/examples ghcr.io/bdalpe/cgen:latest -- -d /app/examples/auth-server 
```
