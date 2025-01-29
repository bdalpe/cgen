import {Socket} from "node:net";
import {AbstractOutput} from "./index";
import {Event} from "../index";

interface TcpConfig {
	host: string;
	port: number;
	[key: string]: unknown;
}

const BACKOFF_TIME = 500;

export class Tcp extends AbstractOutput {
	protected readonly client: Socket;
	protected config: TcpConfig;
	protected backoffTime: number = BACKOFF_TIME;

	constructor(config: TcpConfig) {
		super();

		this.config = config;

		this.client = new Socket();

		this.client.on('error', (error: Error) => this.backoff(error));
		this.client.on('connect', () => this.connected());
		this.client.on('end', () => this.backoff());

		this.connect();
	}

	protected connected() {
		console.log("Client connected...");
		this.backoffTime = BACKOFF_TIME;
	}

	protected backoff(error?: Error) {
		if (error) {
			if (error instanceof AggregateError) {
				console.error("Multiple errors occurred:");
				for (const e of error.errors) {
					console.error(`${e}`);
				}
			} else {
				console.error(`${error.name}: ${error.message}`);
			}
		}

		this.backoffTime = Math.min(this.backoffTime * 2, 60000);
		console.warn("Will attempt reconnection in", Math.round(this.backoffTime / 1000), "s");
		setTimeout(() => this.connect(), this.backoffTime);
	}

	protected connect() {
		console.log("Attempting to connect to", this.config.host, "on port", this.config.port);

		try {
			this.client.connect({
				host: this.config.host,
				port: this.config.port,
				autoSelectFamily: true,
				keepAlive: true
			});
		} catch (error) {
			this.emit('error', error);
		}
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
