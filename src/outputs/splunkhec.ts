import {HttpOut} from "./http";
import {Event} from "../index";

export class SplunkHec extends HttpOut {
	protected formatEvent(e: Event, encoding: BufferEncoding = 'ascii'): Buffer {
		// https://docs.splunk.com/Documentation/SplunkCloud/latest/Data/FormateventsforHTTPEventCollector#Event_metadata
		const {time, event, metadata} = e;

		const {host, source, sourcetype, index, ...rest} = metadata ?? {};

		let payload = {
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
