import {AbstractOutput} from "./index";
import type {Event} from "../index";

export class Devnull extends AbstractOutput {
	_write(_event: Event, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        // no-op
		callback();
	};
}
