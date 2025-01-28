import {readFileSync} from "node:fs";
import {join} from "node:path";
import {load} from "js-yaml";
import {AbstractGenerator, BaseGeneratorConfig} from "./generators";
import {AbstractOutput} from "./outputs";
import {Console} from "./outputs/console";
import {Interval} from "./generators/interval";
import {FUNCTION, PipelineFunction} from "./functions";
import {omit} from "es-toolkit";
import {pipeline} from "node:stream";
import {program} from 'commander';
import {Devnull} from "./outputs/devnull";
import {HttpOut} from "./outputs/http";
import {Postgresql} from "./outputs/postgresql";
import {S3} from "./outputs/s3";
import {SplunkHec} from "./outputs/splunkhec";
import {Syslog} from "./outputs/syslog";
import {Tcp} from "./outputs/tcp";

export interface Event {
	time: Date;
	event: string | Record<string, unknown>;
	metadata?: Record<string, unknown>;

	[props: string]: unknown;
}

export interface Config {
	generators: Record<string, Generator>
	pipelines: Record<string, IFunction[]>
	outputs?: Record<string, Output>
	routes: Route[];
}

export interface Generator {
	interval: number;
	samples: string[];
}

export interface IFunction {
	type: string;

	[prop: string]: unknown;
}

export interface Output {
	type: keyof typeof OUTPUTS;
}

export interface Route {
	generator: string;
	pipelines?: string[];
	output: string | string[];
}

const OUTPUTS = {
	console: Console,
	devnull: Devnull,
	http: HttpOut,
	postgres: Postgresql,
	s3: S3,
	hec: SplunkHec,
	syslog: Syslog,
	tcp: Tcp
} as const;

function run(config: Config) {
	const generators: Record<string, AbstractGenerator> = {};
	const outputs: Record<string, AbstractOutput> = {};

	for (const gen in config.generators) {
		const generator = new Interval(config.generators[gen] as BaseGeneratorConfig);
		generator.init();

		generators[gen] = generator;
	}

	function initPipeline(p: string): PipelineFunction[] {
		return config.pipelines[p].map(pipe => {
			const cfg = omit(pipe, ["type"]);
			return new PipelineFunction(pipe.type as keyof typeof FUNCTION, cfg);
		});
	}

	for (const output in config.outputs) {
		const cfg = omit(config.outputs[output], ["type"]);
		// @ts-expect-error overloaded config type
		const out = new OUTPUTS[config.outputs[output].type](cfg);
		out.init();
		outputs[output] = out;
	}

	for (const route of config.routes) {
		const gen = generators[route.generator];
		const outputsArray = Array.isArray(route.output) ? route.output : [route.output];

		for (const out of outputsArray) {
			pipeline(
				gen,
				// @ts-expect-error spread is okay here
				...(route.pipelines ?? []).flatMap(p => initPipeline(p)),
				outputs[out],
				() => {
				}
			);
		}
	}
}

program
	.option('-c, --config <path>', 'Path to the configuration file', 'config.yaml')
	.option('-d, --dir <path>', 'Change the working directory', process.cwd())
	.parse();

const opts = program.opts();

process.chdir(opts.dir);

const file = readFileSync(join(process.cwd(), opts.config));
const config = load(file.toString()) as Config;

run(config);
