FROM node:14 as base

WORKDIR /app
# ADD . .

COPY package.json .

RUN npm set progress=false && npm config set depth 0
RUN npm install --only=production 
RUN cp -R node_modules prod_node_modules

FROM base

COPY --from=base /app/prod_node_modules ./node_modules
COPY . .


CMD ["node", "lib/index.js"]