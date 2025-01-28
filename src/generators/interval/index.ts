import {AbstractGenerator, type BaseGeneratorConfig} from "../index";

export class Interval extends AbstractGenerator {
	private intervalId: NodeJS.Timeout | null = null;

	constructor(protected config: BaseGeneratorConfig) {
		super(config);
	}

	async init(): Promise<void> {
		this.intervalId = setInterval(() => {
			this.generate();
		}, this.config.interval * 1000);
	}

	async unload(): Promise<void> {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
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
