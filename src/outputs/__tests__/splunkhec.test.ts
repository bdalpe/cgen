import nock from 'nock';
import {SplunkHec} from "../splunkhec";
import { Event } from '../../index';
import {describe, it, expect, beforeEach, vi} from 'vitest';

const encoding: BufferEncoding = 'utf-8';
const callback = vi.fn();

const checkPayload = (expected: Record<string, unknown>) => {
	return nock('http://api.example.com').post('/event').reply(204, (_uri, requestBody) => {
        expect(requestBody).toEqual(expected);
	});
}

describe('Splunk HEC', () => {
    let splunkHec: SplunkHec;

    beforeEach(() => {
        const config = { endpoint: 'http://api.example.com/event' };
        splunkHec = new SplunkHec(config);
		vi.resetAllMocks();
    });

    it('sends event to HTTP endpoint', async () => {
        const event: Event = { time: new Date(), event: 'sample data' };

		checkPayload({time: new Date(event.time).getTime() / 1000, event: event.event});

        splunkHec._write(event, encoding, callback);
		expect(callback).toHaveBeenCalled();
    });

	it('sends the correct metadata', async () => {
        const event: Event = {
			time: new Date(),
	        event: 'sample data',
	        metadata: {
				index: 'goat',
				sourcetype: 'goat',
		        extra: true
			}
		};

		checkPayload(expect.objectContaining({sourcetype: 'goat', index: 'goat', fields: {extra: true}}));

        splunkHec._write(event, encoding, callback);
		expect(callback).toHaveBeenCalled();
    });

	it('sends the correct authorization header', async () => {
		const config = { endpoint: 'http://api.example.com/event', authToken: 'token' };
		splunkHec = new SplunkHec(config);

		const event: Event = {
			time: new Date(),
	        event: 'sample data',
	        metadata: {
				index: 'goat',
				sourcetype: 'goat',
		        extra: true
			}
		};

		// check that the authorization header is set
		expect(splunkHec['headers']).toEqual(expect.objectContaining({'Authorization': 'Splunk token'}));

		splunkHec._write(event, encoding, callback);
		expect(callback).toHaveBeenCalled();
	});
});
