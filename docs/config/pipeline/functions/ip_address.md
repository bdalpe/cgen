# IP Address

Generates an IPv4 address.

### Sample Config

```yaml
type: ipaddr
token: ip
cidr: 10.0.0.0/8
```

```text
My IP address is {{ip}}
```

Would generate samples like:
* `My IP address is 10.255.0.2`
* `My IP address is 10.2.3.4`
