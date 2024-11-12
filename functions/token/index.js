/*
 * This function replaces placeholders in the event with actual values.
 *
 * The tokens are in the form of {{token}}, where token is the name of the token.
 *
 * A replacement value is selected at random from the list of values provided in the config.
 *
 * Example config:
 *
 * ```
 * token: tok
 * pickFrom:
 *  - value1
 *  - value2
 *  - value3
 *
 * or:
 *
 * token: tok
 * weightedPick:
 *  - value: value1
 *    weight: 1
 *  - value: value2
 *    weight: 2
 *  - value: value3
 *    weight: 3
 *
 * or:
 *
 * token: tok
 * int:
 *   min: 1
 *   max: 10
 * ```
 */

let config = {};
let next = randomPick();

exports.init = (cfg) => {
    config = cfg;

    if ('weightedPick' in config) {
        next = cumulativeWeightedRandomPick();
    }

    if ('int' in config) {
        next = randomIntegerPick();
    }
}

exports.process = (event) => {
    event.event = event.event.replaceAll(`{{${config.token}}}`, next.next().value);

    return event;
}

function* randomPick() {
    while (true) {
        yield config.pickFrom[Math.floor(Math.random() * config.pickFrom.length)];
    }
}

function* cumulativeWeightedRandomPick() {
    const items = config.weightedPick;
    const cumulativeWeights = [];
    let totalWeight = 0;

    // Build the cumulative distribution array
    for (const item of items) {
        totalWeight += item.weight || 1; // Default weight to 1 if not provided
        cumulativeWeights.push({ value: item.value, cumulative: totalWeight });
    }

    // Infinite loop to yield values based on the cumulative distribution
    while (true) {
        const randomValue = Math.random() * totalWeight;

        // Use the cumulative array to pick a value
        for (const entry of cumulativeWeights) {
            if (randomValue < entry.cumulative) {
                yield entry.value;
                break;
            }
        }
    }
}

function* randomIntegerPick() {
    while (true) {
        yield Math.floor(Math.random() * (config.int.max - config.int.min + 1)) + config.int.min;
    }
}
