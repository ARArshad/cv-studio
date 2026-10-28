import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { GUIDES } from "@/lib/guides";
export const metadata: Metadata = {
  title: "CV and cover letter writing guides",
  description:
    "Practical guides for writing achievements, tailoring applications, choosing a layout, creating a cover letter, and backing up your documents.",
};
export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-[#fafbf8]">
      <SiteHeader />
      <main className="site-container py-16 lg:py-20">
        <p className="eyebrow">Practical help for your next chapter</p>
        <h1 className="editorial-title mt-4 max-w-3xl text-5xl font-medium sm:text-6xl">
          Good writing starts
          <br />
          with a little direction.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-500">
          Clear, practical guidance for the decisions you make while building an
          application. Read a guide, then put it into practice in your
          workspace.
        </p>
        <nav aria-label="Guide topics" className="my-10 flex flex-wrap gap-2">
          {GUIDES.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-brand-500"
            >
              {g.label}
            </a>
          ))}
        </nav>
        <div className="grid gap-6 lg:grid-cols-2">
          {GUIDES.map((g) => (
            <article
              id={g.id}
              key={g.id}
              className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
            >
              <BookOpen className="h-5 w-5 text-brand-600" />
              <p className="eyebrow mt-5">{g.label}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                {g.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{g.intro}</p>
              <ol className="mt-6 space-y-4">
                {g.steps.map((step, i) => (
                  <li
                    key={step}
                    className="flex gap-3 text-sm leading-6 text-slate-600"
                  >
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">
                      {i + 1}
                    </span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
        <Link
          href="/dashboard?new=1"
          className="mt-10 inline-flex h-12 items-center gap-6 rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Put it into practice <ArrowUpRight className="h-4 w-4" />
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
