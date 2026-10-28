"use client";
import Link from "next/link";
import { Button, Logo } from "@/components/ui";
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f7f4] p-6">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          Something interrupted this page.
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Try opening it again. If you have changes that haven’t saved in
          another editor tab, keep that tab open and download a backup.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Button variant="primary" onClick={retry}>
            Try again
          </Button>
          <Link
            className="text-sm font-semibold text-brand-700"
            href="/dashboard"
          >
            Go to my documents
          </Link>
        </div>
      </div>
    </main>
  );
}
