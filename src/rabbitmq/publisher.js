const infra = require("../config/initInfrastructure");

class EventPublisher {
  constructor() {
    this.exchange = process.env.AMQP_EXCHANGE || "impactlog_events";
  }

  async publish(routingKey, message) {
    try {
      if (infra.amqpChannel) {
        await infra.amqpChannel.publish(
          this.exchange,
          routingKey,
          Buffer.from(JSON.stringify(message)),
          { persistent: true }
        );

        console.log(`✅ Event published: ${routingKey}`);
      } else {
        console.warn("⚠️ AMQP channel not initialized, skipping event publish");
      }
    } catch (err) {
      console.error(`❌ Failed to publish event [${routingKey}]:`, err.message);
    }
  }
}

module.exports = new EventPublisher();
