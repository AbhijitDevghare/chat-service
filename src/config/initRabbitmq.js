const amqplib = require("amqplib");

async function initRabbitMQ() {
  const amqpUrl = process.env.RABBIT_URL || "amqp://localhost";
  const exchange = process.env.AMQP_EXCHANGE || "impactlog_events";

  try {
    const conn = await amqplib.connect(amqpUrl);
    const channel = await conn.createChannel();

    await channel.assertExchange(exchange, "topic", { durable: true });
    console.log("✅ Connected to RabbitMQ");

    return { conn, channel };
  } catch (err) {
    console.warn("⚠️ RabbitMQ unavailable, events disabled:", err.message);
    return { conn: null, channel: null };
  }
}

module.exports = { initRabbitMQ };
