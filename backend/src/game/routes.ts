import express from 'express';
import {GameDataModel} from './model';
import {validateGame} from '../../../frontend/src/app/services/validate';
import {GameData} from '../../../frontend/src/app/services/game';
import {last} from 'lodash';

export const router = express.Router();

router.get('/api/game-data', async (req, res, next) => {
  try {
    const data = await GameDataModel.find();
    res.send(data.map((i: any) => i.results));
  } catch (e) {
    return next(e);
  }
});

router.get('/api/game-data/:id', async (req, res, next) => {
  try {
    const data = await GameDataModel.findOne({_id: req.params.id}).exec();
    if (!data) return res.sendStatus(404);

    res.send(data);
  } catch (e) {
    return next(e);
  }
});

router.post('/api/game-data', async (req, res, next) => {
  try {
    const inputData: GameData = req.body;
    if (!validate(inputData)) return res.status(400).send(genericError());

    const lastDayData = last(inputData.simulation)!;
    const dead = lastDayData.stats.deaths.total;
    const cost = lastDayData.stats.costs.total;

    const saveData = new GameDataModel({...inputData, results: {dead, cost}});
    const saveResult = await saveData.save();

    if (saveResult.errors) return res.status(400).send(genericError());

    res.send({id: saveData._id});
  } catch (e) {
    return next(e);
  }
});

// TODO implement and use on FE or remove
// router.put('/api/game-data/:id', async (req, res) => {
//   const todo = await GameDataModel.findOneAndUpdate({_id: req.params.id}, req.body, {new: true}).exec();
//   if (!todo) return res.sendStatus(404);
//   res.send(todo);
// });

function genericError() {
  return {error: 'Game data invalid'};
}

function validate(data: any): boolean {
  if (!data.mitigations) return false;
  if (!data.simulation || !data.simulation.length) return false;

  try {
    if (!validateGame(data)) return false;
  } catch (e) {
    return false;
  }

  return true;
}
