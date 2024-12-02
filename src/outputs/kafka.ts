import {Kafka as KafkaJS, KafkaConfig, Producer} from 'kafkajs';
import {AbstractOutput} from "./index";

export class Kafka extends AbstractOutput {
	protected client: Producer;

	constructor(protected readonly config: { config: KafkaConfig, topic: string }) {
		super();

		const kjs = new KafkaJS(config.config);
		this.client = kjs.producer()

		this.client.connect().catch((error: Error) => this.emit('error', error));
	}

	_write(chunk: never, encoding: BufferEncoding, callback: (error?: (Error | null)) => void): void {
		this.client.send({
			topic: this.config.topic,
			messages: [
				{value: this.formatEvent(chunk, encoding)}
			]
		}).catch((error: Error) => this.emit('error', error));

		callback();
	}
}
