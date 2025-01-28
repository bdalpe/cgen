import {Transform, TransformCallback} from "node:stream";
import {Event} from "../index";
import {
	CustomFunctionProcessor,
	Eval,
	IPAddress,
	Lookup,
	RandomHexPick,
	RandomIntegerPick,
	RandomToken,
	Timestamp,
	WeightedRandomPick
} from "./token";

export const FUNCTION = {
	token: RandomToken,
	int: RandomIntegerPick,
	hex: RandomHexPick,
	weighted: WeightedRandomPick,
	timestamp: Timestamp,
	lookup: Lookup,
	eval: Eval,
	ipaddr: IPAddress
} as const;

export class PipelineFunction extends Transform {
	protected processor;

	constructor(protected readonly func: keyof typeof FUNCTION, protected readonly config: Record<string, unknown>) {
		super({objectMode: true});

		if (FUNCTION[func as keyof typeof FUNCTION]) {
			// @ts-expect-error overloaded config type
			this.processor = new FUNCTION[this.func](this.config);
		} else {
			this.processor = new CustomFunctionProcessor({function: this.func, ...this.config});
		}
	}

	process(event: Event): Event {
		return this.processor.process(event);
	}

	_transform(event: Event, _encoding: BufferEncoding, callback: TransformCallback) {
		const processed = this.process(event);

		this.push(processed);

		callback();
	}

	_destroy(error: Error | null, callback: (error?: (Error | null)) => void) {
		this.removeAllListeners();
		callback(error);
	}
}
