export default function PrivateNotFound() {
  return (
    <div className="fixed inset-0 z-[999999] flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="mx-auto w-full max-w-xl text-center">
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          This page could not be found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page doesn’t exist or you don’t have permission to view it.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
          >
            Home
          </a>
          <a
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
