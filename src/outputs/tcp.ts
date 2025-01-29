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
	protected client: Socket;
	protected config: TcpConfig;
	protected backoffTime: number = BACKOFF_TIME;
	protected connectTimeout: NodeJS.Timeout | undefined;
	protected buffer: Buffer[] = []; // Always spool events

	constructor(config: TcpConfig) {
		super();

		this.config = config;

		this.client = new Socket();

		this.setupClient();
		this.connect();
	}

	protected setupClient() {
		this.client.removeAllListeners(); // Ensure no duplicate listeners
		this.client.on("error", this.backoff.bind(this));
		this.client.on("connect", this.connected.bind(this));
		this.client.on("drain", this.flushBuffer.bind(this)); // Handle backpressure
		this.client.on("end", this.backoff.bind(this));
	}

	protected connected() {
		console.log("Client connected...");
		if (this.connectTimeout) {
			clearTimeout(this.connectTimeout);
			this.connectTimeout = undefined;
		}
		this.backoffTime = BACKOFF_TIME;
		this.flushBuffer(); // Flush all buffered events
	}

	protected timeout() {
		if (!this.client.destroyed) {
			this.client.destroy();
		}

		this.backoff(new Error('connect ETIMEDOUT'));
	}

	protected backoff(error?: Error) {
		if (error) {
			console.error(
				error instanceof AggregateError
					? "Multiple errors occurred:"
					: `${error.name}: ${error.message}`
			);
			if (error instanceof AggregateError) {
				error.errors.forEach((e) => console.error(`${e}`));
			}
		}

		this.backoffTime = Math.min(this.backoffTime * 2, 60000);
		console.warn("Will attempt reconnection in", Math.round(this.backoffTime / 1000), "s");
		setTimeout(this.connect.bind(this), this.backoffTime);
	}

	protected connect() {
		console.log("Attempting to connect to", this.config.host, "on port", this.config.port);

		// Ensure a fresh socket
		this.client.destroy();
		this.client = new Socket();
		this.setupClient();

		try {
			this.client.connect({
				host: this.config.host,
				port: this.config.port,
				autoSelectFamily: true,
				keepAlive: true
			});
			// Set a timeout to detect connection failures
			this.connectTimeout = setTimeout(() => {
				if (this.client.connecting) {
					this.timeout();
				}
			}, this.backoffTime);
		} catch (error) {
			this.emit("error", error);
		}
	}

	protected formatEvent(event: Event, encoding: BufferEncoding): Buffer {
		return Buffer.from(event.event.toString() + "\n", encoding);
	}

	protected flushBuffer() {
		if (this.client.destroyed || !this.client.writable) return;

		while (this.buffer.length > 0) {
			const data = this.buffer.shift();

			if (data && !this.client.write(data)) {
				console.warn("Socket is full, waiting for drain event...");
				break; // Stop if socket's buffer is full
			}
		}
	}

	_write(event: Event, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		this.buffer.push(this.formatEvent(event, encoding));
		this.flushBuffer();
		callback();
	}

	async unload(): Promise<void> {
		this.client.end();

		return super.unload();
	}
}
