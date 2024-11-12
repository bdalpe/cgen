import dgram from 'node:dgram';
import {AbstractOutput} from "./index";
import {Event} from "../index";

// https://github.com/Invilite/logger/blob/f36ed09f86dd268c51a19a671eb0beea9fb2ac59/src/Transports/Udp.ts
export class Udp extends AbstractOutput {
	protected readonly client: dgram.Socket;

	constructor(protected readonly host: string, protected readonly port: number) {
		super();

		this.client = dgram.createSocket({
			type: 'udp4'
		});

		this.client.on('error', (error: Error) => this.emit('error', error));
	}

	protected formatEvent(event: Event, encoding: BufferEncoding): Buffer {
		return Buffer.from(event.event.toString(), encoding);
	}

	_write(event: Event, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		this.client.send(this.formatEvent(event, encoding), this.port, this.host);

		callback();
	}

	async unload(): Promise<void> {
		this.client.close();

		return super.unload();
	}
}
