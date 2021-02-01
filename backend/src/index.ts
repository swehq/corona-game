require('dotenv').config();

import Koa from 'koa';
import bodyParser from "koa-bodyparser";
import json from 'koa-json';
import logger from "koa-logger";
import mongoose from 'mongoose';
import {router} from './game/routes';
import {influxMonitoring} from './middleware/monitoring';

const views = require('koa-views');

(async function() {
  const app = new Koa();

  app.use(influxMonitoring(String(process.env.INFLUXDB_URI), String(process.env.MEASUREMENT_HTTP)));
  app.use(json());
  app.use(logger());
  app.use(bodyParser({jsonLimit: '5mb'}));
  app.use(views(__dirname + '/game/views', {
    map: {
      html: 'handlebars',
    },
  }));
  app.use(router.routes()).use(router.allowedMethods());

  await mongoose.connect(String(process.env.MONGO_URI), {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`Connected to MongoDB at ${process.env.MONGO_URI}`);

  app.listen(process.env.PORT, () => {
    console.log(`⚡️Server is running at http://localhost:${process.env.PORT}`);
  });
})().catch(console.error);
