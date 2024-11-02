import {Socket} from "node:net";
import {AbstractOutput} from "./index";
import {Event} from "../index";

export class Tcp extends AbstractOutput {
	protected readonly client: Socket;

	constructor(protected readonly host: string, protected readonly port: number) {
		super();

		this.client = new Socket().connect({
			host,
			port,
			autoSelectFamily: true,
			keepAlive: true
		});

		this.client.on('error', (error: Error) => this.emit('error', error));
	}

	protected formatEvent(event: Event, encoding: BufferEncoding): Buffer {
		return Buffer.from(event.event.toString() + '\n', encoding);
	}

	_write(event: Event, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		this.client.write(this.formatEvent(event, encoding));

		callback();
	}

	async unload(): Promise<void> {
		this.client.end();

		return super.unload();
	}
}
