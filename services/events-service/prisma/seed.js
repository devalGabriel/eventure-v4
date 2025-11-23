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
