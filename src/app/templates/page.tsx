import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { TEMPLATES } from "@/lib/templates";
import { TemplateGallery } from "@/components/site/TemplateGallery";

export const metadata: Metadata = {
  title: "CV templates",
  description: `${TEMPLATES.length} free CV templates, including sixteen new Studio designs. Explore professional, creative, student, executive, technical and minimalist layouts.`,
};

export default function TemplatesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafbf8]">
      <SiteHeader />
      <main className="site-container flex-1 py-14 lg:py-20">
        <p className="eyebrow">The complete design collection</p>
        <h1 className="editorial-title mt-4 text-5xl font-medium sm:text-6xl">
          One story. So many possibilities.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500">
          {TEMPLATES.length} distinctive layouts. Sixteen new Studio designs.
          From a first internship to the next leadership role, find a style that
          gives your experience the attention it deserves. Every template
          includes a matching cover letter and is free to customise and
          download.
        </p>
        <div className="mt-10">
          <TemplateGallery filterable />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
