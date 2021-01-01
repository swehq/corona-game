import express from 'express';
import {TodoModel} from './todo.model';

const router = express.Router();

router.get('/api/todo', async (req, res) => {
  const todos = await TodoModel.find().exec();
  res.send(todos);
});

router.get('/api/todo/:id', async (req, res) => {
  const todo = await TodoModel.findOne({_id: req.params.id}).exec();
  if (!todo) return res.sendStatus(404);
  res.send(todo);
});
router.post('/api/todo', async (req, res) => {
  const todo = new TodoModel(req.body);
  await todo.save();
  res.send(todo);
});

router.put('/api/todo/:id', async (req, res) => {
  const todo = await TodoModel.findOneAndUpdate({_id: req.params.id}, req.body, {new: true}).exec();
  if (!todo) return res.sendStatus(404);
  res.send(todo);
});

export {router as todoRouter};
