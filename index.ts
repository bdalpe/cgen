import {readFileSync} from "fs";
import {join} from "path";
import {load} from "js-yaml";
import {AbstractGenerator, BaseGeneratorConfig} from "./generators";
import {AbstractOutput} from "./outputs";
import {Console} from "./outputs/console";
import {Interval} from "./generators/interval";
import {PipelineFunction} from "./functions";
import {omit} from "es-toolkit";

export interface Event {
	time: Date;
	event: string | {};
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
	type: string;
}

export interface Route {
	generator: string;
	pipelines?: string[];
	output: string | string[];
}

const generators: Record<string, AbstractGenerator> = {};
const pipelines: Record<string, PipelineFunction> = {};
const outputs: Record<string, AbstractOutput> = {};
const routes: Route[] = [];

const file = readFileSync(join(__dirname, "examples", "simple", "simple.yaml"));
const config = load(file.toString()) as Config;

Object.keys(config.generators).forEach(gen => {
	const generator = new Interval(config.generators[gen] as BaseGeneratorConfig);
	generator.init();

	generators[gen] = generator;
});

Object.keys(config.pipelines).forEach(pipeline => {
	const pipes = config.pipelines[pipeline].map(((pipe, index) => {
		const c = config.pipelines[pipeline][index];
		const cfg = omit(c, "type");

		const func = new PipelineFunction(pipe.type, cfg);
		func.init();

		return func;
	}));

	// chain all pipelines together using .pipe()
	pipelines[pipeline] = pipes.reduce((prev, curr) => prev.pipe(curr));
})

outputs['console'] = new Console();

(config.routes as Route[]).forEach(route => {
	const gen = generators[route.generator];
	const outputsArray = Array.isArray(route.output) ? route.output : [route.output];

	const pipeline = Array.prototype.concat(generators[route.generator], route.pipelines?.map(p => pipelines[p]))

	const transformer = pipeline.reduce((prev, curr) => prev.pipe(curr));

	outputsArray.forEach(o => transformer.pipe(outputs[o]));
});

