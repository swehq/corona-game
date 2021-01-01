import {Document, model, Schema} from 'mongoose'

// see https://medium.com/@agentwhs/complete-guide-for-typescript-for-mongoose-for-node-js-8cc0a7e470c1

const TodoSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  done: {
    type: Boolean,
    required: true,
  },
});

export interface Todo {
  title: string;
  done: string;
}

export interface TodoDocument extends Todo, Document {
}

const TodoModel = model<TodoDocument>('Todo', TodoSchema);

export {TodoModel}

export default TodoModel;
