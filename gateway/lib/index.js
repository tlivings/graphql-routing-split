'use strict';

const debug = require('debug')('event-gateway');
const http = require('http');
const micro = require('micro');;
const gql = require('graphql-tag');
const { splitDocumentByUpstream } = require('./graphql-utils');
const { ServiceBroker } = require('moleculer');

const broker = new ServiceBroker({
  nodeID: 'gateway',
  transporter: 'nats://nats-server:4222',
  logLevel: 'info',
  cacher: 'memory'
});

broker.createService({
  name: 'gateway-service',
  created() {
    this.server = http.createServer((req, res) => {
      this.requestHandler(req).then((result) => {
        micro.send(res, 200, result);
      }).catch((error) => {
        debug(error);
        micro.send(res, 500, {
          errors: [error]
        });
      });
    });
  },
  async started() {
    const url = await this.listen(4000);

    debug(`http server listening on ${url}`);
  },
  async stopped() {
    await this.close();

    debug('http server stopped.');
  },
  methods: {
    listen(port) {
      return new Promise((resolve, reject) => {
        this.server.on('error', reject)

        this.server.listen({ port }, () => {
          const { port } = this.server.address();

          this.server.removeListener('error', reject);

          resolve(`http://localhost:${port}`);
        });
      });
    },
    async close() {
      return new Promise((resolve, reject) => {
        this.server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
    async requestHandler(req) {
      debug('received a request');

      const body = await micro.json(req);
    
      const document = gql(body.query);

      const upstreamDocuments = splitDocumentByUpstream(this.mapOperations, document);

      const work = Object.entries(upstreamDocuments).map(([upstream, document]) => {
        return this.broker.call(upstream, { document, originalQuery: body.query });
      });
    
      const results = await Promise.all(work);
      
      return results.reduce((merged, result) => {
        merged.data = Object.assign(merged.data, result.data);
        
        if (result.errors && result.errors.length) {
          merged.errors.push(...result.errors);
        }
        
        return merged;
      }, { data: {}, errors: [] });
    },
    //DUMMY NOT DOING DISCOVERY RIGHT NOW
    mapOperations(operationName, attribute) {
      const map = {
        query: {
          author: 'author.execute',
          book: 'book.execute'
        }
      };
      return map[operationName] && map[operationName][attribute];
    }
  }
});

broker.start();