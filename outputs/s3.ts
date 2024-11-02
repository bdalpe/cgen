import {Client, ClientOptions} from 'minio';
import {AbstractOutput} from "./index";
import {PassThrough} from "node:stream";
import {Event} from "../index";
import {Script} from "node:vm";

export interface S3OutputConfig extends Record<string, unknown> {
	/**
	 * The S3 bucket identifier.
	 */
	bucket: string;

	/**
	 * The S3 partitioning expression.
	 */
	partition: string;

	/**
	 * The maximum size of the spool buffer in bytes.
	 */
	spoolSize: number;

	/**
	 * The maximum time to wait before flushing the buffer to S3.
	 */
	flushInterval: number;

	/**
	 * The configuration for the S3 client.
	 */
	s3config: ClientOptions;
}

/**
 * Internal class to buffer events in memory until they are ready to be uploaded to S3.
 */
class S3Buffer extends PassThrough {
	protected timer: NodeJS.Timeout;

	constructor(protected readonly client: Client, protected readonly config: S3OutputConfig) {
		super({objectMode: true});

		this.timer = setInterval(() => this.flush(() => {}), this.config.flushInterval);
	}

	_write(event: Event, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
		this.push(event, encoding);

		if (this.writableLength > this.config.spoolSize) {
			this.flush(callback);
		}

		callback();
	}

	flush(callback: (error?: (Error | null)) => void) {
		this.client.putObject(this.config.bucket, this.config.partition, this)
			.then(() => {
				callback();
			})
			.catch((error: Error) => {
				callback(error);
			});
	}
}

/**
 * Writes events to an S3 bucket.
 *
 * This output will spool events in memory until the Buffer reaches a certain size,
 * at which point it will be uploaded to the S3 bucket.
 */
export class S3 extends AbstractOutput {
	protected client: Client;
	protected buffers: Record<string, S3Buffer> = {};
	protected partition: Function;

	constructor(protected readonly config: S3OutputConfig) {
		super();

		this.client = new Client(config.s3config);

		this.partition = new Script(`(function (event) { return \`${config.partition}\`; })`).runInNewContext();
	}

	_write(event: Event, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
		const partition = this.resolvePartition(event);

		if (!this.buffers[partition]) {
			this.buffers[partition] = new S3Buffer(this.client, this.config);
		}

		this.buffers[partition].write(event, encoding, callback);
	}

	/**
	 * Resolves a partition expression to a string
	 */
	resolvePartition(event: any): string {
		return this.partition(event);
	}

	/**
	 * Flush all buffers to S3.
	 */
	flushAllBuffers() {
		for (const partition in this.buffers) {
			this.buffers[partition].flush(() => {});
		}
	}
}
