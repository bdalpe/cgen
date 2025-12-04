import {Postgresql} from "../postgresql";
import {Event} from "../../index";
import {describe, vi, test, expect} from "vitest";

vi.mock('pg', () => {
	class Client {
		connect: ReturnType<typeof vi.fn>;
		query: ReturnType<typeof vi.fn>;
		on: ReturnType<typeof vi.fn>;

		constructor() {
			this.connect = vi.fn();
			this.query = vi.fn();
			this.on = vi.fn();
		}
	}

	return {Client};
});

const newEvent = function (event: Event["event"]) {
	return {time: new Date(), event}
}

describe('PostgreSQL suite', () => {
	describe('event formatting', () => {
		const pg = new Postgresql({
			connectionString: 'vitest',
			tableName: 'vitest'
		});

		test('should format event correctly', () => {
			const event = newEvent({foo: "bar", baz: true});
			const formattedEvent = pg['formatEvent'](event, 'utf-8');
			expect(formattedEvent.toString()).toBe('INSERT INTO vitest (foo, baz) VALUES (bar, true)');
		});

		test('should call client.query with formatted event', async () => {
			const event = newEvent({foo: "bar", baz: true});
			const querySpy = vi.spyOn(pg['client'], 'query').mockResolvedValueOnce();

			await new Promise<void>((resolve, reject) => {
				pg._write(event, 'utf-8', (error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			});

			expect(querySpy).toHaveBeenCalledWith('INSERT INTO vitest (foo, baz) VALUES (bar, true)');
		});

		test('should handle client.query error', async () => {
			const event = newEvent({foo: "bar", baz: true});
			const querySpy = vi.spyOn(pg['client'], 'query').mockRejectedValueOnce(new Error('Query failed'));

			await expect(new Promise<void>((resolve, reject) => {
				pg._write(event, 'utf-8', (error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			})).rejects.toThrow('Query failed');

			expect(querySpy).toHaveBeenCalledWith('INSERT INTO vitest (foo, baz) VALUES (bar, true)');
		});
	});
});
