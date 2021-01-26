// see https://medium.com/@agentwhs/complete-guide-for-typescript-for-mongoose-for-node-js-8cc0a7e470c1
import {Document, model, Schema} from 'mongoose'
// import {GameData} from '@frontend/game';
import {GameData} from '../../../frontend/src/app/services/game';

// TODO be more strict
const GameDataSchema = new Schema({
  mitigations: {
    type: Object,
    required: true,
  },
  scenarioName: {
    type: String,
    required: true,
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
    type: {
      dead: {
        type: Number,
        required: true,
      },
      cost: {
        type: Number,
        required: true,
      },
    },
    required: true,
    index: true,
  },
  created: {
    type: Date,
    reqired: true,
    default: Date.now,
  },
}, {minimize: false});

const InvalidGameDataSchema = new Schema({
  data: {},
  created: {
    type: Date,
    reqired: true,
    default: Date.now,
  },
}, {minimize: false});

interface GameDataDocument extends GameData, Document {
  results: {
    dead: number,
    cost: number,
  }
  created: Date,
}

interface InvalidGameDataDocument extends Document {
  data: any,
  created: Date,
}

export const GameDataModel = model<GameDataDocument>('GameData', GameDataSchema);
export const InvalidGameDataModel = model<InvalidGameDataDocument>('InvalidGameData', InvalidGameDataSchema);
