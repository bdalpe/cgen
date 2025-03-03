/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import {type Event} from "../index";
import {timeFormat} from "d3-time-format";
import {join} from "node:path";
import {existsSync, readFileSync} from "node:fs";
import {Script} from "node:vm";
import {isPlainObject, isString} from "es-toolkit";
import * as crypto from "node:crypto";
import {parse} from "papaparse";
import {isObjectLike} from "es-toolkit/compat";

type TokenProcessorConfig = Record<string, unknown>;

export abstract class TokenProcessor<T extends TokenProcessorConfig> {
	protected config: T;
	protected generator: Generator<string | number | object | unknown> = this.token();
	protected match: RegExp;

	constructor(config: T) {
		this.config = config;
		this.match = new RegExp(`{{\\s*${this.config.token}\\s*}}`, 'g')
	}

	private nestedReplace(obj: Record<string, unknown>, val: string) {
		for (const [key, value] of Object.entries(obj)) {
			if (isString(value)) {
				obj[key] = value.replaceAll(this.match, val);
			} else if (isObjectLike(value)) {
				this.nestedReplace(value as Record<string, unknown>, val);
			}
		}
	}

	process(event: Event): Event {
		if (isString(event.event)) {
			event.event = event.event.replaceAll(this.match, this.nextToken(event));
		}

		if (isPlainObject(event.event)) {
			// Recurse through nested objects and replace all tokens
			this.nestedReplace(event.event, this.nextToken(event));
		}

		return event;
	}

	nextToken(_event: Event): string {
		return this.generator.next().value;
	}

	abstract token(): Generator<string | number | object | unknown>;
}

interface CustomFunctionProcessorConfig extends TokenProcessorConfig {
	function: string;
}

export class CustomFunctionProcessor extends TokenProcessor<CustomFunctionProcessorConfig> {
	protected fn: Function;
	protected context = {
		logger: console,
		Buffer: Buffer,
		JSON: JSON,
		crypto: crypto,
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
	pad?: number;
}

export class RandomHexPick extends TokenProcessor<RandomHexPickConfig> {
	*token(): Generator<string> {
		const {min: minNum, max: maxNum} = this.config.hex;
	    const min: number = parseInt(minNum, 16);
	    const max: number = parseInt(maxNum, 16);

	    while (true) {
	        yield Math.floor(Math.random() * (max - min + 1) + min).toString(16).padStart(this.config.pad ?? 0, "0");
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
	offset?: number;
}

export class Timestamp extends TokenProcessor<TimestampConfig> {
	protected ts: (date: Date) => string;
	protected offset: number;

	constructor(config: TimestampConfig) {
		super(config);
		this.offset = config.offset ?? 0;
		this.ts = timeFormat(this.config.format);
	}

	nextToken(event: Event): string {
		event.time.setTime(event.time.getTime() + this.offset);

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

		this.expression = new Function("event", `${this.config.expression}; return event;`);
	}

	process(event: Event): Event {
		event = this.expression(event);

		return event;
	}

	*token(): Generator<number> {}
}

interface LookupField {
	token: string;
	field?: string;
}

interface LookupConfig extends TokenProcessorConfig {
	file: string;
	fields: LookupField[];
}

export class Lookup extends TokenProcessor<LookupConfig> {
	protected lookup: unknown[];

	constructor(config: LookupConfig) {
		super(config);

		const data = readFileSync(join(process.cwd(), config.file), {encoding: "utf-8"});
		this.lookup = parse(data, {header: true}).data;
	}

	process(event: Event): Event {
		const row = this.generator.next().value;

		if (isString(event.event)) {
			for (const replacement of this.config.fields) {
				event.event = event.event.replaceAll(`{{${replacement.token}}}`, row[replacement.field ?? replacement.token]);
			}
		}

		return event;
	}

	*token(): Generator<unknown> {
		while (true) {
			yield this.lookup[Math.floor(Math.random() * (this.lookup.length - 1))];
		}
	}
}

interface IPAddressConfig extends TokenProcessorConfig {
	cidr: string;
}

export class IPAddress extends TokenProcessor<IPAddressConfig> {
	protected cidr: string;

	constructor(config: IPAddressConfig) {
		super(config);

		this.cidr = config.cidr;
	}

	nextToken(_event: Event): string {
		return this.generateIP();
	}

	*token(): Generator<string> {
		while (true) {
			yield this.generateIP();
		}
	}

	protected generateIP(): string {
		const [ip, mask] = this.cidr.split("/");
		const maskLength = parseInt(mask);
		// Calculate the subnet mask as an unsigned 32-bit integer
		const maskBits = ~((1 << (32 - maskLength)) - 1) >>> 0;

		// Convert the IP to a 32-bit integer
		const ipNum = ip.split(".").reduce((acc, octet, i) => acc + (parseInt(octet) << (24 - 8 * i)), 0);

		// Calculate the range of IPs within the subnet
		const baseIP = ipNum & maskBits; // Base network address
		const hostRange = ~maskBits >>> 0; // Number of host addresses available

		// Generate a random host offset
		const randomIP = baseIP + Math.floor(Math.random() * hostRange);

		// Convert back to dotted-decimal notation
		return [24, 16, 8, 0].map(shift => (randomIP >> shift) & 0xff).join(".");
	}
}
