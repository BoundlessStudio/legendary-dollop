import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 5000
});

export interface ApiHealthResponse {
  status: string;
  uptimeMs: number;
  timestamp: string;
}

export interface ApiTodo {
  id: number;
  title: string;
  completed: boolean;
}

export const fetchHealth = async () => {
  const { data } = await apiClient.get<ApiHealthResponse>('/health');
  return data;
};

export const fetchTodos = async () => {
  const { data } = await apiClient.get<{ todos: ApiTodo[] }>('/todos');
  return data.todos;
};

export const toggleTodo = async (id: number, completed: boolean) => {
  const { data } = await apiClient.patch<{ todo: ApiTodo }>(`/todos/${id}`, { completed });
  return data.todo;
};

export const createTodo = async (title: string) => {
  const { data } = await apiClient.post<{ todo: ApiTodo }>('/todos', { title });
  return data.todo;
};
