/**
 * Seed de Saboria: admin único, categorías, productos y textos del sitio.
 *
 * Ejecutar con: npm run db:seed
 */
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client';

const url = new URL(process.env.DATABASE_URL ?? '');
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: url.hostname || '127.0.0.1',
    port: parseInt(url.port || '3306', 10),
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: 5,
  }),
});

const ADMIN_EMAIL = 'admin@saboria.do';
const ADMIN_PASSWORD = 'Saboria2026!';

const CATEGORIES = [
  { name: 'Malteadas', emoji: '🥤', note: 'Batidas al momento', sortOrder: 0 },
  { name: 'Wraps', emoji: '🌯', note: 'Recetas de la casa', sortOrder: 1 },
  { name: 'Jugos naturales', emoji: '🧃', note: 'Fruta fresca', sortOrder: 2 },
  { name: 'Cafés', emoji: '☕', note: 'Grano de especialidad', sortOrder: 3 },
  { name: 'Panadería', emoji: '🥐', note: 'Horneado diario', sortOrder: 4 },
  { name: 'Pasteles', emoji: '🍰', note: 'Porcionados o completos', sortOrder: 5 },
  { name: 'Helados', emoji: '🍦', note: 'Artesanales', sortOrder: 6 },
  { name: 'Desayunos', emoji: '🧇', note: 'Todo el día', sortOrder: 7 },
  { name: 'Postres', emoji: '🧁', note: 'Detalles dulces', sortOrder: 8 },
];

const PRODUCTS = [
  {
    name: 'Malteada de Fresa',
    tag: 'Malteadas',
    description:
      'Fresas frescas, leche cremosa y nuestro toque especial batido al momento.',
    price: 250,
    emoji: '🥤',
    image: 'malteadaFresa.png',
    c1: '#ffe3ec', c2: '#ff8fb3', c3: '#ff4d84', accent: '#e8467c',
    category: 'Malteadas',
  },
  {
    name: 'Wrap de Pollo',
    tag: 'Wraps',
    description:
      'Pollo a la parrilla, vegetales crujientes y aderezo de la casa en tortilla suave.',
    price: 320,
    emoji: '🌯',
    image: 'wrapPollo.png',
    c1: '#eaf9d8', c2: '#93d76a', c3: '#4fb63c', accent: '#3f9c2c',
    category: 'Wraps',
  },
  {
    name: 'Jugo de Mango',
    tag: 'Jugos naturales',
    description:
      'Mango maduro exprimido al momento, bien frío y sin azúcar añadida.',
    price: 180,
    emoji: '🧃',
    image: 'jugoMango.png',
    c1: '#fff1c9', c2: '#ffab3d', c3: '#ff7a12', accent: '#ea6a06',
    category: 'Jugos naturales',
  },
  {
    name: 'Croissant de Chocolate',
    tag: 'Panadería',
    description:
      'Hojaldre artesanal, dorado y hojaldrado, relleno de chocolate belga.',
    price: 150,
    emoji: '🥐',
    image: 'croissant.png',
    c1: '#f8e9cd', c2: '#e2b067', c3: '#c98a3c', accent: '#a9702a',
    category: 'Panadería',
  },
  {
    name: 'Pastel de Chocolate',
    tag: 'Pasteles',
    description:
      'Capas de bizcocho húmedo con crema de cacao y un toque de fresa fresca.',
    price: 280,
    emoji: '🍰',
    image: 'pastelChocolate.png',
    c1: '#f0d5c6', c2: '#c98a68', c3: '#96583c', accent: '#7c452c',
    category: 'Pasteles',
  },
  {
    name: 'Helado Artesanal',
    tag: 'Helados',
    description:
      'Tres bolitas de helado cremoso con salsa y topping a tu elección.',
    price: 220,
    emoji: '🍦',
    image: 'helado.png',
    c1: '#dcfafa', c2: '#6fd9d6', c3: '#1fb9b6', accent: '#0e9a97',
    category: 'Helados',
  },
  {
    name: 'Café de Especialidad',
    tag: 'Cafés',
    description:
      'Grano seleccionado, tostado medio y preparado en espresso con crema perfecta.',
    price: 160,
    emoji: '☕',
    image: 'cafe.png',
    c1: '#f2e2cd', c2: '#c99a70', c3: '#96663f', accent: '#7a4e2c',
    category: 'Cafés',
  },
  {
    name: 'Cupcake de Vainilla',
    tag: 'Postres',
    description:
      'Bizcocho suave de vainilla con frosting decorado y confites de colores.',
    price: 140,
    emoji: '🧁',
    image: 'postre.png',
    c1: '#f2e7ff', c2: '#bb96f5', c3: '#8b5cf6', accent: '#7c3aed',
    category: 'Postres',
  },
  {
    name: 'Pastel de Fresa',
    tag: 'Pasteles',
    description:
      'Bizcocho ligero con crema fresca y fresas de temporada en cada capa.',
    price: 290,
    emoji: '🍓',
    image: 'pastelFresa.png',
    c1: '#ffe0ea', c2: '#ff87ab', c3: '#ff3d75', accent: '#f2356b',
    category: 'Pasteles',
  },
  {
    name: 'Waffles con Miel',
    tag: 'Desayunos',
    description:
      'Waffles dorados y crujientes con miel de abejas, fruta y un toque de mantequilla.',
    price: 260,
    emoji: '🧇',
    image: 'waffles.png',
    c1: '#fff5c9', c2: '#ffd45c', c3: '#ffb31f', accent: '#e0980a',
    category: 'Desayunos',
  },
];

const SETTINGS = {
  id: 1,
  footerDescription:
    'Comida y bebida hecha con ingredientes frescos, servida con cariño. Un lugar para explorar antojos.',
  scheduleWeek: 'Lun – Vie: 7:00 AM – 9:00 PM',
  scheduleSaturday: 'Sábado: 8:00 AM – 10:00 PM',
  scheduleSunday: 'Domingo: 8:00 AM – 6:00 PM',
  address: 'Av. Principal 123, Santo Domingo',
  phone: '+1 (809) 555-5555',
  email: 'hola@saboria.do',
  menuBadge: 'Nuestro menú',
  menuTitle: 'Toca una tarjeta y miralo en el hero',
  menuText:
    'Cada producto tiene su propio color y ambiente. Toca cualquiera para verlo animado arriba.',
  catalogBadge: 'Nuestro catálogo',
  catalogTitle: 'Todo lo que encontrarás en Saboria',
  catalogText:
    'Desde malteadas y jugos naturales hasta panadería recién horneada. Elige tu antojo y déjate sorprender.',
  ctaTitle: '¿Se te antojó algo?',
  ctaText:
    'Pide para llevar o reserva tu mesa. Preparamos todo al momento para que llegue fresco.',
};

async function main() {
  console.log('🌱 Sembrando Saboria...');

  // ------------------------------------------------------------- admin
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { isActive: true, role: 'admin', emailVerified: true },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      fullName: 'Administrador Saboria',
      role: 'admin',
      emailVerified: true,
    },
  });
  console.log(`👤 Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  // -------------------------------------------------------- categorías
  const categoryMap = new Map<string, number>();
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { name: c.name },
      update: { emoji: c.emoji, note: c.note, sortOrder: c.sortOrder },
      create: c,
    });
    categoryMap.set(c.name, row.id);
  }
  console.log(`🗂️  ${CATEGORIES.length} categorías`);

  // --------------------------------------------------------- productos
  let order = 0;
  for (const p of PRODUCTS) {
    const { image, category, ...rest } = p;
    // imageUrl guardado como nombre de archivo (ej. malteadaFresa.png): el
    // frontend lo resuelve desde sus assets. Las imágenes subidas por el admin
    // quedan como /uploads/....
    const existing = await prisma.product.findFirst({
      where: { name: p.name },
      select: { id: true },
    });
    await prisma.product.upsert({
      where: { id: existing?.id ?? -1 },
      update: {
        ...rest,
        imageUrl: image,
        categoryId: categoryMap.get(category) ?? null,
        sortOrder: order,
      },
      create: {
        ...rest,
        emoji: p.emoji,
        imageUrl: image,
        categoryId: categoryMap.get(category) ?? null,
        sortOrder: order,
      },
    });
    order += 1;
  }
  console.log(`🍽️  ${PRODUCTS.length} productos`);

  // ------------------------------------------------------------ textos
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: SETTINGS,
    create: SETTINGS,
  });
  console.log('📝 Textos del sitio');

  console.log('✅ Listo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
