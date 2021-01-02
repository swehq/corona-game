import express from 'express';
import {GameDataModel} from './model';
import {validateGame} from '../../../frontend/src/app/services/validate';


export const router = express.Router();

// router.get('/api/todo', async (req, res) => {
//   const todos = await GameDataModel.find().exec();
//   res.send(todos);
// });
// router.get('/api/todo/:id', async (req, res) => {
//   const todo = await GameDataModel.findOne({_id: req.params.id}).exec();
//   if (!todo) return res.sendStatus(404);
//   res.send(todo);
// });
// router.put('/api/todo/:id', async (req, res) => {
//   const todo = await GameDataModel.findOneAndUpdate({_id: req.params.id}, req.body, {new: true}).exec();
//   if (!todo) return res.sendStatus(404);
//   res.send(todo);
// });

router.post('/api/game-data', async (req, res) => {
  try {
    if (!validateGame(req.body)) return res.status(400).send({error: 'Game data invalid'});
  } catch (e) {
    return res.status(400).send({error: 'Game data invalid'});
  }

  const data = new GameDataModel(req.body);
  const saveResult = await data.save();

  if (saveResult.errors) return res.status(400).send({error: 'Game data invalid'});

  res.send({id: data._id});
});
