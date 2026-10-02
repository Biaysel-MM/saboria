# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Mejoras pendientes

Lo que falta, por orden de urgencia. Ninguno bloquea el uso actual del sitio.

### Cambio de contraseña sin pantalla
El endpoint `PUT /api/auth/change-password` existe (`saboria.api/src/auth/auth.controller.ts`), pero nada en el front lo llama. Hoy un usuario que olvida su contraseña no tiene salida: no hay recuperación por correo ni cambio manual. Es el hueco más raro porque la mitad del trabajo ya está hecha en el backend.

### Sin tests ni lint
Ningún proyecto tiene comando de `test` o `lint` en `package.json`. Con pocas reseñas y un solo admin no se nota; cuando se vuelva a tocar el módulo de reseñas no habrá forma de saber si algo se rompió.

### SEO
La web es una SPA con un único `index.html`. Todas las rutas responden el mismo HTML vacío y el título nunca cambia, así que `/producto/:id` no existe para un buscador. Hace falta SSR o, como mínimo, titles y descripciones por ruta.

### Paginación y orden en el servidor
`ReviewsService.listVisible` devuelve la lista completa de reseñas de un producto. Aguanta hasta que un producto tenga cientos: la respuesta pesa y el scroll se vuelve eterno. Falta `page`/`limit` y selector de orden (más recientes, más altas, más bajas).

### Página de "mis reseñas"
No hay dónde ver todas las reseñas publicadas por un usuario ni editarlas en un solo lugar. El endpoint `GET /api/products/:id/reviews/mine` ya existe y no se usa.

### Aviso de privacidad
Se pide correo al registrar cuentas y no hay aviso de privacidad ni forma de que un usuario vea o borre sus datos. Aplica la Ley 172-13.

### Envío de correo real
El servicio de mail funciona en modo desarrollo (imprime el código de verificación en consola). Falta configurar SMTP para envío real.

### fuera de alcance
Carrito y checkout. El proyecto es un catálogo con contacto, no una tienda; si algún día se quiere vender en línea, `/producto/:id` ya es la base.
