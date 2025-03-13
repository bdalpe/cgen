---
title: Weighted Random
---

# Weighted Replacement

The weighted replacement strategy is similar in behavior to the random replacement, however the replacement values have defined weights.

If a set of replacements have the weights of 9 and 1, then you would expect to see the first replacement 90% of the time and the second replacement 10% of the time.

### Sample Config

This config would generate the same hello, world|you|there samples, however world would be expected 62.5% of the time, with you and there being expected 31.25% and 6.25%

```yaml
type: weighted
token: world
weightedPick:
- value: world
  weight: 10
- value: you
  weight: 5
- value: there
  weight: 1
```
