import {Script} from "node:vm";
import {readFileSync} from "node:fs";
import {join} from "path";
import {Transform, TransformCallback} from "node:stream";
import {Event} from "../index";
import {existsSync} from "node:fs";

export class PipelineFunction extends Transform {
	protected readonly fn: Function;
	protected context = {
		logger: console,
		exports: {} as Record<string, Function>,
	}

	constructor(protected readonly func: string, protected readonly config: Record<string, unknown>) {
		super({objectMode: true});

		const path = join(process.cwd(), process.env.NODE_ENV === 'production' ? '' : 'src', "functions", this.func, "index.js");

		// Check if the function is a file path
		if (!existsSync(path)) {
			console.error(`Function file not found: ${path}`);
			process.exit(2);
		}

		const script = readFileSync(path);
		this.fn = new Script(`(function (exports) {${script}})`).runInNewContext(this.context)(this.context.exports);
	}

	init() {
		this.context.exports.init(this.config);
	}

	process(event: Event): Event {
		return this.context.exports.process(event);
	}

	_transform(event: Event, _encoding: BufferEncoding, callback: TransformCallback) {
		const processed = this.process(event);

		this.push(processed);

		callback();
	}
}
