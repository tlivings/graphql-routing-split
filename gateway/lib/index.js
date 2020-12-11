'use strict';

const { ServiceBroker } = require('moleculer');
const gateway = require('./gateway-service');

const broker = new ServiceBroker({
  nodeID: 'gateway',
  transporter: 'nats://nats-server:4222',
  logLevel: 'info',
  cacher: 'memory'
});

broker.createService(gateway);

broker.start();