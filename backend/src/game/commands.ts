require('dotenv').config();

import {last} from 'lodash';
import mongoose from 'mongoose';
import {exit} from 'process';
import {validateGame} from '../../../frontend/src/app/services/validate';
import {GameData} from '../app/services/game';
import {GameDataModel, InvalidGameDataModel} from './model';

const BATCH_SIZE = 10;

let command: () => Promise<void>;
switch (process.argv[2]) {
  case 'move':
    command = move;
    break;
  default:
    command = validate;
}

command()
  .catch(console.error)
  .finally(exit);

async function connect(): Promise<void> {
  await mongoose.connect(String(process.env.MONGO_URI), {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function move(): Promise<void> {
  console.time('move');
  await connect();

  while (true) {
    const results = await InvalidGameDataModel
      .find({validity: 'valid'})
      .limit(BATCH_SIZE);

    if (!results.length) break;

    console.log(`Processing batch of ${results.length}`);
    console.timeLog('move');

    for (const result of results) {
      const gameData = result.data as GameData;
      const lastDayData = last(gameData.simulation)!;
      const dead = lastDayData.stats.deaths.total;
      const cost = lastDayData.stats.costs.total;

      const game = new GameDataModel({...gameData, created: result.created, results: {dead, cost}});
      await game.save();

      result.validity = 'valid-moved';
      await result.save();
    }
  }

  console.timeEnd('move');
}

async function validate(): Promise<void> {
  console.time('validate');
  await connect();

  while (true) {
    const results = await InvalidGameDataModel
      .find({validity: {$exists: false}})
      .limit(BATCH_SIZE);

    if (!results.length) break;

    console.log(`Processing batch of ${results.length}`);
    console.timeLog('validate');

    for (const result of results) {
      const validity = validateGame(result.data).validity;
      result.validity = validity;
      await result.save();
    }
  }

  console.timeEnd('validate');
}
