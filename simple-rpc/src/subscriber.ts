import { resolve } from 'node:path';
import * as dotenv from 'dotenv';
import { connect } from 'amqplib';

import { EXCHANGE, EVENT, QUEUE } from './shared';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const run = async () => {
	try {
		const connection = await connect(`amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@localhost`);
		const channel = await connection.createChannel();
		await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
		const queue = await channel.assertQueue(QUEUE, { durable: true });
		channel.bindQueue(queue.queue, EXCHANGE, EVENT);

		channel.consume(queue.queue, (message) => {
			if (!message) {
				return;
			}
			console.log(message.content.toString());
			if (message.properties.replyTo) {
				console.log(message.properties.replyTo);
        // Direct send to queue without exchange
        // replyTo is single queue we can do it directly
				channel.sendToQueue(message.properties.replyTo, Buffer.from('Answer'), { correlationId: message.properties.correlationId })
			}

      // Acknowledge means the message mark as processed
      // Manual acknowledge
      // channel.ack(message);
		}, {
      // Automatic acknowledge
			noAck: true
		})
	} catch (e) {
		console.error(e);
	}
};

run();
