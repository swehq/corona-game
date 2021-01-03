import express, { IRouterMatcher } from 'express';
import {GameDataModel} from './model';
import {validateGame} from '../../../frontend/src/app/services/validate';

export const router = express.Router();

router.get('/api/game-data', async (req, res) => {
  const data = await GameDataModel.find().exec();
  res.send(data);
});

router.get('/api/game-data/:id', async (req, res) => {
  const data = await GameDataModel.findOne({_id: req.params.id}).exec();
  if (!data) return res.sendStatus(404);

  res.send(data);
});

router.post('/api/game-data', async (req, res) => {
  if (!validate(req.body)) return res.status(400).send(genericError());

  const data = new GameDataModel(req.body);
  const saveResult = await data.save();

  if (saveResult.errors) return res.status(400).send(genericError());

  res.send({id: data._id});
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
  if (!data.simulation && !data.simulation.length) return false;

  try {
    if (!validateGame(data)) return false;
  } catch (e) {
    return false;
  }

  return true;
}
