import {validateGame} from '../../../frontend/src/app/services/validate';
import {InvalidGameDataModel} from './model';
import mongoose from 'mongoose';
import {exit} from 'process';

async function run(): Promise<void> {
  const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:8001/corona';

  await mongoose.connect(MONGO_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const results = await InvalidGameDataModel.find({});
  for (const result of results) {
    const validity = validateGame(result.data).validity;
    result.validity = validity;
    await result.save();
  };
}

run()
  .catch(console.error)
  .finally(exit);
