import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/ui";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
      <div className="site-container flex h-20 items-center gap-4">
        <Logo />
        <nav
          aria-label="Main navigation"
          className="ml-4 hidden items-center gap-6 text-sm font-medium text-slate-600 xl:flex"
        >
          <Link href="/templates" className="hover:text-brand-700">
            Templates
          </Link>
          <Link href="/cover-letters" className="hover:text-brand-700">
            Cover letters
          </Link>
          <Link href="/examples" className="hover:text-brand-700">
            Examples
          </Link>
          <Link href="/guides" className="hover:text-brand-700">
            Guides
          </Link>
        </nav>
        <div className="ml-auto flex flex-none items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-700 hover:text-brand-700"
          >
            <span className="sm:hidden">My files</span>
            <span className="hidden sm:inline">My documents</span>
          </Link>
          <Link
            href="/dashboard?new=1"
            className="hidden h-11 items-center gap-4 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 sm:inline-flex"
          >
            Get started free <ArrowUpRight className="h-4 w-4" />
          </Link>
          <details className="relative xl:hidden">
            <summary className="cursor-pointer list-none rounded-lg border border-slate-200 px-3 py-2 text-sm">
              Menu
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute right-0 top-12 grid w-52 gap-1 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-xl"
            >
              <Link
                className="rounded-lg p-3 hover:bg-brand-50"
                href="/templates"
              >
                Browse templates
              </Link>
              <Link
                className="rounded-lg p-3 hover:bg-brand-50"
                href="/#how-it-works"
              >
                How it works
              </Link>
              <Link
                className="rounded-lg p-3 hover:bg-brand-50"
                href="/dashboard?new=1"
              >
                Create a CV
              </Link>
              <Link
                className="rounded-lg p-3 hover:bg-brand-50"
                href="/cover-letters"
              >
                Cover letters
              </Link>
              <Link
                className="rounded-lg p-3 hover:bg-brand-50"
                href="/examples"
              >
                CV examples
              </Link>
              <Link className="rounded-lg p-3 hover:bg-brand-50" href="/guides">
                Writing guides
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#f7f8f5]">
      <div className="site-container grid gap-8 py-12 text-sm text-slate-500 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm leading-relaxed">
            A little more confidence for your next chapter. Create a CV that
            tells your story.
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="grid content-start gap-3"
        >
          <span className="mb-1 font-semibold text-ink">Explore</span>
          <Link href="/templates">CV templates</Link>
          <Link href="/dashboard">Your workspace</Link>
          <Link href="/cover-letters">Cover letter builder</Link>
          <Link href="/examples">CV examples</Link>
          <Link href="/guides">Writing guides</Link>
          <Link href="/#faq">Common questions</Link>
        </nav>
        <div>
          <p className="font-semibold text-ink">Your work. Your data.</p>
          <p className="mt-3 leading-relaxed">
            CVs are saved on this browser. Export a backup to keep them safe or
            move devices.
          </p>
        </div>
      </div>
      <div className="site-container flex flex-wrap justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} CV Studio</p>
        <p>Free to create. Free to download. Always yours.</p>
      </div>
    </footer>
  );
}
