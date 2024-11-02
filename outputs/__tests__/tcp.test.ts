import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Tcp } from '../tcp';

const callback = vi.fn();

vi.mock('node:net', () => ({
    Socket: vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockReturnThis(),
        on: vi.fn(),
        write: vi.fn(),
        end: vi.fn()
    }))
}));

describe('Tcp', () => {
    let tcp: Tcp;
    const mockHost = 'localhost';
    const mockPort = 8080;

    beforeEach(() => {
        tcp = new Tcp(mockHost, mockPort);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with correct host and port', () => {
        expect(tcp['host']).toBe(mockHost);
        expect(tcp['port']).toBe(mockPort);
    });

    it('should write event data to socket', () => {
        const mockEvent = { time: new Date(), event: 'test-event' };
        tcp._write(mockEvent, 'utf-8', callback);
        expect(tcp['client'].write).toHaveBeenCalled();
        expect(callback).toHaveBeenCalled();
    });
});
