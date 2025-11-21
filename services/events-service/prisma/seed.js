import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const templates = [
    {
      type: 'wedding',
      name: 'Wedding default',
      taskJson: [
        { title: 'Select venue', offsetDays: -180 },
        { title: 'Book band/DJ', offsetDays: -150 },
        { title: 'Send invitations', offsetDays: -90 },
        { title: 'Confirm menu', offsetDays: -30 }
      ]
    },
    {
      type: 'baptism',
      name: 'Baptism default',
      taskJson: [
        { title: 'Book church', offsetDays: -60 },
        { title: 'Choose restaurant', offsetDays: -45 },
        { title: 'Invitations', offsetDays: -30 }
      ]
    },
    {
      type: 'corporate',
      name: 'Corporate default',
      taskJson: [
        { title: 'Define agenda', offsetDays: -60 },
        { title: 'Book venue', offsetDays: -45 },
        { title: 'Catering', offsetDays: -30 }
      ]
    }
  ];

  for (const t of templates) {
    await prisma.eventTypeTemplate.upsert({
      where: { type_name: { type: t.type, name: t.name } },
      update: { taskJson: t.taskJson },
      create: t
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
