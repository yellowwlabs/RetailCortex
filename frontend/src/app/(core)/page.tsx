import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">RC</span>
          </div>
          <span className="font-semibold text-white tracking-tight">RetailCortex</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-800 bg-indigo-950 px-3 py-1 text-xs text-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
          CSV store onboarding for mall retail
        </div>

        <h1 className="mb-6 max-w-4xl text-5xl font-bold tracking-tight leading-tight sm:text-6xl">
          Onboard stores with CSV uploads, validate catalogs, and launch products instantly.
        </h1>

        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400">
          RetailCortex gives store owners a realistic onboarding flow: create a store, upload a CSV catalog,
          validate rows, import inventory, and expose products in the mall app.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard/store"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Open CSV uploader
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            View dashboard
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-8 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '◈', title: 'CSV validation', desc: 'Catch missing product names, duplicate IDs, invalid price, and bad stock values.' },
            { icon: '◉', title: 'Bulk import', desc: 'Create products, inventory, categories, and search data from one upload.' },
            { icon: '◎', title: 'Mall ready', desc: 'Make products available instantly inside the customer-facing mall app.' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <span className="text-indigo-400 text-xl">{f.icon}</span>
              <h3 className="text-white font-semibold mt-3 mb-1">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-800 px-8 py-5 text-center text-zinc-600 text-xs">
        © {new Date().getFullYear()} RetailCortex · Built by Yellow Labs
      </footer>
    </main>
  );
}
