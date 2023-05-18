# graphql-routing-split
Playing with routing some graphql by splitting it across different microservices that represent distinct 
(with no cohesion) API destinations (i.e. use a query aggregate but do not have cohesive API to hit)

### Design

This project consists of 3 services:

1. Gateway
2. Author
3. Book

The services are all [moleculer](https://moleculer.services/) based. `Author` and `Book` provide 
introspection endpoints which `Gateway` will use to decide how to split up graphql documents into 
the appropriate upstreams.

The purpose is simply to demonstrate an alternative to classical schema stitching.

### How to run

```shell
docker-compose up
```

### How to test

You can test splitting the query using the following command:

```shell
curl 'http://localhost:4000/' \
  -X POST \
  -D - \
  -H 'content-type: application/json' \
  --data '{
    "query": "{ author(id: \"123\") { name } book(id: \"abc\") { name } }"
  }'
```
