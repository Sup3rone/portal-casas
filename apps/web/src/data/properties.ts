export type FakeProperty = {
  id: string;
  slug: string;
  image: string;
  titles: { es: string; en: string; fr: string };
  city: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
};

export const fakeProperties: FakeProperty[] = [
  {
    id: "1",
    slug: "casa-playa-caribe",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
    titles: {
      es: "Casa frente al mar en Cartagena",
      en: "Beachfront house in Cartagena",
      fr: "Maison en front de mer à Carthagène"
    },
    city: "Cartagena",
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3
  },
  {
    id: "2",
    slug: "apartamento-centro-historico",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    titles: {
      es: "Apartamento en centro histórico",
      en: "Apartment in the historic center",
      fr: "Appartement dans le centre historique"
    },
    city: "Medellín",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2
  },
  {
    id: "3",
    slug: "finca-montana",
    image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800",
    titles: {
      es: "Finca con vista a la montaña",
      en: "Country house with mountain view",
      fr: "Maison de campagne vue montagne"
    },
    city: "Guatapé",
    maxGuests: 10,
    bedrooms: 5,
    bathrooms: 4
  }
];
