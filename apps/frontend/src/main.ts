import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import { router } from './router';
import { useResponseEventsStore } from './stores/useResponseEventsStore';

import './assets/main.css';

const app = createApp(App);

const pinia = createPinia();

app.use(pinia);
app.use(router);

const responseEventsStore = useResponseEventsStore(pinia);
responseEventsStore.init();

app.mount('#app');
