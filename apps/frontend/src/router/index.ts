import { createRouter, createWebHistory } from 'vue-router';

const HomeView = () => import('../views/HomeView.vue');
const TodosView = () => import('../views/TodosView.vue');
const AboutView = () => import('../views/AboutView.vue');

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Dashboard' }
    },
    {
      path: '/todos',
      name: 'todos',
      component: TodosView,
      meta: { title: 'Todos' }
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
      meta: { title: 'About' }
    }
  ]
});

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title as string} | Legendary Dollop`;
  }
});
