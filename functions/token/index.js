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
 * ```
 */

let config = {};

exports.init = (cfg) => {
    config = cfg;
}

exports.process = (event) => {
    event.event = event.event.replaceAll(`{{${config.token}}}`, randomPick().next().value);

    return event;
}

function* randomPick() {
    while (true) {
        yield config.pickFrom[Math.floor(Math.random() * config.pickFrom.length)];
    }
}
