// Development seed for Ridmo. Idempotent: upserts by slug, safe to re-run.
//
//   pnpm db:seed
//
// Images are sample photos from Cloudinary's public `demo` cloud, picked
// deterministically per product (3-4 distinct pictures each, 3:4 ratio).
// Prices are in PYG (guaranies), the base currency of the storefront.
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL ?? '';
const isLocal = /@?(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
if (!isLocal && process.env.SEED_ALLOW_REMOTE !== '1') {
  console.error(
    'Refusing to seed a non-local database. Point DATABASE_URL to localhost, ' +
      'or set SEED_ALLOW_REMOTE=1 if you really mean it.'
  );
  process.exit(1);
}

const prisma = new PrismaClient();

// Pool of public sample photos from Cloudinary's `demo` cloud (verified reachable).
// Cropped on the fly by Cloudinary: 3:4 for products, 16:9 for collection banners.
const POOL = [
  'cld-sample.jpg',
  'cld-sample-2.jpg',
  'cld-sample-3.jpg',
  'cld-sample-4.jpg',
  'cld-sample-5.jpg',
  'samples/ecommerce/analog-classic.jpg',
  'samples/ecommerce/accessories-bag.jpg',
  'samples/ecommerce/leather-bag-gray.jpg',
  'samples/people/smiling-man.jpg',
  'samples/landscapes/beach-boat.jpg',
  'samples/food/spices.jpg',
];
const cld = (publicId, transform) =>
  `https://res.cloudinary.com/demo/image/upload/${transform}/${publicId}`;

// Small deterministic hash so a given slug always gets the same pictures.
const hash = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

// `count` distinct pool photos per product (no repeats inside one product).
const images = (seed, count) => {
  const start = hash(seed) % POOL.length;
  return Array.from({ length: count }, (_, i) =>
    cld(POOL[(start + i * 3) % POOL.length], 'c_fill,ar_3:4,g_auto,w_900')
  );
};
const banner = (slug) => cld(POOL[hash(slug) % POOL.length], 'c_fill,ar_16:9,g_auto,w_1920');

const catalog = [
  {
    name: 'Relojes',
    slug: 'relojes',
    description: 'Piezas de relojería con presencia atemporal.',
    items: [
      ['Reloj Meridian Negro', 'reloj-meridian-negro', 6_800_000, 8_200_000, 4, ['reloj', 'acero', 'negro']],
      ['Reloj Aurum Clásico', 'reloj-aurum-clasico', 9_500_000, null, 3, ['reloj', 'dorado', 'cuero']],
      ['Reloj Noir Automático', 'reloj-noir-automatico', 12_400_000, 14_000_000, 3, ['reloj', 'automático']],
      ['Reloj Argent Minimal', 'reloj-argent-minimal', 5_200_000, null, 4, ['reloj', 'minimal', 'plata']],
    ],
  },
  {
    name: 'Cadenas',
    slug: 'cadenas',
    description: 'Cadenas de eslabones sólidos, hechas para destacar.',
    items: [
      ['Cadena Milán 60 cm', 'cadena-milan-60', 3_900_000, null, 3, ['cadena', 'oro', 'eslabón']],
      ['Cadena Corda Plata', 'cadena-corda-plata', 2_700_000, 3_200_000, 4, ['cadena', 'plata']],
      ['Cadena Rolo Gruesa', 'cadena-rolo-gruesa', 4_600_000, null, 3, ['cadena', 'rolo']],
      ['Cadena Singapur Fina', 'cadena-singapur-fina', 2_100_000, null, 3, ['cadena', 'fina']],
    ],
  },
  {
    name: 'Pulseras Cubanas',
    slug: 'pulseras-cubanas',
    description: 'Eslabón cubano clásico, macizo y pulido a mano.',
    items: [
      ['Pulsera Cubana 8 mm', 'pulsera-cubana-8mm', 3_400_000, null, 4, ['pulsera', 'cubana', 'oro']],
      ['Pulsera Cubana 12 mm', 'pulsera-cubana-12mm', 5_800_000, 6_500_000, 3, ['pulsera', 'cubana', 'gruesa']],
      ['Pulsera Cubana Plata', 'pulsera-cubana-plata', 2_900_000, null, 3, ['pulsera', 'cubana', 'plata']],
      ['Pulsera Cubana Diamantada', 'pulsera-cubana-diamantada', 4_300_000, null, 4, ['pulsera', 'cubana', 'diamantada']],
    ],
  },
  {
    name: 'Collares',
    slug: 'collares',
    description: 'Colgantes y collares de diseño sobrio.',
    items: [
      ['Collar Eclipse', 'collar-eclipse', 3_100_000, null, 3, ['collar', 'colgante']],
      ['Collar Lumière', 'collar-lumiere', 3_700_000, 4_200_000, 4, ['collar', 'perla']],
      ['Collar Obsidiana', 'collar-obsidiana', 2_600_000, null, 3, ['collar', 'negro']],
      ['Collar Vértice', 'collar-vertice', 4_100_000, null, 3, ['collar', 'geométrico']],
    ],
  },
  {
    name: 'Lentes',
    slug: 'lentes',
    description: 'Lentes de diseñador, líneas limpias y protección total.',
    items: [
      ['Lentes Sable Negro', 'lentes-sable-negro', 2_300_000, null, 4, ['lentes', 'negro', 'acetato']],
      ['Lentes Aviador Dorado', 'lentes-aviador-dorado', 2_900_000, 3_400_000, 3, ['lentes', 'aviador']],
      ['Lentes Wayfarer Mate', 'lentes-wayfarer-mate', 2_100_000, null, 3, ['lentes', 'wayfarer']],
      ['Lentes Redondos Carey', 'lentes-redondos-carey', 2_500_000, null, 4, ['lentes', 'redondo', 'carey']],
    ],
  },
];

async function main() {
  for (const c of catalog) {
    // Collections feed the wide hero banner, hence 16:9 instead of the 3:4 product ratio.
    const collectionData = {
      name: c.name,
      description: c.description,
      imageUrl: banner(c.slug),
      isActive: true,
    };
    const collection = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: collectionData,
      create: { slug: c.slug, ...collectionData },
    });

    for (const [name, slug, price, comparePrice, imageCount, tags] of c.items) {
      const data = {
        name,
        description: `${name}. Acabado premium, pieza de edición limitada.`,
        price,
        comparePrice,
        sku: slug.toUpperCase(),
        inventory: 10,
        isActive: true,
        images: images(slug, imageCount),
        tags,
        collectionId: collection.id,
      };
      await prisma.item.upsert({ where: { slug }, update: data, create: { slug, ...data } });
    }
    console.log(`✓ ${c.name}: ${c.items.length} products`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
