import type { Metadata } from "next";
import { Suspense } from "react";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = { title: "My documents" };

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="grid min-h-screen place-items-center bg-[#f6f7f4] text-sm text-slate-500"
        >
          Opening your workspace…
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
