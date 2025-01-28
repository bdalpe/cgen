import {Tcp} from "./tcp";
import {Event} from "../index";

export class Syslog extends Tcp {
	protected formatEvent(event: Event): Buffer {
	    event.severity = typeof event.severity === 'number' ? event.severity : 6;
        event.facility = typeof event.facility === 'number' ? event.facility : 1;

		const priority = `<${(event.severity as number) * 8 + (event.facility as number)}>`;

		return Buffer.from(`${priority}${event.time.toISOString()} ${event.metadata?.host ?? 'cgen'} ${event.event}\n`);
	}
}
