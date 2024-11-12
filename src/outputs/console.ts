import {AbstractOutput} from "./index";
import {type Event} from "../index";

export class Console extends AbstractOutput {
	_write(chunk: Event, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		const formatted = this.formatEvent(chunk, encoding).toString();
		console.log(formatted);

		callback();
	};
}
