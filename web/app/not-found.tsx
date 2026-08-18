import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] px-8 py-10 text-center">
        <h1 className="mb-1 text-6xl font-bold text-white">404</h1>
        <h2 className="text-2xl font-semibold text-white">Page Not Found</h2>
        <p className="mt-3 text-white/60">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-2xl border border-white bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
