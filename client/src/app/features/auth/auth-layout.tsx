import Image from "next/image";
import Link from "next/link";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-muted">
      <div className="mx-auto grid min-h-svh max-w-6xl grid-cols-1 items-stretch gap-8 px-6 py-12 md:grid-cols-2">
        {/* Left / Brand */}
        <section className="hidden md:flex flex-col justify-center rounded-2xl bg-slate-900 p-10 text-slate-100 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
              <Image src="/logo.png" alt="LCS" width={22} height={22} />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-semibold tracking-tight">LCS Inventory</p>
              <p className="text-sm text-slate-300">Laboratory Management System</p>
            </div>
          </div>

          <h1 className="mt-8 text-3xl font-bold leading-tight">
            Secure access to your lab’s operations
          </h1>
          <p className="mt-4 text-slate-300">
            Inventory, purchasing, suppliers, and analytics—one workspace.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                ✓
              </span>
              Enterprise-grade authentication (OAuth + email)
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                ✓
              </span>
              Role-ready (admins, clerks, lab staff)
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                ✓
              </span>
              Audit-friendly workflows
            </li>
          </ul>
        </section>

        {/* Right / Card */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-6 flex items-center justify-center gap-2">
              <Image src="/logo.png" alt="LCS" width={32} height={32} />
              <span className="text-base font-semibold">LCS Inventory</span>
            </Link>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

