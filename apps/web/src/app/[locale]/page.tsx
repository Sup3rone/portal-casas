export default function HomePage() {
  return (
    <main>
      <section className="relative h-[500px] bg-gradient-to-br from-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-7xl px-4 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-5xl font-extrabold text-white mb-6">
            Encuentra tu próxima estancia
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mb-8">
            Casas verificadas, listas para ti. Experiencias únicas en los mejores destinos.
          </p>
          <a
            href="/es/casas"
            className="rounded-full bg-white px-8 py-4 text-lg font-bold text-purple-700 transition-all hover:scale-105 hover:shadow-lg"
          >
            Explorar Propiedades
          </a>
        </div>
      </section>
    </main>
  );
}
