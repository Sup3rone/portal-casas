export default function PageLoading({ variant }: { variant: 'home' | 'list' | 'detail' }) {
  return (
    <main className="page-loading relative min-h-screen bg-background" aria-busy="true">
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        {variant === 'list' ? (
          <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-16">
            <div className="mb-12 h-10 w-40 rounded-full bg-green-100" />
            <div className="grid w-full grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="glass-panel rounded-2xl p-6 shadow-xl">
                  <div className="aspect-[4/3] rounded-lg bg-gray-200" />
                  <div className="mt-6 h-5 w-3/4 rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-gray-200" />
                  <div className="mt-6 h-10 rounded-lg bg-green-100" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <section className={`relative flex h-screen flex-col items-center px-4 text-center bg-gray-200 ${
              variant === 'home' ? 'min-h-[600px] justify-center' : 'pt-24'
            }`}>
              <div className="h-10 w-3/4 max-w-xl rounded-lg bg-gray-300" />
              <div className="mt-4 h-6 w-1/2 max-w-md rounded-lg bg-gray-300" />
              {variant === 'home' && (
                <div className="glass-panel mt-12 flex flex-wrap justify-center gap-4 rounded-2xl p-6 shadow-2xl">
                  {[0, 1, 2].map(i => <div key={i} className="h-16 w-40 rounded-lg bg-gray-200" />)}
                  <div className="h-16 w-32 rounded-lg bg-green-100" />
                </div>
              )}
            </section>
            {variant === 'detail' && (
              <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-16 lg:grid-cols-2">
                {[0, 1].map(i => (
                  <div key={i} className="glass-panel rounded-2xl p-6 shadow-xl">
                    <div className="mb-6 h-4 w-1/3 rounded bg-gray-200" />
                    <div className="h-64 rounded-lg bg-gray-200" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
