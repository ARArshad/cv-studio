import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { ExamplesGallery } from "@/components/site/ExamplesGallery";
export const metadata: Metadata = {
  title: "CV examples by profession",
  description:
    "Explore worked CV examples for software, marketing, design, healthcare, leadership, and graduates. Use an example as a guide for your own experience.",
};
export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-[#fafbf8]">
      <SiteHeader />
      <main className="site-container py-16 lg:py-20">
        <p className="eyebrow">A helpful place to start</p>
        <h1 className="editorial-title mt-4 max-w-3xl text-5xl font-medium sm:text-6xl">
          A little inspiration.
          <br />A story that’s all yours.
        </h1>
        <p className="mb-12 mt-6 max-w-2xl text-base leading-7 text-slate-500">
          Explore examples for six career paths. These are fictional profiles
          for learning and inspiration. Keep only the structure and ideas that
          honestly fit your own experience.
        </p>
        <ExamplesGallery />
      </main>
      <SiteFooter />
    </div>
  );
}
