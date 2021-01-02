// see https://medium.com/@agentwhs/complete-guide-for-typescript-for-mongoose-for-node-js-8cc0a7e470c1
import {Document, model, Schema} from 'mongoose'
// import {GameData} from '@frontend/game';
import {GameData} from '../../../frontend/src/app/services/game';

// TODO be more strict
const GameDataSchema = new Schema({
  mitigations: {
    type: Array,
    required: true
  },
  simulation: {
    type: Array,
    required: true,
  }
});

interface GameDataDocument extends GameData, Document {}
export const GameDataModel = model<GameDataDocument>('GameData', GameDataSchema);
