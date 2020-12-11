'use strict';

const { ServiceBroker } = require('moleculer');
const graphql = require('graphql');
const GraphQLComponent = require('graphql-component');

const broker = new ServiceBroker({
  nodeID: 'book-gateway',
  transporter: 'nats://nats-server:4222',
  logLevel: 'info',
  cacher: 'memory'
});

broker.createService({
  name: 'book',
  created() {
    const { schema } = new GraphQLComponent({
      types: `
        type Book {
          id: ID!
          name: String
        }
        type Query {
          book(id: ID!): Book
        }
      `,
      resolvers: {
        Query: {
          book(_, { id }) {
            return {
              id,
              name: 'Some Book'
            };
          }
        }
      }
    });
    
    this.schema = schema;
  },
  actions: {
    async execute(ctx) {
      const { document } = ctx.params;

      return await graphql.execute(this.schema, document, undefined, {});
    }
  }
});

broker.start();