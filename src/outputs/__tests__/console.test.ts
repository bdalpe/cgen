import { Console } from '../console';
import { Event } from '../../index';
import {describe, it, expect, beforeEach, vi, Mock, MockedFunction} from 'vitest';

const encoding: BufferEncoding = 'utf-8';
const callback = vi.fn();

describe('Console', () => {
    let consoleOutput: Console;

    beforeEach(() => {
        consoleOutput = new Console();
        console.log = vi.fn(); // Mock console.log
        vi.resetAllMocks();
    });

    it('writes chunk to console', () => {
        const chunk: Event = { time: new Date(), event: 'sample data' };

        consoleOutput._write(chunk, encoding, callback);

        expect(callback).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(JSON.stringify(chunk));
    });

    it('calls the callback after logging', () => {
        const chunk: Event = { time: new Date(), event: 'another sample data' };

        consoleOutput._write(chunk, encoding, callback);

        expect(callback).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(JSON.stringify(chunk));
    });

    it('handles multiple writes correctly', () => {
        const chunks: Event[] = [
            { time: new Date(), event: 'first event' },
            { time: new Date(), event: 'second event' },
        ];

        chunks.forEach(chunk => {
            consoleOutput._write(chunk, encoding, callback);
        });

        expect(callback).toHaveBeenCalledTimes(chunks.length);
        expect(console.log).toHaveBeenCalledTimes(chunks.length);
        chunks.forEach(chunk => {
            expect(console.log).toHaveBeenCalledWith(JSON.stringify(chunk));
        });
    });
});
