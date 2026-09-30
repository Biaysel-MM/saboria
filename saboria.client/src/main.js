import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { loadCatalog } from './data/products.js'

loadCatalog()

createApp(App).use(router).mount('#app')
