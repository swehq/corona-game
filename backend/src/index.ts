import {json} from 'body-parser';
import express from 'express';
import mongoose from 'mongoose';
import {log} from 'shared';
// import {router} from './game/routes';

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:8001/corona';

const app = express();
app.use(json());
// app.use(router);

mongoose.connect(MONGO_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log(`Connected to MongoDB at ${MONGO_URI}`);
});

app.listen(PORT, () => {
  log(`⚡️Server is running at http://localhost:${PORT}`);
});
