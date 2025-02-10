import {HttpOut, HttpOutConfig} from "./http";
import {Event} from "../index";

export interface SplunkHecConfig extends HttpOutConfig {
	authToken?: string;
}

export class SplunkHec extends HttpOut {
	constructor(config: SplunkHecConfig) {
		config.headers = {
			...config.headers,
			'Authorization': `Splunk ${config.authToken}`
		}

		super(config);
	}

	protected formatEvent(e: Event): Buffer {
		// https://docs.splunk.com/Documentation/SplunkCloud/latest/Data/FormateventsforHTTPEventCollector#Event_metadata
		const {time, event, metadata} = e;

		const {host, source, sourcetype, index, ...rest} = metadata ?? {};

		const payload = {
			time: new Date(time).getTime() / 1000, // Time in milliseconds since epoch
			host,
			source,
			sourcetype,
			index,
			...(Object.keys(rest).length != 0 && {fields: rest}),
			event
		};

		return Buffer.from(JSON.stringify(payload));
	}
}
