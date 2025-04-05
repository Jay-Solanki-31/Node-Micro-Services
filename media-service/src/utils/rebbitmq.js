const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'threads_events';


async function rabbitConnect(params) {
    try {

        connection = await amqp.connect(process.env.RABBITMQ_URI);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });
        logger.info('Connected to RabbitMQ');
        return channel;
        
    } catch (error) {
        logger.error('Error connecting to RabbitMQ', error);
    }
}


async function publishEvent(routingKey, message) {
    if (!channel) { 
        await rabbitConnect();
    }

    await channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
    logger.info(`Event published to ${routingKey}`);
}

async function consumeEvent(routingKey, callback) {
    if (!channel) { 
        await rabbitConnect();
    }

    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

    channel.consume(q.queue, (msg) => {
        if (msg !== null) {
            callback(JSON.parse(msg.content.toString()));
            channel.ack(msg);
        }
    }
    );
    logger.info(`Event subscribed to ${routingKey}`);
}

module.exports = { rabbitConnect , publishEvent , consumeEvent };

