import {Client} from 'pg';
import {AbstractOutput} from "./index";
import {Event} from "../index";
import {isString} from "es-toolkit";

export interface PostgreSQLConfig extends Record<string, unknown>{
	connectionString: string;
	tableName: string;
}

/**
 * Simple PostgreSQL output.
 *
 * All events passed to this output will take the KV pairs in the event and convert them
 * into a SQL INSERT statement.
 *
 * e.g.
 * {
 *     event: {
 *         foo: "bar"
 *         baz: true
 *     }
 * }
 * becomes
 * INSERT INTO <table> (foo, baz) VALUES ("bar", true);
 */
export class Postgresql extends AbstractOutput {
	protected readonly client: Client;

	constructor(protected readonly config: PostgreSQLConfig) {
		super();

		this.client = new Client({
			connectionString: config.connectionString
		});

		this.client.on('error', (error: Error) => this.emit('error', error));
	}

	protected formatEvent(event: Event, encoding: BufferEncoding): Buffer {
		// convert the KV pairs to a SQL INSERT statement
		const keys = Object.keys(event.event).map(key => key).join(', ');
		const vals = Object.values(event.event).map(value => isString(value) ? value.toString() : JSON.stringify(value)).join(', ');

		return Buffer.from(`INSERT INTO ${this.config.tableName} (${keys}) VALUES (${vals})`, encoding);
	}

	_write(event: Event, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		this.client.query(this.formatEvent(event, encoding).toString())
			.then(() => callback())
			.catch((error: Error | null) => callback(error));
	}
}
