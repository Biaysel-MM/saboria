import { createApp } from 'vue'
import { Icon, addCollection } from '@iconify/vue'
import carbonIcons from './icons/carbon-used.json'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { loadCatalog } from './data/products.js'

// Iconos Carbon empaquetados localmente (sin llamadas a la red).
// Subconjunto generado por scripts/gen-icons.mjs (corre en predev/prebuild);
// si usas un icono nuevo y no aparece: node scripts/gen-icons.mjs
addCollection(carbonIcons)

loadCatalog()

createApp(App).use(router).component('Icon', Icon).mount('#app')
