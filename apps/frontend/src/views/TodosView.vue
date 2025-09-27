<template>
  <section class="todos-view">
    <header>
      <h2>Todos</h2>
      <p>Manage todos served by the Express API.</p>
    </header>

    <form class="todo-form" @submit.prevent="submit">
      <input v-model="newTodo" type="text" placeholder="Add a todo" />
      <button type="submit">Add</button>
    </form>

    <p v-if="store.loading">Loading todos…</p>
    <p v-else-if="store.error" class="error">{{ store.error }}</p>

    <div class="todo-columns" v-else>
      <div>
        <h3>Open ({{ store.openTodos.length }})</h3>
        <ul>
          <li v-for="todo in store.openTodos" :key="todo.id">
            <label>
              <input type="checkbox" :checked="todo.completed" @change="toggle(todo.id, true)" />
              <span>{{ todo.title }}</span>
            </label>
          </li>
        </ul>
      </div>
      <div>
        <h3>Completed ({{ store.completedTodos.length }})</h3>
        <ul>
          <li v-for="todo in store.completedTodos" :key="todo.id">
            <label class="completed">
              <input type="checkbox" :checked="todo.completed" @change="toggle(todo.id, false)" />
              <span>{{ todo.title }}</span>
            </label>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useTodosStore } from '../stores/useTodosStore';

const store = useTodosStore();
const newTodo = ref('');

const submit = async () => {
  if (!newTodo.value.trim()) return;
  await store.addTodo(newTodo.value);
  newTodo.value = '';
};

const toggle = (id: number, completed: boolean) => {
  store.toggleTodo(id, completed);
};

onMounted(() => {
  store.loadTodos();
});
</script>

<style scoped>
.todos-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.todo-form {
  display: flex;
  gap: 0.75rem;
}

.todo-form input {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5f5;
  font-size: 1rem;
}

.todo-form button {
  background-color: #42b883;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
}

.todo-columns {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .todo-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

li {
  background: #fff;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

label.completed span {
  text-decoration: line-through;
  color: #9ca3af;
}

.error {
  color: #b91c1c;
  font-weight: 600;
}
</style>
