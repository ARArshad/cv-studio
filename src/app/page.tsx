import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  FileDown,
  FileText,
  Fingerprint,
  GraduationCap,
  LayoutTemplate,
  ListChecks,
  LockKeyhole,
  MoveRight,
  Palette,
  Sparkles,
  BriefcaseBusiness,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { TemplateGallery } from "@/components/site/TemplateGallery";
import { BuilderShowcase } from "@/components/site/BuilderShowcase";
import { LetterHero } from "@/components/site/LetterHero";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { TEMPLATES } from "@/lib/templates";

const FAQ = [
  [
    "Is everything really free?",
    "Yes. Every template, the editor, matching cover letters, PDF downloads and optional local AI are free. There is no watermark or subscription. Local AI needs an optional first download of about 550 MB.",
  ],
  [
    "Can I make more than one CV?",
    "Create as many separate documents as your browser storage allows. Duplicate a CV for a new application, give it a name and tags, and tailor its content without changing the original.",
  ],
  [
    "Where is my information saved?",
    "Your documents stay in this browser profile on this device. No account is required. Back up your documents as JSON files to keep independent copies or move them to another device.",
  ],
  [
    "Can I change the template after writing?",
    "Yes. Switch templates, fonts, colours and layouts at any point. Your content stays with your document, so you can try a different presentation without starting again.",
  ],
  [
    "How does the job-description check work?",
    "Paste a job description and compare its keywords with your CV. The panel shows matches and missing terms. It is a transparent keyword comparison, not an employer’s ATS score or a guarantee of an interview.",
  ],
  [
    "Can I bring my existing CV?",
    "Import a text-based PDF, a text file or a CV Studio backup. You can also paste content. Review extracted PDF text before creating your document. Scanned PDFs need text recognition first.",
  ],
  [
    "How do I download my finished CV?",
    "Use Download PDF in the editor and choose Save as PDF in your browser’s print window. You can also download plain text or a JSON backup. Check the final pages before sending.",
  ],
  [
    "Does AI send my CV to another service?",
    "No. If you choose to load it, the open-source model runs in a browser worker on your device. Model files download from Hugging Face; your writing is not uploaded to a generation server. Always review its suggestions.",
  ],
];
const TOOLS = [
  [
    LayoutTemplate,
    "A design that fits you",
    "Switch between clean single-column, contemporary sidebar and expressive editorial layouts. Every design is included.",
  ],
  [
    Palette,
    "Your own finishing touches",
    "Fine-tune type, colour, spacing, margins, paper size and section order. See changes on the page as you make them.",
  ],
  [
    Sparkles,
    "Help finding the words",
    "Use role-specific phrases, an achievement checklist or optional free AI on your device. Your experience stays your own.",
  ],
  [
    ListChecks,
    "A more relevant application",
    "Keep a job description with each CV, check keyword overlap and build a version for the opportunity in front of you.",
  ],
  [
    Layers3,
    "A workspace for every version",
    "Manage separate CVs and matching letters with tags, search, duplicates, reusable content and recoverable deletion.",
  ],
  [
    FileDown,
    "Ready to leave an impression",
    "Export text-based PDFs without a watermark. Download plain text or keep a portable backup of your whole library.",
  ],
] as const;
export default function Home() {
  return (
    <div className="marketing-home min-h-screen bg-white">
      <SiteHeader />
      <main id="main-content">
        <section className="marketing-hero relative overflow-hidden pt-14 sm:pt-20">
          <div className="site-container relative z-10 text-center">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-full border border-[#bfd4cd] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#356354]"
            >
              <span className="hidden rounded-full bg-[#e3f1d6] px-2 py-0.5 text-[9px] uppercase tracking-wider min-[360px]:inline">
                The Edit
              </span>
              Quiet design. Lasting impression. <ArrowRight size={12} />
            </Link>
            <h1 className="marketing-title mx-auto mt-7 max-w-[1050px] text-[clamp(43px,6vw,86px)]">
              Your experience deserves
              <br className="hidden sm:block" /> an{" "}
              <span className="relative text-[#1a7860]">
                exceptional CV.
                <svg
                  viewBox="0 0 550 18"
                  aria-hidden="true"
                  className="absolute -bottom-3 left-0 h-4 w-full text-[#d9a65a]"
                >
                  <path
                    d="M4 13Q245 -5 546 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-[610px] text-base leading-7 text-[#65736f] sm:text-lg">
              Turn what you’ve done into what comes next. Build a beautifully
              considered CV, tailor every detail, and make your next move with
              confidence.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard?new=1"
                data-testid="hero-cta"
                className="marketing-button"
              >
                Create my CV <ArrowUpRight size={18} />
              </Link>
              <Link
                href="/templates"
                className="marketing-button marketing-button-light"
              >
                Explore {TEMPLATES.length} templates{" "}
                <LayoutTemplate size={17} />
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-[#64776e]">
              {["Free to create & download", "No sign-up", "No watermark"].map(
                (t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check size={13} className="text-brand-600" />
                    {t}
                  </span>
                ),
              )}
            </div>
            <div className="mx-auto mt-12 max-w-[1080px] text-left sm:mt-16">
              <BuilderShowcase />
            </div>
          </div>
          <div className="site-container relative z-10 mt-10 flex flex-wrap items-center justify-center gap-x-9 gap-y-4 pb-10 text-xs text-[#78857d]">
            <span className="font-semibold uppercase tracking-[.14em] text-[#385d4a]">
              Built around your next move
            </span>
            <span className="flex items-center gap-2">
              <BriefcaseBusiness size={15} /> Career changes
            </span>
            <span className="flex items-center gap-2">
              <GraduationCap size={16} /> First opportunities
            </span>
            <span className="flex items-center gap-2">
              <Sparkles size={15} /> Bigger ambitions
            </span>
          </div>
        </section>
        <section className="border-y border-[#e8ece6] bg-[#fbfcf9]">
          <div className="site-container grid grid-cols-2 gap-6 py-9 md:grid-cols-4">
            {[
              [String(TEMPLATES.length), "distinctive templates"],
              ["22", "flexible section types"],
              ["Every version", "a separate document"],
              ["100% yours", "private browser storage"],
            ].map(([n, t]) => (
              <div
                key={n}
                className="text-center md:border-r md:border-[#e0e7dc] md:last:border-0"
              >
                <p className="text-2xl font-semibold tracking-tight text-[#274c3d]">
                  {n}
                </p>
                <p className="mt-1 text-xs text-[#7b897e]">{t}</p>
              </div>
            ))}
          </div>
        </section>
        <section id="templates" className="site-container py-20 lg:py-28">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">A stronger first impression starts here</p>
              <h2 className="marketing-title mt-4 max-w-2xl text-4xl sm:text-5xl">
                A template for your story.
                <br />
                <span className="text-[#82938a]">
                  A style that feels like you.
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500">
                Discover The Edit: nine new simple, elegant and futuristic
                layouts. Quiet typography, considered spacing and details that
                let your experience take the lead.
              </p>
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-3 border-b border-brand-600 pb-2 text-sm font-semibold text-brand-700"
            >
              Explore all {TEMPLATES.length} designs <ArrowUpRight size={16} />
            </Link>
          </div>
          <TemplateGallery
            ids={["forma", "folio", "aurelia", "serein", "vector", "signal"]}
          />
        </section>
        <section
          id="how-it-works"
          className="bg-[#173e35] py-20 text-white lg:py-24"
        >
          <div className="site-container">
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
              <div>
                <p className="eyebrow !text-[#b8d3b0]">
                  Less formatting. More possibility.
                </p>
                <h2 className="marketing-title mt-4 max-w-xl text-4xl sm:text-5xl">
                  From a blank page
                  <br />
                  to your next chapter.
                </h2>
              </div>
              <p className="max-w-md self-end text-sm leading-7 text-[#b8cfc3]">
                The important part is your experience. We take care of the page,
                so you can focus on telling it clearly. Start fresh or bring the
                CV you already have.
              </p>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                [
                  "01",
                  "Find your direction",
                  "Choose a layout, start with a profession example or import an existing CV. Your document gets its own place in your library.",
                ],
                [
                  "02",
                  "Make every detail yours",
                  "Write directly on the page. Move sections, add achievements and experiment with typography while the layout flows around your content.",
                ],
                [
                  "03",
                  "Make your next move",
                  "Review the pages, create a matching cover letter and save a crisp PDF. Duplicate your CV when the next opportunity comes along.",
                ],
              ].map(([n, t, d]) => (
                <div key={n} className="border-t border-white/20 pt-5">
                  <span className="text-4xl font-light text-[#c7d7ae]">
                    {n}
                    <span className="ml-4 align-middle text-base text-[#739887]">
                      /
                    </span>
                  </span>
                  <h3 className="mt-6 text-xl font-semibold">{t}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#b8cfc3]">{d}</p>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard?import=1"
              className="mt-10 inline-flex items-center gap-3 text-sm font-semibold text-[#d3e5c8]"
            >
              Already have a CV? Bring it with you <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
        <section className="site-container grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="eyebrow">Make your experience count</p>
            <h2 className="marketing-title mt-4 max-w-lg text-4xl sm:text-5xl">
              The right words.
              <br />A clearer picture of you.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-500">
              A good CV goes beyond a list of responsibilities. Find a stronger
              way to describe your contribution with practical phrases, writing
              prompts and optional AI that runs on your device.
            </p>
            <ul className="mt-7 space-y-4 text-sm text-slate-600">
              {[
                "Start with an action, then explain the result",
                "Use numbers you can honestly support",
                "Keep suggestions under your control",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eaf2e7] text-brand-700">
                    <Check size={13} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/guides"
              className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-brand-700"
            >
              Explore the writing guides <ArrowRight size={16} />
            </Link>
          </div>
          <div className="relative rounded-[28px] bg-[#f5eee4] p-6 sm:p-10">
            <span className="absolute -right-1 -top-4 flex rotate-3 items-center gap-2 rounded-full border border-[#ecd4a8] bg-[#fff7e5] px-4 py-2 text-xs font-medium text-[#8c6229]">
              <Sparkles size={14} /> Let your impact shine
            </span>
            <div className="rounded-xl border border-[#e8e0d4] bg-white/70 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#9f978c]">
                A starting point
              </p>
              <p className="mt-3 text-base leading-7 text-[#8a847b]">
                Responsible for the weekly reporting process.
              </p>
            </div>
            <div className="my-4 flex items-center justify-center gap-2 text-xs text-[#9f895d]">
              <MoveRight size={16} className="rotate-90" /> Make the
              contribution clearer
            </div>
            <div className="rounded-xl border border-[#cddcce] bg-white p-6 shadow-[0_8px_24px_#8c7c5010]">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.15em] text-brand-600">
                <CheckCheck size={15} /> A more specific example
              </p>
              <p className="mt-3 text-lg font-medium leading-8 text-[#284c3c]">
                Prepared weekly reports that helped the team track project
                milestones and spot delays earlier.
              </p>
            </div>
            <p className="mt-5 text-center text-[10px] leading-5 text-[#9b8e79]">
              Fictional writing example. Describe only work you actually did.
            </p>
          </div>
        </section>
        <section className="overflow-hidden bg-[#f0edf8] py-20 lg:py-24">
          <div className="site-container grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 min-w-0 lg:order-1">
              <LetterHero />
            </div>
            <div className="order-1 lg:order-2">
              <p className="eyebrow !text-[#6e5c91]">
                One application. Beautifully together.
              </p>
              <h2 className="marketing-title mt-4 text-4xl text-[#352b49] sm:text-5xl">
                A great CV deserves
                <br />a matching introduction.
              </h2>
              <p className="mt-6 max-w-lg text-sm leading-7 text-[#82798d]">
                Carry your CV’s typography, colours and personal details into a
                matching cover letter. Use your experience as a starting point,
                then make the connection to the role.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {[
                  "Matching designs",
                  "Guided paragraphs",
                  "PDF & text export",
                ].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[#dbd2e6] bg-white/50 px-3 py-2 text-[11px] text-[#74618b]"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <Link
                href="/cover-letters"
                className="marketing-button mt-8 !bg-[#68517e]"
              >
                Explore cover letters <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </section>
        <section id="features" className="site-container py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">The details make the difference</p>
            <h2 className="marketing-title mt-4 text-4xl sm:text-5xl">
              Everything you need.
              <br />
              Room to make it your own.
            </h2>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map(([Icon, t, d], i) => (
              <div key={t} className="border-t border-slate-200 pt-6">
                <div
                  className={`grid h-11 w-11 place-items-center rounded-xl ${i % 3 === 0 ? "bg-[#eef2e6] text-[#71814e]" : i % 3 === 1 ? "bg-[#f4eae3] text-[#a27154]" : "bg-[#eeedf6] text-[#827297]"}`}
                >
                  <Icon size={21} />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {t}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="border-y border-[#e3e9e0] bg-[#f7f9f3] py-20">
          <div className="site-container grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e5eddb] text-brand-700">
                <Fingerprint size={25} />
              </span>
              <h2 className="marketing-title mt-5 text-4xl">
                Your work.
                <br />
                Your words. Your data.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
                A free builder should make your next step easier. Clear choices,
                private storage and a finished document you can actually use.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                [
                  LockKeyhole,
                  "No account required",
                  "Create immediately. Your library stays in this browser profile.",
                ],
                [
                  FileDown,
                  "Free to download",
                  "A finished PDF with no watermark and no payment screen.",
                ],
                [
                  ShieldCheck,
                  "You stay in control",
                  "Back up your library, restore deleted work and review every import.",
                ],
                [
                  Sparkles,
                  "AI without a subscription",
                  "Optional on-device writing help. A first model download is required.",
                ],
              ].map(([Icon, t, d]) => (
                <div
                  key={String(t)}
                  className="rounded-2xl border border-[#e0e7da] bg-white p-6"
                >
                  {typeof Icon !== "string" && (
                    <Icon size={20} className="text-brand-600" />
                  )}
                  <h3 className="mt-4 text-sm font-semibold">{String(t)}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {String(d)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="site-container py-20 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">A starting point for every stage</p>
              <h2 className="marketing-title mt-4 text-4xl sm:text-5xl">
                Wherever you are,
                <br />
                start from here.
              </h2>
            </div>
            <Link
              href="/examples"
              className="inline-flex items-center gap-3 text-sm font-semibold text-brand-700"
            >
              See all examples <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              [
                "graduate",
                "scholar",
                "01 / First opportunities",
                "Make potential visible",
                "Put projects, education and placements to work when your career is just beginning.",
                "#edf2e4",
              ],
              [
                "engineer",
                "developer",
                "02 / Growing expertise",
                "Show what you bring",
                "Connect your skills and achievements to the next opportunity in your field.",
                "#e8eef4",
              ],
              [
                "executive",
                "boardroom",
                "03 / Bigger responsibilities",
                "Tell the leadership story",
                "Give strategic decisions, commercial results and team achievements room to stand out.",
                "#f4eae2",
              ],
            ].map(([persona, template, k, t, d, c]) => (
              <Link
                key={persona}
                href={`/dashboard?new=1&persona=${persona}&template=${template}`}
                className="group rounded-2xl border border-slate-200 p-7 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
              >
                <div
                  style={{ background: c }}
                  className="mb-7 flex h-28 items-center justify-center rounded-xl"
                >
                  <FileText
                    size={52}
                    strokeWidth={1}
                    className="text-[#47634f]"
                  />
                </div>
                <p className="eyebrow !text-[9px]">{k}</p>
                <h3 className="mt-4 text-xl font-semibold">{t}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{d}</p>
                <ArrowUpRight className="mt-6 text-brand-700" size={20} />
              </Link>
            ))}
          </div>
        </section>
        <section
          id="faq"
          className="site-container grid gap-10 pb-20 lg:grid-cols-[1fr_1.5fr] lg:pb-28"
        >
          <div>
            <p className="eyebrow">Before your next chapter</p>
            <h2 className="marketing-title mt-4 text-4xl">
              Good questions.
              <br />
              Clear answers.
            </h2>
            <p className="mt-5 max-w-xs text-sm leading-7 text-slate-500">
              A few things to know before you put your experience on the page.
            </p>
            <Link
              href="/guides"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
            >
              More practical guidance <ArrowRight size={15} />
            </Link>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                  {q}
                  <span className="text-xl font-normal text-brand-600 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-slate-500">{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="relative overflow-hidden bg-[#183e35] py-20 text-center text-white">
          <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-20 -top-40 h-[480px] w-[480px] rounded-full border border-white/10" />
          <div className="site-container relative">
            <p className="eyebrow !text-[#bdd2ad]">
              Your next chapter is worth the effort
            </p>
            <h2 className="marketing-title mx-auto mt-5 max-w-3xl text-4xl sm:text-6xl">
              Make a first impression
              <br />
              that feels like you.
            </h2>
            <p className="mt-6 text-sm text-[#bed0c6]">
              Start with your experience. We’ll help you find its shape.
            </p>
            <Link
              href="/dashboard?new=1"
              className="marketing-button mt-8 !bg-[#d9e8b7] !text-[#254332]"
            >
              Create my CV for free <ArrowUpRight size={17} />
            </Link>
            <p className="mt-5 text-[11px] text-[#8eada0]">
              No sign-up. No subscription. Just your next step.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
