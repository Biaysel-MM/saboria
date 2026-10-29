# Saboria

Menú digital con comunidad para negocios de postres, desayunos, cafés y bebidas. Saboria es la base: cada negocio la adapta con su nombre, logo, colores y datos de contacto.

## Visión

La carta de papel funciona, pero se queda en la mesa. Los clientes ya pasan el día en redes sociales, así que el menú debería estar ahí: un sitio donde ver los productos con foto y precio, dejar reseñas, leer lo que opinan otros y volver la próxima vez. La idea es que entrar a la tienda (física o digital) se sienta como entrar a una pequeña red social del negocio, no como leer una lista de precios.

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

## Hoja de ruta

Funcionalidades nuevas, después de cerrar las mejoras pendientes. Las dos primeras secciones son la dirección del producto; la tercera son ideas para que Saboria se distinga de un menú digital común.

### Comunidad
- **Fotos de los clientes.** Adjuntar fotos a las reseñas ("así llegó mi malteada"), con la misma moderación que ya tienen los comentarios. Es el contenido más creíble que puede tener un negocio.
- **Mejores reseñas de la semana.** Una sección en la home con las reseñas destacadas, elegidas por el admin o por votos de "útil".
- **Lo más pedido esta semana.** Ranking semanal. Ojo: hoy no hay pedidos en el sistema, así que hace falta una señal: un botón "Lo pedí" en el producto, las visitas a `/producto/:id`, o los clics en "Pedir por WhatsApp".
- **Novedades / nuevas recetas.** Etiqueta "Nuevo" que caduca sola a los 14 días y un apartado propio para lo recién agregado.
- **Insignias de cliente.** "Primera reseña", "Crítico frecuente", "Probó todo el menú de cafés". Gamificación ligera para que la gente vuelva a opinar.

### Redes y difusión
- **Publicación automática.** Al crear un producto o destacar una reseña, publicarlo en Instagram y Facebook (Meta Graph API, requiere cuenta profesional) y en el estado o catálogo de WhatsApp Business.
- **Pedir por WhatsApp.** Botón en cada producto que abre `wa.me` con el mensaje ya escrito ("Hola, quiero una Malteada de Fresa"). Es el cambio más barato de esta lista y el que más conversación genera.
- **Compartir un producto.** Imagen de vista previa (Open Graph) por producto para que al pegar el enlace en WhatsApp o Instagram aparezca la foto, el precio y las estrellas. Depende del punto de SEO.

### Descubrir el menú
- **Filtros.** Por categoría, rango de precio, mejor valorados y etiquetas dietéticas (sin gluten, vegano, sin azúcar, contiene frutos secos).
- **Menú según la hora.** Desayunos arriba por la mañana, cafés y postres por la tarde. Los productos pueden tener horario y "Agotado hoy" desde el panel.
- **"¿No sabes qué pedir?".** Una ruleta que elige un producto al azar dentro de los filtros activos. Funciona bien en un video y en la mesa.
- **Va bien con…** Sugerencias de combinación en cada producto (café + croissant), definidas por el admin.

### Ideas recomendadas
- **Marca blanca de verdad.** Mover nombre, logo, colores, fuentes y contacto a una configuración por negocio editable desde el admin, para levantar un negocio nuevo sin tocar código. Es lo que convierte a Saboria en un producto vendible.
- **QR por mesa.** Un QR impreso en cada mesa que abre el menú directo. Así la carta de papel lleva al menú digital en vez de competir con él.
- **Resumen de reseñas con IA.** Una línea por producto con lo que más se repite ("La gente destaca la textura cremosa; algunos la encuentran muy dulce"). Ahorra leer veinte reseñas.
- **Menú en inglés.** Selector ES/EN para turistas, con traducción asistida y revisión del admin.
- **Panel de métricas para el dueño.** Productos más vistos, valoración media por semana, reseñas sin responder. Ayuda al dueño a decidir qué mantener en la carta.
- **Tarjeta de fidelidad digital.** Sellos por visita (10 cafés = 1 gratis) validados con un código en caja, sin tarjetas de cartón.
- **PWA.** Instalable en el teléfono y con el menú disponible sin conexión.
