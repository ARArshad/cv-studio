import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafbf8]">
      <SiteHeader />
      <main className="site-container flex-1 py-24 lg:py-32">
        <p className="eyebrow">404 / A small detour</p>
        <h1 className="editorial-title mt-5 max-w-2xl text-5xl font-medium sm:text-6xl">
          Let’s get you back
          <br />
          to your next chapter.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-500">
          This page isn’t available. You can continue with your documents or
          find a fresh template.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center gap-4 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            My documents
          </Link>
          <Link
            href="/templates"
            className="inline-flex h-12 items-center gap-4 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium"
          >
            Browse templates
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
