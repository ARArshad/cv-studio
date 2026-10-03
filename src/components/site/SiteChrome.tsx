import Link from "next/link";
import { Logo } from "@/components/ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <Link href="/templates" className="hover:text-ink">Templates</Link>
          <Link href="/#features" className="hover:text-ink">Features</Link>
          <Link href="/#faq" className="hover:text-ink">Questions</Link>
        </nav>
        <span className="flex-1" />
        <Link href="/dashboard" className="hidden text-sm font-medium text-slate-700 hover:text-ink sm:inline">My CVs</Link>
        <Link href="/dashboard?new=1" className="inline-flex h-9.5 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
          Create my CV
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm">Professional CVs with a live preview and clean PDF export. Your CVs stay in your browser.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/templates" className="hover:text-ink">Templates</Link>
          <Link href="/dashboard" className="hover:text-ink">My CVs</Link>
          <Link href="/#faq" className="hover:text-ink">Questions</Link>
        </nav>
        <p>© {new Date().getFullYear()} CV Studio</p>
      </div>
    </footer>
  );
}
