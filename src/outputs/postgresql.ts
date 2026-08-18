import {Client} from 'pg';
import {AbstractOutput} from "./index";
import {Event} from "../index";

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
 * INSERT INTO "<table>" ("foo", "baz") VALUES ($1, $2);
 * with ["bar", true] passed separately as parameters.
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

	async init(): Promise<void> {
		await this.client.connect();
	}

	async unload(): Promise<void> {
		await this.client.end();
	}

	private quoteIdentifier(identifier: string): string {
		return `"${identifier.replaceAll('"', '""')}"`;
	}

	private quoteTableName(tableName: string): string {
		return tableName.split('.').map(part => this.quoteIdentifier(part)).join('.');
	}

	protected formatEvent(event: Event, encoding: BufferEncoding): Buffer {
		const keys = Object.keys(event.event).map(key => this.quoteIdentifier(key)).join(', ');
		const placeholders = Object.keys(event.event).map((_, index) => `$${index + 1}`).join(', ');

		return Buffer.from(
			`INSERT INTO ${this.quoteTableName(this.config.tableName)} (${keys}) VALUES (${placeholders})`,
			encoding
		);
	}

	_write(event: Event, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		this.client.query(this.formatEvent(event, encoding).toString(), Object.values(event.event))
			.then(() => callback())
			.catch((error: Error | null) => callback(error));
	}
}
