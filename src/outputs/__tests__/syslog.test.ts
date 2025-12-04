import {describe, it, expect, vi} from 'vitest';
import { Syslog } from '../syslog';
import { Event } from '../../index';

vi.mock('node:net', () => {
	class Socket {
		connect: ReturnType<typeof vi.fn>;
		on: ReturnType<typeof vi.fn>;
		write: ReturnType<typeof vi.fn>;
		end: ReturnType<typeof vi.fn>;
		destroy: ReturnType<typeof vi.fn>;
		removeAllListeners: ReturnType<typeof vi.fn>;
		writable: boolean;
		destroyed: boolean;

		constructor () {
			this.connect = vi.fn().mockReturnThis();
			this.on = vi.fn();
			this.write = vi.fn();
			this.end = vi.fn();
			this.destroy = vi.fn();
			this.removeAllListeners = vi.fn();
			this.writable = true;
			this.destroyed = false;
		}
	}

	return {Socket};
});

describe('Syslog', () => {
    it('should format the event correctly with default severity and facility', () => {
        const syslog = new Syslog({host: 'localhost', port: 514});
        const event: Event = {
            time: new Date('2023-10-01T12:00:00Z'),
            event: 'Test event',
        };

        const formattedEvent = syslog['formatEvent'](event);

        const expectedPriority = `<${6 * 8 + 1}>`;
        const expectedMessage = Buffer.from(`${expectedPriority}${event.time.toISOString()} cgen ${event.event}\n`);

        expect(formattedEvent).toStrictEqual(expectedMessage);
    });

    it('should format multiple events correctly', () => {
        const syslog = new Syslog({host: 'localhost', port: 514});
        const events: Event[] = [
            {
                time: new Date('2023-10-01T12:00:00Z'),
                event: 'First event',
            },
            {
                time: new Date('2023-10-01T13:00:00Z'),
                event: 'Second event',
            },
        ];

        events.forEach(event => {
            const formattedEvent = syslog['formatEvent'](event);
            const expectedPriority = `<${6 * 8 + 1}>`;
            const expectedMessage = Buffer.from(`${expectedPriority}${event.time.toISOString()} cgen ${event.event}\n`);
            expect(formattedEvent).toStrictEqual(expectedMessage);
        });
    });
});
