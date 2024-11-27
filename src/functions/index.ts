import {Script} from "node:vm";
import {readFileSync} from "node:fs";
import {join} from "path";
import {Transform, TransformCallback} from "node:stream";
import {Event} from "../index";
import {existsSync} from "node:fs";
import {
	CustomFunctionProcessor,
	Eval,
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
	eval: Eval
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
}