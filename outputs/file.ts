import {AbstractOutput} from "./index";
import {Event} from "../index";
import {createWriteStream, WriteStream, rmSync, renameSync} from "node:fs";

/**
 * Writes events to a rotating file.
 */
export class File extends AbstractOutput {
	protected writeStream: WriteStream;
	protected maxFiles: number = 5;
	protected maxFileSize = 1024 * 1024; // 1MB

	constructor(protected readonly fileName: string) {
		super();

		this.writeStream = createWriteStream(fileName);

		this.writeStream.on('error', (error: Error) => this.emit('error', error));
	}

	_write(chunk: Event, encoding: BufferEncoding): void {
		this.writeStream.write(this.formatEvent(chunk, encoding));
	};

	/*
	 * Rotate file output.
	 * Keep 5 files, each 1MB in size.
	 * filename.log -> filename.log.1 -> filename.log.2 -> filename.log.3 -> filename.log.4 -> filename.log.5
	 * When filename.log.5 is reached, it is deleted.
	 */
	rotate(): void {
		this.writeStream.end();

		for (let i = this.maxFiles - 1; i >= 1; i--) {
			const source = `${this.fileName}.${i}`;
			const target = `${this.fileName}.${i + 1}`;

			if (i === this.maxFiles - 1) {
				this.unlink(source);
			} else {
				this.rename(source, target);
			}
		}

		this.rename(this.fileName, `${this.fileName}.1`);

		this.writeStream = createWriteStream(this.fileName, {flags: 'a'});

		this.writeStream.on('error', (error: Error) => this.emit('error', error));
	}

	unlink(fileName: string): void {
		rmSync(fileName);
	}

	rename(oldPath: string, newPath: string): void {
		renameSync(oldPath, newPath);
	}
}
