import nock from 'nock';
import { HttpOut } from '../http';
import { Event } from '../../index';
import {describe, it, expect, beforeEach, vi} from 'vitest';

const encoding: BufferEncoding = 'utf-8';
const callback = vi.fn();

describe('HttpOut', () => {
    let httpOut: HttpOut;

    beforeEach(() => {
        const config = { endpoint: 'http://api.example.com/event' };
        httpOut = new HttpOut(config);
        vi.resetAllMocks();
    });

    it('sends event to HTTP endpoint', async () => {
        const event: Event = { time: new Date(), event: 'sample data' };

        nock('http://api.example.com').post('/event').reply(204, (_uri, requestBody) => {
            const expected = JSON.stringify(event);
            const payload = JSON.stringify(requestBody);

            expect(payload).toEqual(expected);
        });

        httpOut._write(event, encoding, callback);
        expect(callback).toHaveBeenCalled();
    });
});
