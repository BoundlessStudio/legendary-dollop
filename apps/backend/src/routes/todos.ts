import { Router } from 'express';

import { Todo } from '../types/todo.js';

const todos: Todo[] = [
  { id: 1, title: 'Explore the new monorepo', completed: false },
  { id: 2, title: 'Start the Express API', completed: true },
  { id: 3, title: 'Build the Vue frontend', completed: false }
];

export const todosRouter = Router();

todosRouter.get('/', (_req, res) => {
  res.json({ todos });
});

todosRouter.post('/', (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTodo: Todo = {
    id: todos.length + 1,
    title,
    completed: false,
  };

  todos.push(newTodo);

  res.status(201).json({ todo: newTodo });
});

todosRouter.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find((item) => item.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  if (typeof req.body.completed === 'boolean') {
    todo.completed = req.body.completed;
  }

  if (typeof req.body.title === 'string' && req.body.title.trim().length > 0) {
    todo.title = req.body.title.trim();
  }

  res.json({ todo });
});
