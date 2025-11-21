// services/providers-service/prisma/seed.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Structură: Categorii → Subcategorii → Tag-uri
const catalog = [
  {
    slug: 'music-entertainment',
    name: 'Muzică & Entertainment',
    description:
      'Formații live, DJ, artiști și divertisment pentru nunți, botezuri și evenimente corporate.',
    sortOrder: 10,
    subcategories: [
      {
        slug: 'live-band',
        name: 'Formație live',
        description: 'Trupe live pentru nunți, botezuri, petreceri private și corporate.',
        tags: [
          { slug: 'band-nunta', label: 'Nuntă' },
          { slug: 'band-botez', label: 'Botez' },
          { slug: 'band-corporate', label: 'Corporate' },
          { slug: 'band-lounge', label: 'Lounge / café-concert' },
          { slug: 'band-pop-rock', label: 'Pop / Rock' },
          { slug: 'band-populara', label: 'Muzică populară' },
          { slug: 'band-format-mic', label: 'Duo / Trio' },
          { slug: 'band-format-mare', label: 'Band complet' },
        ],
      },
      {
        slug: 'dj',
        name: 'DJ',
        description: 'DJ pentru petreceri și evenimente.',
        tags: [
          { slug: 'dj-nunta', label: 'DJ nuntă' },
          { slug: 'dj-botez', label: 'DJ botez' },
          { slug: 'dj-corporate', label: 'DJ corporate' },
          { slug: 'dj-club', label: 'DJ club / party' },
          { slug: 'dj-cu-instalatie', label: 'Include sonorizare' },
          { slug: 'dj-fara-instalatie', label: 'Doar DJ (fără echipament)' },
        ],
      },
      {
        slug: 'instrumentalists',
        name: 'Instrumentiști',
        description: 'Saxofon, vioară, pian, taraf, instrumente solo sau în grup.',
        tags: [
          { slug: 'saxofon', label: 'Saxofon' },
          { slug: 'vioara', label: 'Vioară' },
          { slug: 'pian', label: 'Pian / clape' },
          { slug: 'cvartet-strings', label: 'Cvartet de coarde' },
          { slug: 'taraf-popular', label: 'Taraf popular' },
          { slug: 'live-ceremonie', label: 'Ceremonie religioasă' },
          { slug: 'live-cocktail', label: 'Cocktail / recepție' },
        ],
      },
      {
        slug: 'mc-host',
        name: 'MC / Host',
        description: 'Maestru de ceremonii, prezentatori, entertainer-i.',
        tags: [
          { slug: 'mc-nunta', label: 'MC nuntă' },
          { slug: 'mc-corporate', label: 'MC corporate' },
          { slug: 'mc-bilingv', label: 'MC bilingv' },
          { slug: 'mc-comic', label: 'Stil comic / interactiv' },
        ],
      },
      {
        slug: 'artists-special',
        name: 'Artiști speciali',
        description: 'Momente speciale: dansatori, artiști de foc, magie etc.',
        tags: [
          { slug: 'dansatori-profesionisti', label: 'Dansatori profesioniști' },
          { slug: 'moment-dans-mirilor', label: 'Moment dansul mirilor' },
          { slug: 'foc-arteziene', label: 'Foc de artificii / artificii de interior' },
          { slug: 'magician', label: 'Magician' },
          { slug: 'caricaturist', label: 'Caricaturist' },
        ],
      },
    ],
  },

  {
    slug: 'photo-video',
    name: 'Foto & Video',
    description: 'Fotografi, videografi și servicii conexe pentru evenimente.',
    sortOrder: 20,
    subcategories: [
      {
        slug: 'photographer-wedding',
        name: 'Fotograf nuntă',
        description: 'Fotografie profesională pentru nunți și evenimente private.',
        tags: [
          { slug: 'foto-full-day', label: 'Full day (toată ziua)' },
          { slug: 'foto-sedinta-save-the-date', label: 'Ședință Save the Date' },
          { slug: 'foto-sedinta-trash-the-dress', label: 'Trash the Dress' },
          { slug: 'foto-album-fizic', label: 'Album foto tipărit' },
          { slug: 'foto-fotografie-de-noapte', label: 'Fotografie de noapte' },
        ],
      },
      {
        slug: 'videographer-wedding',
        name: 'Videograf',
        description: 'Filmări și montaj video pentru evenimente.',
        tags: [
          { slug: 'video-full-hd', label: 'Filmare Full HD' },
          { slug: 'video-4k', label: 'Filmare 4K' },
          { slug: 'video-teaser', label: 'Teaser video' },
          { slug: 'video-highlight', label: 'Highlight / rezumat' },
          { slug: 'video-interviuri-invitati', label: 'Interviuri invitați' },
        ],
      },
      {
        slug: 'photo-booth',
        name: 'Cabină foto',
        description: 'Cabine foto, photo booth, 360 booth.',
        tags: [
          { slug: 'cabina-classic', label: 'Cabină foto clasică' },
          { slug: 'cabina-oglinda', label: 'Oglindă foto' },
          { slug: 'cabina-360', label: '360 video booth' },
          { slug: 'cabina-print-foto', label: 'Print instant' },
          { slug: 'cabina-props', label: 'Accesorii / props incluse' },
        ],
      },
      {
        slug: 'drone',
        name: 'Drone & cadre aeriene',
        description: 'Cadre aeriene cu dronă pentru foto-video.',
        tags: [
          { slug: 'drone-nunta', label: 'Cadre aeriene nuntă' },
          { slug: 'drone-corporate', label: 'Cadre aeriene corporate' },
          { slug: 'drone-certificat', label: 'Pilot certificat' },
        ],
      },
    ],
  },

  {
    slug: 'venues-catering',
    name: 'Locații & Catering',
    description:
      'Săli de evenimente, locații outdoor, corturi, catering mobil și servicii conexe.',
    sortOrder: 30,
    subcategories: [
      {
        slug: 'venue-restaurant',
        name: 'Restaurant / Ballroom',
        description: 'Săli de restaurant, ballroom-uri, saloane de evenimente.',
        tags: [
          { slug: 'capacitate-0-100', label: 'Până la 100 persoane' },
          { slug: 'capacitate-100-200', label: '100–200 persoane' },
          { slug: 'capacitate-200-plus', label: 'Peste 200 persoane' },
          { slug: 'locatie-cu-terasa', label: 'Cu terasă' },
          { slug: 'locatie-aer-conditionat', label: 'Aer condiționat' },
          { slug: 'locatie-parcare', label: 'Parcare proprie' },
        ],
      },
      {
        slug: 'venue-tent',
        name: 'Cort evenimente',
        description: 'Corturi pentru nunți, botezuri și evenimente corporate.',
        tags: [
          { slug: 'cort-cu-podea', label: 'Cort cu podea' },
          { slug: 'cort-cu-climatizare', label: 'Cort cu climatizare' },
          { slug: 'cort-panorama', label: 'Pereți transparenți / panoramici' },
        ],
      },
      {
        slug: 'venue-outdoor',
        name: 'Locație în aer liber',
        description: 'Grădini, terase, locații tip domeniu / conac.',
        tags: [
          { slug: 'outdoor-ceremonie', label: 'Ceremonie în aer liber' },
          { slug: 'outdoor-tent-optional', label: 'Posibilitate montare cort' },
          { slug: 'outdoor-lake-view', label: 'Lângă lac / râu' },
        ],
      },
      {
        slug: 'catering',
        name: 'Catering',
        description: 'Catering complet pentru evenimente.',
        tags: [
          { slug: 'catering-bufet-sued', label: 'Bufet suedez' },
          { slug: 'catering-servire-la-masa', label: 'Servire la masă' },
          { slug: 'catering-fine-dining', label: 'Fine dining' },
          { slug: 'catering-traditional', label: 'Meniu tradițional' },
          { slug: 'catering-vegetarian', label: 'Opțiuni vegetariene / vegane' },
        ],
      },
    ],
  },

  {
    slug: 'decor-design',
    name: 'Decor & Design',
    description: 'Decor sală, aranjamente florale, lumânări, candy bar etc.',
    sortOrder: 40,
    subcategories: [
      {
        slug: 'decor-sala',
        name: 'Decor sală & scenă',
        description: 'Decor complet de sală, scenă, intrări, photo corner.',
        tags: [
          { slug: 'decor-clasic', label: 'Decor clasic / elegant' },
          { slug: 'decor-rustic', label: 'Rustic / boho' },
          { slug: 'decor-minimalist', label: 'Minimalist' },
          { slug: 'decor-tematic', label: 'Tematic (ex: retro, vintage)' },
        ],
      },
      {
        slug: 'floral-arrangements',
        name: 'Aranjamente florale',
        description: 'Buchete, aranjamente de masă, arcade, decor biserică.',
        tags: [
          { slug: 'flori-nunta', label: 'Nuntă' },
          { slug: 'flori-botez', label: 'Botez' },
          { slug: 'flori-biserica', label: 'Decor biserică' },
          { slug: 'flori-buchet-mireasa', label: 'Buchet mireasă' },
          { slug: 'flori-buchet-nasa', label: 'Buchet nașă' },
        ],
      },
      {
        slug: 'candy-bar',
        name: 'Candy bar / desert table',
        description: 'Candy bar, desert bar, sweet corner.',
        tags: [
          { slug: 'candy-bar-clasic', label: 'Candy bar clasic' },
          { slug: 'candy-bar-tematic', label: 'Candy bar tematic' },
          { slug: 'candy-bar-cu-fructe', label: 'Include fructe / fântână ciocolată' },
        ],
      },
      {
        slug: 'church-candles',
        name: 'Lumânări & biserică',
        description: 'Lumânări, aranjamente și decor pentru biserică.',
        tags: [
          { slug: 'lumanari-simple', label: 'Lumânări simple' },
          { slug: 'lumanari-decorate', label: 'Lumânări decorate' },
          { slug: 'set-complet-biserica', label: 'Set complet biserică' },
        ],
      },
    ],
  },

  {
    slug: 'planning-coordination',
    name: 'Organizare & Coordonare',
    description: 'Wedding planner, coordonatori de eveniment și consultanți.',
    sortOrder: 50,
    subcategories: [
      {
        slug: 'wedding-planner-full',
        name: 'Wedding planner (full service)',
        description: 'Organizare completă de la A la Z.',
        tags: [
          { slug: 'planner-full', label: 'Full planning' },
          { slug: 'planner-destination', label: 'Nuntă de destinație' },
          { slug: 'planner-corporate', label: 'Planner evenimente corporate' },
        ],
      },
      {
        slug: 'day-of-coordinator',
        name: 'Coordonator de zi',
        description: 'Coordonare doar în ziua evenimentului.',
        tags: [
          { slug: 'coordonare-ziua-nuntii', label: 'Coordonare ziua nunții' },
          { slug: 'coordonare-botez', label: 'Coordonare botez' },
        ],
      },
      {
        slug: 'consultant',
        name: 'Consultant eveniment',
        description: 'Consultanță punctuală (buget, furnizori, logistică).',
        tags: [
          { slug: 'consultanta-buget', label: 'Consultanță buget' },
          { slug: 'consultanta-furnizori', label: 'Consultanță furnizori' },
        ],
      },
    ],
  },

  {
    slug: 'technical-services',
    name: 'Servicii tehnice',
    description: 'Sonorizare, lumini, scenă, ecrane LED și infrastructură tehnică.',
    sortOrder: 60,
    subcategories: [
      {
        slug: 'audio-sound',
        name: 'Sonorizare',
        description: 'Sisteme de sunet pentru evenimente mici și mari.',
        tags: [
          { slug: 'sunet-mica-intindere', label: 'Evenimente mici (până la 100 pers.)' },
          { slug: 'sunet-medie-intindere', label: 'Evenimente medii' },
          { slug: 'sunet-mare-intindere', label: 'Evenimente mari / outdoor' },
          { slug: 'sound-engineer-inclus', label: 'Inginer de sunet inclus' },
        ],
      },
      {
        slug: 'lights',
        name: 'Lumini scenă & atmosferă',
        description: 'Lumini de scenă, moving heads, ambient, architectural.',
        tags: [
          { slug: 'lumini-scena', label: 'Lumini scenă' },
          { slug: 'lumini-ambientale', label: 'Lumini ambientale' },
          { slug: 'lumini-architecturale', label: 'Lumini arhitecturale' },
          { slug: 'lumini-cu-operator', label: 'Cu operator dedicat' },
        ],
      },
      {
        slug: 'stage-truss',
        name: 'Scenă & truss',
        description: 'Structuri de scenă, poduri de lumini, rigging.',
        tags: [
          { slug: 'scena-mobila', label: 'Scenă mobilă' },
          { slug: 'truss-patrat', label: 'Truss pătrat / portal' },
          { slug: 'scena-outdoor', label: 'Scenă outdoor' },
        ],
      },
      {
        slug: 'led-screens',
        name: 'Ecrane LED & proiecție',
        description: 'Ecrane LED, proiecție video, plasme.',
        tags: [
          { slug: 'led-wall', label: 'LED wall' },
          { slug: 'proiector', label: 'Proiector & ecran' },
          { slug: 'plasme-laterale', label: 'Plasme laterale' },
        ],
      },
    ],
  },

  {
    slug: 'extra-services',
    name: 'Servicii suplimentare',
    description: 'Transport, copii, candy bar, fum greu etc.',
    sortOrder: 70,
    subcategories: [
      {
        slug: 'kids-entertainment',
        name: 'Entertainment copii',
        description: 'Animatori, jocuri, corner copii.',
        tags: [
          { slug: 'animatori-costumati', label: 'Animatori costumați' },
          { slug: 'kids-corner', label: 'Kids corner' },
          { slug: 'face-painting', label: 'Face painting' },
        ],
      },
      {
        slug: 'transport',
        name: 'Transport & logistică',
        description: 'Transport invitați, limuzine, shuttle.',
        tags: [
          { slug: 'limuzina', label: 'Limuzină' },
          { slug: 'transport-invitati', label: 'Transport invitați' },
          { slug: 'microbuz', label: 'Microbuz / autocar' },
        ],
      },
      {
        slug: 'special-effects',
        name: 'Efecte speciale',
        description: 'Fum greu, confetti, artificii.',
        tags: [
          { slug: 'fum-greu', label: 'Fum greu' },
          { slug: 'confetti', label: 'Confetti' },
          { slug: 'artificii-recuzita', label: 'Artificii recuzită / indoor' },
        ],
      },
    ],
  },
];

async function main() {
  console.log('Se pornește seed-ul pentru catalogul de provideri...');

  for (const cat of catalog) {
    const category = await prisma.providerCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder ?? 0,
        isActive: true,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder ?? 0,
        isActive: true,
      },
    });

    console.log(`→ Category: ${category.name}`);

    for (const sub of cat.subcategories || []) {
      const subcategory = await prisma.providerSubcategory.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          description: sub.description,
          sortOrder: sub.sortOrder ?? 0,
          isActive: true,
          categoryId: category.id,
        },
        create: {
          slug: sub.slug,
          name: sub.name,
          description: sub.description,
          sortOrder: sub.sortOrder ?? 0,
          isActive: true,
          categoryId: category.id,
        },
      });

      console.log(`   → Subcategory: ${subcategory.name}`);

      for (const tag of sub.tags || []) {
        const createdTag = await prisma.providerTag.upsert({
          where: { slug: tag.slug },
          update: {
            label: tag.label,
            isActive: true,
            subcategoryId: subcategory.id,
          },
          create: {
            slug: tag.slug,
            label: tag.label,
            isActive: true,
            subcategoryId: subcategory.id,
          },
        });

        console.log(`      → Tag: ${createdTag.label}`);
      }
    }
  }

  console.log('✅ Seed catalog provideri finalizat.');
}

main()
  .catch((e) => {
    console.error('❌ Eroare la seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
