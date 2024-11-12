import { Devnull } from '../devnull';
import { Event } from '../../index';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const encoding: BufferEncoding = 'utf-8';
const callback = vi.fn();

describe('Devnull', () => {
    let devnullOutput: Devnull;

    beforeEach(() => {
        vi.resetAllMocks();
        devnullOutput = new Devnull();
    });

    it('calls callback without error', () => {
        const chunk: Event = { time: new Date(), event: 'sample data' };

        try {
            devnullOutput._write(chunk, encoding, callback);
            expect(callback).toHaveBeenCalledOnce();
        } catch {
            expect.unreachable();
        }
    });

    it('handles empty chunk gracefully', () => {
        const chunk: Event = { time: new Date(), event: '' };

        try {
            devnullOutput._write(chunk, encoding, callback);
            expect(callback).toHaveBeenCalledOnce();
        } catch {
            expect.unreachable();
        }
    });

    it('handles null chunk gracefully', () => {
        // @ts-expect-error yes, it's not a valid Event
        const chunk: Event = null;

        try {
            devnullOutput._write(chunk, encoding, callback);
            expect(callback).toHaveBeenCalledOnce();
        } catch {
            expect.unreachable();
        }
    });

    it('handles undefined chunk gracefully', () => {
        // @ts-expect-error yes, it's not a valid Event
        const chunk: Event = undefined;

        try {
            devnullOutput._write(chunk, encoding, callback);
            expect(callback).toHaveBeenCalledOnce();
        } catch {
            expect.unreachable();
        }
    });
});
