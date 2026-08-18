import {Postgresql} from "../postgresql";
import {Event} from "../../index";
import {describe, vi, test, expect} from "vitest";

vi.mock('pg', () => {
	class Client {
		connect: ReturnType<typeof vi.fn>;
		query: ReturnType<typeof vi.fn>;
		on: ReturnType<typeof vi.fn>;
		end: ReturnType<typeof vi.fn>;

		constructor() {
			this.connect = vi.fn();
			this.query = vi.fn();
			this.on = vi.fn();
			this.end = vi.fn();
		}
	}

	return {Client};
});

const newEvent = function (event: Event["event"]) {
	return {time: new Date(), event}
}

describe('PostgreSQL suite', () => {
	const newOutput = () => new Postgresql({
		connectionString: 'vitest',
		tableName: 'public.vitest'
	});

	test('should connect and disconnect the client', async () => {
		const pg = newOutput();

		await pg.init();
		expect(pg['client'].connect).toHaveBeenCalledOnce();

		await pg.unload();
		expect(pg['client'].end).toHaveBeenCalledOnce();
	});

	describe('event formatting', () => {
		test('should format identifiers and value placeholders correctly', () => {
			const pg = newOutput();
			const event = newEvent({foo: "bar", 'quoted"column': true});
			const formattedEvent = pg['formatEvent'](event, 'utf-8');
			expect(formattedEvent.toString()).toBe(
				'INSERT INTO "public"."vitest" ("foo", "quoted""column") VALUES ($1, $2)'
			);
		});

		test('should pass event values separately to client.query', async () => {
			const pg = newOutput();
			const values = {
				message: "Robert'); DROP TABLE students;--",
				enabled: true,
				count: 3,
				optional: null,
				context: {source: 'vitest'}
			};
			const event = newEvent(values);
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

			expect(querySpy).toHaveBeenCalledWith(
				'INSERT INTO "public"."vitest" ("message", "enabled", "count", "optional", "context") VALUES ($1, $2, $3, $4, $5)',
				Object.values(values)
			);
		});

		test('should handle client.query error', async () => {
			const pg = newOutput();
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

			expect(querySpy).toHaveBeenCalledWith(
				'INSERT INTO "public"."vitest" ("foo", "baz") VALUES ($1, $2)',
				['bar', true]
			);
		});
	});
});
