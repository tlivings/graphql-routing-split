'use strict';

const { ServiceBroker } = require('moleculer');
const graphql = require('graphql');
const GraphQLComponent = require('graphql-component');

const broker = new ServiceBroker({
  nodeID: 'author-gateway',
  transporter: 'nats://nats-server:4222',
  logLevel: 'info',
  cacher: 'memory'
});

broker.createService({
  name: 'author',
  created() {
    const { schema } = new GraphQLComponent({
      types: `
        type Author {
          id: ID!
          name: String
        }
        type Query {
          author(id: ID!): Author
        }
      `,
      resolvers: {
        Query: {
          author(_, { id }) {
            return {
              id,
              name: 'Some Author'
            };
          }
        }
      }
    });
    
    this.schema = schema;
    
    this.operations = this.getOperations(this.schema);
  },
  methods: {
    getOperations(schema) {
      const queryType = schema.getQueryType();
      const mutationType = schema.getMutationType();
      
      const operations = {};
      
      if (queryType) {
        operations.query = Object.keys(queryType.getFields());
      }
      if (mutationType) {
        operations.mutation = Object.keys(mutationType.getFields());
      }
      
      return operations;
    }
  },
  actions: {
    introspect(ctx) {
      return { name: this.name, operations: this.operations };
    },
    async execute(ctx) {
      const { document, originalQuery } = ctx.params;

      return await graphql.execute(this.schema, document, undefined, {});
    }
  }
});

broker.start();