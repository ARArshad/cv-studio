import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { TemplateGallery } from "@/components/site/TemplateGallery";

export const metadata: Metadata = {
  title: "CV templates",
  description: "Twenty professional CV templates, premium designs included free, from one column designs that pass applicant tracking systems to bold two column layouts.",
};

export default function TemplatesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">CV templates</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">
          Pick one to start. Your content moves with you, so you can switch template, colour and fonts at any point.
        </p>
        <div className="mt-12"><TemplateGallery /></div>
      </main>
      <SiteFooter />
    </div>
  );
}
