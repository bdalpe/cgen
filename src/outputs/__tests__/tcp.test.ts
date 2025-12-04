import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Tcp } from '../tcp';

const callback = vi.fn();

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

describe('Tcp', () => {
    let tcp: Tcp;
    const mockHost = 'localhost';
    const mockPort = 8080;

    beforeEach(() => {
        tcp = new Tcp({
            host: mockHost,
            port: mockPort
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with correct host and port', () => {
        expect(tcp['client'].connect).toHaveBeenCalledWith(expect.objectContaining({host: mockHost, port: mockPort}));
    });

    it('should write event data to socket', () => {
        const mockEvent = { time: new Date(), event: 'test-event' };
        tcp._write(mockEvent, 'utf-8', callback);
        expect(tcp['client'].write).toHaveBeenCalled();
        expect(callback).toHaveBeenCalled();
    });
});
