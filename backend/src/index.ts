import Koa from 'koa';
import bodyParser from "koa-bodyparser";
import json from 'koa-json';
import logger from "koa-logger";
import mongoose from 'mongoose';
import {router} from './game/routes';

(async function() {
  const PORT = process.env.PORT || 8000;
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:8001/corona';

  const app = new Koa();

  app.use(json());
  app.use(logger());
  app.use(bodyParser({jsonLimit: '5mb'}));
  var views = require('koa-views');
  app.use(views(__dirname + '/game/views', {
    map: {
      html: 'handlebars'
    }
  }))
  app.use(router.routes()).use(router.allowedMethods());

  await mongoose.connect(MONGO_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`Connected to MongoDB at ${MONGO_URI}`);

  app.listen(PORT, () => {
    console.log(`⚡️Server is running at http://localhost:${PORT}`);
  });
})().catch(console.error);
