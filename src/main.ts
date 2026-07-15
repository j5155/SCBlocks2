import './index.css';

import ui from '@nuxt/ui/vue-plugin';
import {createApp} from 'vue';
import {createRouter, createWebHistory} from 'vue-router';
import App from './App.vue';

const storedTheme = localStorage.getItem('systemcore-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.toggle(
  'dark',
  storedTheme === 'dark' || (storedTheme === null && prefersDark),
);

const router = createRouter({
  history: createWebHistory(),
  routes: [],
});

createApp(App).use(router).use(ui).mount('#app');
