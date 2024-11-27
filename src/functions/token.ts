import {type Event} from "../index";
import {timeFormat} from "d3-time-format";
import {join} from "path";
import {existsSync, readFileSync} from "node:fs";
import {Script} from "node:vm";

interface TokenProcessorConfig extends Record<string, unknown> {}

export abstract class TokenProcessor<T extends TokenProcessorConfig> {
	protected config: T;
	protected generator: Generator<string | number> = this.token();

	constructor(config: T) {
		this.config = config;
	}

	process(event: Event): Event {
		event.event = event.event.replaceAll(`{{${this.config.token}}}`, this.nextToken(event));

		return event;
	}

	nextToken(_event: Event): string {
		return this.generator.next().value;
	}

	abstract token(): Generator<string | number>;
}

interface CustomFunctionProcessorConfig extends TokenProcessorConfig {
	function: string;
}

export class CustomFunctionProcessor extends TokenProcessor<CustomFunctionProcessorConfig> {
	protected fn: Function;
	protected context = {
		logger: console,
		exports: {} as Record<string, Function>,
	}

	constructor(config: CustomFunctionProcessorConfig) {
		super(config);

		const path = join(process.cwd(), "functions", this.config.function, "index.js");

		// Check if the function is a file path
		if (!existsSync(path)) {
			console.error(`Function file not found: ${path}`);
			process.exit(2);
		}

		const script = readFileSync(path);
		this.fn = new Script(`(function (exports) {${script}})`).runInNewContext(this.context)(this.context.exports);

		this.context.exports.init(this.config);
	}

	process(event: Event): Event {
		return this.context.exports.process(event);
	}

	*token(): Generator<number> {}
}

interface RandomTokenConfig extends TokenProcessorConfig {
	pickFrom: string[];
}

export class RandomToken extends TokenProcessor<RandomTokenConfig> {
	*token(): Generator<string> {
		while (true) {
	        yield this.config.pickFrom[Math.floor(Math.random() * this.config.pickFrom.length)];
	    }
	}
}

interface RandomIntegerPickConfig extends TokenProcessorConfig {
	int: {
		min: number;
		max: number;
	}
}

export class RandomIntegerPick extends TokenProcessor<RandomIntegerPickConfig> {
	*token(): Generator<number> {
		const {min, max} = this.config.int;

		while (true) {
	        yield Math.floor(Math.random() * (max - min + 1)) + min;
	    }
	}
}

interface RandomHexPickConfig extends TokenProcessorConfig {
	hex: {
		min: string;
		max: string;
	}
}

export class RandomHexPick extends TokenProcessor<RandomHexPickConfig> {
	*token(): Generator<string> {
		let {min: minNum, max: maxNum} = this.config.hex;
	    let min: number = parseInt(minNum, 16);
	    let max: number = parseInt(maxNum, 16);

	    while (true) {
	        yield Math.floor(Math.random() * (max - min + 1) + min).toString(16);
	    }
	}
}

interface WeightedRandomPickConfig extends TokenProcessorConfig {
	weightedPick: {
		value: string;
		weight: number;
	}[]
}

export class WeightedRandomPick extends TokenProcessor<WeightedRandomPickConfig> {
	*token(): Generator<string> {
		const items = this.config.weightedPick;
	    const cumulativeWeights = [];
	    let totalWeight = 0;

	    // Build the cumulative distribution array
	    for (const item of items) {
	        totalWeight += item.weight || 1; // Default weight to 1 if not provided
	        cumulativeWeights.push({ value: item.value, cumulative: totalWeight });
	    }

	    // Infinite loop to yield values based on the cumulative distribution
	    while (true) {
	        const randomValue = Math.random() * totalWeight;

	        // Use the cumulative array to pick a value
	        for (const entry of cumulativeWeights) {
	            if (randomValue < entry.cumulative) {
	                yield entry.value;
	                break;
	            }
	        }
	    }
	}
}

interface TimestampConfig extends TokenProcessorConfig {
	format: string;
}

export class Timestamp extends TokenProcessor<TimestampConfig> {
	protected ts: (date: Date) => string;

	constructor(config: TimestampConfig) {
		super(config);

		this.ts = timeFormat(this.config.format);
	}

	nextToken(event: Event): string {
		return this.ts(event.time);
	}

	*token(): Generator<number> {}
}

interface EvalConfig extends TokenProcessorConfig {
	expression: string;
}

export class Eval extends TokenProcessor<EvalConfig> {
	protected expression: Function;

	constructor(config: EvalConfig) {
		super(config);

		this.expression = new Function("event", this.config.expression);
	}

	nextToken(event: Event): string {
		return this.expression(event);
	}

	*token(): Generator<number> {}
}