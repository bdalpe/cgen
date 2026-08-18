import {AbstractOutput} from "./index";
import {Event} from "../index";
import {createWriteStream, existsSync, WriteStream, rmSync, renameSync} from "node:fs";

export interface FileOutputConfig extends Record<string, unknown> {
	fileName: string;
	maxFiles?: number;
	maxFileSize?: number;
}

/**
 * Writes events to a rotating file.
 */
export class File extends AbstractOutput {
	protected writeStream: WriteStream;
	protected readonly fileName: string;
	protected readonly maxFiles: number;
	protected readonly maxFileSize: number;
	protected currentFileSize = 0;

	constructor(config: FileOutputConfig) {
		super(config);

		this.fileName = config.fileName;
		this.maxFiles = config.maxFiles ?? 5;
		this.maxFileSize = config.maxFileSize ?? 1024 * 1024;
		this.writeStream = this.createWriteStream();
	}

	protected createWriteStream(): WriteStream {
		return createWriteStream(this.fileName);
	}

	_write(chunk: Event, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		const formattedEvent = this.formatEvent(chunk, encoding);

		const write = () => {
			this.writeStream.write(formattedEvent, (error) => {
				if (!error) {
					this.currentFileSize += formattedEvent.byteLength;
				}

				callback(error);
			});
		};

		if (this.currentFileSize > 0 && this.currentFileSize + formattedEvent.byteLength > this.maxFileSize) {
			this.rotate((error) => {
				if (error) {
					callback(error);
					return;
				}

				write();
			});
			return;
		}

		write();
	};

	/*
	 * Rotate file output.
	 * Keep 5 files, each 1MB in size.
	 * filename.log -> filename.log.1 -> filename.log.2 -> filename.log.3 -> filename.log.4 -> filename.log.5
	 * When filename.log.5 is reached, it is deleted.
	 */
	rotate(callback: (error?: Error | null) => void = () => {}): void {
		this.writeStream.end(() => {
			try {
				for (let i = this.maxFiles; i >= 1; i--) {
					const source = `${this.fileName}.${i}`;
					const target = `${this.fileName}.${i + 1}`;

					if (i === this.maxFiles) {
						this.unlink(source);
					} else if (existsSync(source)) {
						this.rename(source, target);
					}
				}

				if (existsSync(this.fileName)) {
					this.rename(this.fileName, `${this.fileName}.1`);
				}

				this.writeStream = this.createWriteStream();
				this.currentFileSize = 0;
				callback();
			} catch (error) {
				callback(error as Error);
			}
		});
	}

	unlink(fileName: string): void {
		rmSync(fileName, {force: true});
	}

	rename(oldPath: string, newPath: string): void {
		renameSync(oldPath, newPath);
	}
}
