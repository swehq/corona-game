// see https://medium.com/@agentwhs/complete-guide-for-typescript-for-mongoose-for-node-js-8cc0a7e470c1
import {Document, model, Schema} from 'mongoose'
// import {GameData} from '@frontend/game';
import {GameData} from '../../../frontend/src/app/services/game';

// TODO be more strict
const GameDataSchema = new Schema({
  mitigations: {
    type: Object,
    required: true
  },
  simulation: {
    type: Array,
    required: true,
  },
  eventChoices: {
    type: Object,
    required: true
  },
  results: {
    dead: {
      type: Number,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
  },
  created: {
    type: Date,
    reqired: true,
    default: Date.now,
  },
});

interface GameDataDocument extends GameData, Document {}
export const GameDataModel = model<GameDataDocument>('GameData', GameDataSchema);
