import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { LetterHero } from "@/components/site/LetterHero";
import { TEMPLATES } from "@/lib/templates";
import { TemplateGallery } from "@/components/site/TemplateGallery";
export const metadata: Metadata = {
  title: "Cover letter builder",
  description:
    "Create a cover letter that matches your CV. Edit on the page, use a guided outline, and export a PDF. Private, free, and saved in your browser.",
};
export default function CoverLettersPage() {
  return (
    <div className="min-h-screen bg-[#fafbf8]">
      <SiteHeader />
      <main>
        <section className="border-b border-slate-200 bg-[#edf2e7] py-16 lg:py-24">
          <div className="site-container grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <p className="eyebrow">
                A complete application, beautifully consistent
              </p>
              <h1 className="editorial-title mt-5 max-w-3xl text-4xl font-medium sm:text-5xl lg:text-[56px]">
                Your CV tells the story.
                <br />
                <span className="text-brand-600">
                  Your letter makes the connection.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-500">
                Match your CV’s colours, fonts, and header. Explain why this
                role matters, support it with your experience, and make every
                application feel considered.
              </p>
              <Link
                href="/dashboard?new=1&kind=letter"
                className="mt-8 inline-flex h-12 items-center gap-6 rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Create a cover letter <ArrowUpRight className="h-4 w-4" />
              </Link>
              <div className="mt-6 flex flex-wrap gap-5 text-xs text-brand-700">
                {[
                  `${TEMPLATES.length} matching designs`,
                  "Guided writing outline",
                  "Free PDF export",
                  "Private browser storage",
                ].map((text) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    {text}
                  </span>
                ))}
              </div>
            </div>
            <LetterHero />
          </div>
        </section>
        <section className="site-container py-16">
          <div className="mb-10">
            <p className="eyebrow">One style. One strong first impression.</p>
            <h2 className="editorial-title mt-4 text-4xl font-medium">
              Choose your cover letter template.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
              Already have a CV? Choose “Matching cover letter” from its
              dashboard menu to carry over your personal details and design.
              Every word remains editable.
            </p>
          </div>
          <TemplateGallery kind="letter" filterable />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
