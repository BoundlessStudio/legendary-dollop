import { defineStore } from 'pinia';

import { createTodo, fetchTodos, toggleTodo, type ApiTodo } from '../services/apiClient';

interface TodosState {
  items: ApiTodo[];
  loading: boolean;
  error: string | null;
}

export const useTodosStore = defineStore('todos', {
  state: (): TodosState => ({
    items: [],
    loading: false,
    error: null
  }),
  getters: {
    completedTodos: (state) => state.items.filter((todo) => todo.completed),
    openTodos: (state) => state.items.filter((todo) => !todo.completed)
  },
  actions: {
    async loadTodos() {
      this.loading = true;
      this.error = null;
      try {
        this.items = await fetchTodos();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load todos';
      } finally {
        this.loading = false;
      }
    },
    async toggleTodo(id: number, completed: boolean) {
      this.error = null;
      try {
        const updated = await toggleTodo(id, completed);
        this.items = this.items.map((todo) => (todo.id === id ? updated : todo));
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update todo';
      }
    },
    async addTodo(title: string) {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;
      this.error = null;
      try {
        const created = await createTodo(trimmedTitle);
        this.items = [...this.items, created];
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create todo';
      }
    }
  }
});
