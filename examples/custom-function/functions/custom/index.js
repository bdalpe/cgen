exports.init = (cfg) => {}

exports.process = (event) => {
    event.event = event.event.replaceAll(/foo|bar/g, 'baz');

    return event;
}
