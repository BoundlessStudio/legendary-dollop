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

export const fetchHealth = async () => {
  const { data } = await apiClient.get<ApiHealthResponse>('/health');
  return data;
};

export const triggerResponseSimulation = async () => {
  const { data } = await apiClient.post<{ message: string }>('/responses/simulate-events');
  return data.message;
};
