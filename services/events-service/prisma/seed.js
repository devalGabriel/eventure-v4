// services/events-service/prisma/seed.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = [
    {
      type: 'wedding',
      name: 'default',
      description: 'Timeline standard pentru nuntă',
      taskJson: [
        { title: 'Stabilește bugetul', daysBefore: 180 },
        { title: 'Rezervă locația pentru petrecere', daysBefore: 150 },
        { title: 'Rezervă biserica', daysBefore: 150 },
        { title: 'Alege formatia / DJ', daysBefore: 120 },
        { title: 'Trimite invitațiile', daysBefore: 60 },
        { title: 'Confirmă numărul de invitați', daysBefore: 14 },
        { title: 'Confirmă meniul cu restaurantul', daysBefore: 7 },
      ],
      briefJson: {
        intro: 'Acesta este brief-ul standard pentru o nuntă.',
        tips: [
          'Completează numărul aproximativ de invitați.',
          'Notează stilul dorit: clasic, modern, boho, etc.',
          'Menționează dacă ceremonia și petrecerea sunt în aceeași locație.'
        ]
      },
      budgetJson: {
        basePerGuest: 250, // recomandare /invitat
        currency: 'RON',
        categories: [
          { key: 'venue', label: 'Locație / Restaurant', percent: 40 },
          { key: 'food', label: 'Meniu & băuturi', percent: 25 },
          { key: 'music', label: 'Muzică & Entertainment', percent: 15 },
          { key: 'photo_video', label: 'Foto / Video', percent: 10 },
          { key: 'decor', label: 'Decor & flori', percent: 10 }
        ]
      }
    },
    {
      type: 'baptism',
      name: 'default',
      description: 'Timeline standard pentru botez',
      taskJson: [
        { title: 'Stabilește data și biserica', daysBefore: 60 },
        { title: 'Rezervă restaurantul', daysBefore: 60 },
        { title: 'Alege nașii', daysBefore: 45 },
        { title: 'Trimite invitațiile', daysBefore: 30 },
      ],
      briefJson: {
        intro: 'Brief standard pentru botez.',
        tips: [
          'Completează numărul estimativ de invitați.',
          'Menționează locația bisericii și locația petrecerii.',
          'Notează intervalul orar preferat.'
        ]
      },
      budgetJson: {
        basePerGuest: 150,
        currency: 'RON',
        categories: [
          { key: 'venue', label: 'Locație', percent: 45 },
          { key: 'food', label: 'Meniu & băuturi', percent: 30 },
          { key: 'photo_video', label: 'Foto / Video', percent: 10 },
          { key: 'decor', label: 'Decor', percent: 15 }
        ]
      }
    },
    {
      type: 'corporate',
      name: 'default',
      description: 'Timeline standard pentru eveniment corporate',
      taskJson: [
        { title: 'Definește obiectivele evenimentului', daysBefore: 90 },
        { title: 'Stabilește buget și locație', daysBefore: 75 },
        { title: 'Alege furnizorii principali', daysBefore: 60 },
        { title: 'Trimite invitațiile', daysBefore: 30 },
      ],
      briefJson: {
        intro: 'Brief pentru evenimente corporate.',
        tips: [
          'Notează obiectivul evenimentului (teambuilding, conferință, lansare etc.).',
          'Menționează profilul participanților.',
          'Scrie așteptările legate de atmosferă și format.'
        ]
      },
      budgetJson: {
        basePerGuest: 300,
        currency: 'RON',
        categories: [
          { key: 'venue', label: 'Locație', percent: 35 },
          { key: 'tech', label: 'Tehnic (sunet, lumini)', percent: 20 },
          { key: 'food', label: 'Meniu & băuturi', percent: 25 },
          { key: 'entertainment', label: 'Entertainment', percent: 10 },
          { key: 'other', label: 'Altele', percent: 10 }
        ]
      }
    },
  ];

  for (const tpl of templates) {
    await prisma.eventTypeTemplate.upsert({
      where: { type_name: { type: tpl.type, name: tpl.name } },
      update: {
        description: tpl.description,
        taskJson: tpl.taskJson,
      },
      create: tpl,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
