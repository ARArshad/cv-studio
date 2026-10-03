import Link from "next/link";
import {
  ArrowRight, FileDown, Gauge, LayoutTemplate, ListChecks, Lock, MousePointerClick, Palette, Sparkles,
} from "lucide-react";
import { HeroStack, TemplateGallery } from "@/components/site/TemplateGallery";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

const FEATURES = [
  { icon: MousePointerClick, title: "Live preview as you type", text: "Every change shows on the page at once, laid out on real A4 or Letter sheets, so what you see is what you send." },
  { icon: LayoutTemplate, title: "Ten professional templates", text: "From quiet one column layouts that pass applicant tracking systems to bold two column designs. Switch any time without retyping." },
  { icon: Palette, title: "Make it yours", text: "Pick any colour, pair heading and body fonts, set text size, spacing, margins, photo shape and how skill levels look." },
  { icon: Sparkles, title: "Ready made phrases", text: "Stuck on what to write? Drop in strong, specific bullet points for your kind of work and fill in your own numbers." },
  { icon: ListChecks, title: "A score with reasons", text: "Checks for the things recruiters look for: contact details, a focused profile, detail in every job, and a sensible length." },
  { icon: FileDown, title: "Clean PDF, no watermark", text: "Download a crisp, selectable text PDF that keeps every colour. No paywall on your own CV." },
];

const FAQ = [
  { q: "Is it really free?", a: "Yes. Writing, editing, every template and the PDF download are free, with no watermark." },
  { q: "Where is my CV stored?", a: "In your own browser on this device. Nothing is uploaded to a server. Use “Download a copy” to keep a backup or move your CV to another computer." },
  { q: "Will my CV get through applicant tracking systems?", a: "The PDF is real text, not an image, so systems can read it. For the strictest systems, choose a one column template such as Meridian, Chronicle, Harbor or Linen." },
  { q: "Should I include a photo?", a: "It depends where you apply. Photos are common in much of Europe and Asia, but usually left off in the UK, US, Canada and Australia. You can hide the photo in Design with one click." },
  { q: "How long should a CV be?", a: "One page for early career, two for most experienced people. The page counter and the CV score tell you when you are running long." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      <main className="flex-1">
        {/* hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#dce7ff_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,#eef4ff_0%,transparent_50%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
                <Lock className="h-3.5 w-3.5" /> Free, private, no sign up
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[56px]">
                A professional CV,<br />ready in minutes.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                Fill in your details, watch your CV take shape on the page, and download a polished PDF. Ten templates designed for real recruiters, with a score that tells you what to fix.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/dashboard?new=1" className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand-600 px-6 text-[15px] font-medium text-white shadow-sm hover:bg-brand-700" data-testid="hero-cta">
                  Create my CV <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/templates" className="inline-flex h-12 items-center rounded-lg border border-slate-200 bg-white px-6 text-[15px] font-medium text-ink hover:bg-slate-50">
                  Browse templates
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-1.5"><Gauge className="h-4 w-4 text-brand-600" /> Live preview</li>
                <li className="flex items-center gap-1.5"><FileDown className="h-4 w-4 text-brand-600" /> PDF without watermark</li>
                <li className="flex items-center gap-1.5"><LayoutTemplate className="h-4 w-4 text-brand-600" /> 10 templates</li>
              </ul>
            </div>
            <HeroStack />
          </div>
        </section>

        {/* how it works */}
        <section className="border-y border-slate-100 bg-slate-50/60">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
            {[
              ["1", "Choose a template", "Start from a worked example or a blank page. You can change template whenever you like."],
              ["2", "Fill in your details", "Short guided forms for each section, with ready made phrases when you need a start."],
              ["3", "Download and apply", "Check your score, adjust the design, and download a print ready PDF."],
            ].map(([n, t, d]) => (
              <div key={n} className="flex gap-4">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-600 font-semibold text-white">{n}</span>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* templates */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" id="templates">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Templates that look the part</h2>
              <p className="mt-2 max-w-2xl text-slate-600">Each one is built to print beautifully and read clearly, in any colour you choose.</p>
            </div>
            <Link href="/templates" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
              See all templates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <TemplateGallery limit={5} />
        </section>

        {/* features */}
        <section className="bg-slate-900 text-white" id="features">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Everything you need to write a strong CV</h2>
            <p className="mt-2 max-w-2xl text-slate-300">No account, no subscription, no surprise paywall at the download button.</p>
            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title}>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-brand-200"><f.icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-slate-300">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* faq */}
        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6" id="faq">
          <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span className="text-xl text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* call to action */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-3xl bg-brand-600 px-6 py-14 text-center text-white shadow-xl sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight">Your next job starts with a better CV</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">Start from a worked example and make it yours. It is free and takes a few minutes.</p>
            <Link href="/dashboard?new=1" className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-[15px] font-semibold text-brand-700 hover:bg-brand-50">
              Create my CV <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
