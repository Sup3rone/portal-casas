import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  // limpiar en orden (respetando foreign keys)
  await prisma.booking.deleteMany();
  await prisma.message.deleteMany();
  await prisma.media.deleteMany();
  await prisma.icalFeed.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // primero el usuario admin
  const admin = await prisma.user.create({
    data: { email: 'admin@portal.com', name: 'Admin' }
  });

  // después las casas, conectadas al admin
  await prisma.property.createMany({
    data: [
      {
        slug: 'casa-playa-caribe',
        titleEs: 'Casa frente al mar en Cartagena',
        titleEn: 'Beachfront house in Cartagena',
        titleFr: 'Maison en front de mer à Carthagène',
        descEs: 'Casa amplia con terraza y acceso directo a la playa.',
        descEn: 'Spacious house with terrace and direct beach access.',
        descFr: 'Maison spacieuse avec terrasse et accès direct à la plage.',
        address: 'Bocagrande',
        city: 'Cartagena',
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        published: true,
        ownerId: admin.id
      },
      {
        slug: 'apartamento-centro-historico',
        titleEs: 'Apartamento en centro histórico',
        titleEn: 'Apartment in the historic center',
        titleFr: 'Appartement dans le centre historique',
        descEs: 'Coqueto apartamento reformado a pasos de todo.',
        descEn: 'Cozy renovated apartment steps from everything.',
        descFr: 'Appartement rénové cozy, à deux pas de tout.',
        address: 'El Poblado',
        city: 'Medellín',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        published: true,
        ownerId: admin.id
      }
    ]
  });

  console.log('✅ Seed completo: admin + 2 propiedades');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
