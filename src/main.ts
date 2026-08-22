import './assets/main.css'
import colorize from './directives/colorize'

import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App);
app.directive("colorize", colorize);
app.mount("#app");
