import { resolve } from 'node:path';
import * as dotenv from 'dotenv';
import { connect } from 'amqplib';

import { EXCHANGE, EVENT } from './shared';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const run = async () => {
	try {
    const connection = await connect(`amqp://${process.env.AMQP_USERNAME}:${process.env.AMQP_PASSWORD}@localhost`);
		const channel = await connection.createChannel();
		await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    // '' - if we set empty string the topic name will generate automatically
    // replyTopic should be exclusive - if service stop works the queue will be destroyed
		const replyQueue = await channel.assertQueue('', { exclusive: true });

		channel.consume(replyQueue.queue, (message) => {
			console.log(message?.content.toString());
			console.log(message?.properties.correlationId);
		});
    // for generate correlationId should use uuid generator
		channel.publish(EXCHANGE, EVENT, Buffer.from('It works!'), { replyTo: replyQueue.queue, correlationId: '1' });
	} catch (e) {
		console.error(e);
	}
};

run();
