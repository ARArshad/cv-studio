"use client";

import { useSearchParams } from "next/navigation";
import { Editor } from "@/components/editor/Editor";

export function EditorFromQuery() {
  const id = useSearchParams().get("id") ?? "";
  return <Editor key={id} id={id} />;
}
