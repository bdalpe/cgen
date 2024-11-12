import {Readable, ReadableOptions} from "node:stream";
import {Event} from "../index";

export interface BaseGeneratorConfig extends Record<string, unknown> {
	interval: number;
	samples: string[];
}

export abstract class AbstractGenerator extends Readable {
	protected constructor(protected readonly config: BaseGeneratorConfig, opts?: ReadableOptions) {
		super({...opts, objectMode: true});
	}

	async init(): Promise<void> {}

	async unload(): Promise<void> {
		this.push(null);
		this.destroy();
	}

	protected abstract generate(): void;

	protected newEvent(event: Event["event"]) {
		return {time: new Date(), event}
	}

	protected *nextEvent(): IterableIterator<Event["event"]> {
		const samples = this.config.samples;

		let n = 0;
		while (true) {
			yield samples[n];
			n = (n + 1) % samples.length;
		}
	}
}
