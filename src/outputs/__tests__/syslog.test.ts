import {describe, it, expect, vi} from 'vitest';
import { Syslog } from '../syslog';
import { Event } from '../../index';

vi.mock('node:net', () => ({
    Socket: vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockReturnThis(),
        on: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        destroy: vi.fn(),
        removeAllListeners: vi.fn()
    }))
}));

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
