import {AbstractOutput} from "./index";
import {Event} from "../index";
import {Agent, request} from 'node:http'

interface HttpOutConfig {
	endpoint: string;
}

/**
 * Writes events to an HTTP endpoint.
 */
export class HttpOut extends AbstractOutput {
	protected endpoint: URL;
	protected http: Agent;

	constructor(config: HttpOutConfig) {
		super();

		this.endpoint = new URL(config.endpoint);

		this.http = new Agent({
			keepAlive: false
		})
	}

	_write(event: Event, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		const req = request(
			{
				hostname: this.endpoint.hostname,
				path: this.endpoint.pathname,
				port: this.endpoint.port,
				agent: this.http,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			},
			(res) => {
				res.on('data', (chunk) => {
					console.log('Response', {chunk});
				})
			}
		);

		req.on('error', (error: Error) => {
			console.error('Error sending HTTP request', {error});
		});

		const formatted = this.formatEvent(event, encoding);

		req.write(formatted);
		req.end();

		callback();
	};
}
