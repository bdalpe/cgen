import {Writable, type WritableOptions} from "node:stream";
import {type Event} from "../index";

export abstract class AbstractOutput extends Writable {
    constructor(protected readonly config?: Record<string, unknown>) {
        super({objectMode: true});
    }

    /**
     * Perform any necessary initialization when starting up.
     */
    async init(): Promise<void> {}

    /**
     * Perform any necessary cleanup when shutting down.
     */
    async unload(): Promise<void> {}

    /**
     * Formats an event object into a JSON string.
     *
     * @param event
     * @param encoding
     * @protected
     */
    protected formatEvent(event: Event, encoding: BufferEncoding = 'ascii'): Buffer {
        return Buffer.from(JSON.stringify(event), encoding);
    }
}
