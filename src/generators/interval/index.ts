import {AbstractGenerator, type BaseGeneratorConfig} from "../index";

export class Interval extends AbstractGenerator {
	constructor(protected config: BaseGeneratorConfig) {
		super(config);
	}

	async init(): Promise<void> {
		setInterval(() => {
			this.generate();
		}, this.config.interval * 1000);
	}

	async unload(): Promise<void> {
		clearInterval(this.config.interval);
		await super.unload();
	}

	protected generate(): void {
		const nextEvent = this.nextEvent().next().value;
		const eventObj = this.newEvent(nextEvent);

		this.push(eventObj);
	}

	_read() {
		// no-op
	}
}
