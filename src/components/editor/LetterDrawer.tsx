"use client";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Button, Field, IconButton, inputCls } from "@/components/ui";
import { checkLetter, draftLetter } from "@/lib/letters";
import { toText } from "@/lib/rich";
import { uid } from "@/lib/sample";
import { useLibrary } from "@/lib/store";
import { useEditor } from "./context";
import { Seg, Slider, Toggle } from "./Popover";
import type { CoverLetter } from "@/lib/types";

export function LetterDrawer({ review = false }: { review?: boolean }) {
  const { cv, update } = useEditor();
  const letter = cv.data.letter;
  if (!letter) return null;
  const fields: [keyof CoverLetter, string, string][] = [
    ["recipient", "Recipient", "Hiring manager's name"],
    ["company", "Company", "Company name"],
    ["address", "Company address", "Optional"],
    ["date", "Date", "Date of application"],
    ["subject", "Subject", "Application for [job title]"],
    ["salutation", "Greeting", "Dear Hiring Manager,"],
    ["closing", "Closing", "Kind regards,"],
    ["signature", "Signature", "Your full name"],
  ];
  if (review)
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-500">
          Review the letter against the job description, check every fact, and
          replace all prompts before sending.
        </p>
        {checkLetter(cv).map((check) => (
          <div key={check.title} className="flex items-center gap-2 text-sm">
            {check.ok ? (
              <CheckCircle2 className="h-4 w-4 text-brand-600" />
            ) : (
              <Circle className="h-4 w-4 text-amber-500" />
            )}
            {check.title}
          </div>
        ))}
      </div>
    );
  return (
    <div className="space-y-5" data-testid="letter-drawer">
      <p className="text-xs leading-5 text-slate-500">
        Write here or directly on the letter. Each paragraph flows onto the next
        page when needed.
      </p>
      {fields.map(([key, label, placeholder]) => (
        <Field key={key} label={label}>
          <input
            className={inputCls}
            placeholder={placeholder}
            value={String(letter[key] ?? "")}
            onChange={(e) =>
              update((d) => {
                (d.data.letter as unknown as Record<string, string>)[key] =
                  e.target.value;
              }, `letter:${key}`)
            }
          />
        </Field>
      ))}
      <div className="rounded-xl bg-brand-50 p-4">
        <p className="text-sm font-semibold">Need a starting point?</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          Create an outline using the role, company, and achievements from the
          linked CV. This uses writing templates on your device. Review and
          personalise every sentence.
        </p>
        <Button
          size="sm"
          className="mt-3"
          onClick={() => {
            if (
              letter.paragraphs.some((p) => p.text.trim()) &&
              !confirm(
                "Replace the current paragraphs with a starting outline? You can undo this change.",
              )
            )
              return;
            const source = letter.sourceCvId
              ? useLibrary.getState().cvs[letter.sourceCvId]
              : undefined;
            update((d) => {
              if (d.data.letter)
                d.data.letter.paragraphs = draftLetter(cv, source);
            });
          }}
        >
          Create a starting outline
        </Button>
      </div>
      {letter.paragraphs.map((p, i) => (
        <div key={p.id}>
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor={`paragraph-${p.id}`}
              className="text-xs font-medium text-slate-600"
            >
              Paragraph {i + 1}
            </label>
            <IconButton
              label={`Remove paragraph ${i + 1}`}
              onClick={() =>
                update((d) => {
                  if (d.data.letter)
                    d.data.letter.paragraphs = d.data.letter.paragraphs.filter(
                      (item) => item.id !== p.id,
                    );
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </IconButton>
          </div>
          <textarea
            id={`paragraph-${p.id}`}
            className={`${inputCls} min-h-28`}
            value={toText(p.text.replace(/<br\s*\/?>/gi, "\n"))}
            onChange={(e) =>
              update((d) => {
                const item = d.data.letter?.paragraphs.find(
                  (item) => item.id === p.id,
                );
                if (item)
                  item.text = e.target.value
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\n/g, "<br>");
              }, `letterp:${p.id}`)
            }
          />
        </div>
      ))}
      <Button
        onClick={() =>
          update((d) => {
            d.data.letter?.paragraphs.push({ id: uid("p_"), text: "" });
          })
        }
      >
        <Plus className="h-4 w-4" />
        Add a paragraph
      </Button>
    </div>
  );
}

export function LetterPagePanel() {
  const { cv, update } = useEditor();
  return (
    <div className="space-y-5">
      <Field label="Paper size">
        <Seg
          value={cv.design.pageSize}
          options={[
            { v: "A4", label: "A4" },
            { v: "Letter", label: "US Letter" },
          ]}
          onChange={(value) =>
            update((d) => {
              d.design.pageSize = value;
            })
          }
        />
      </Field>
      <Slider
        label="Page margins"
        value={cv.design.margin}
        min={24}
        max={72}
        step={2}
        format={(value) => `${value}px`}
        onChange={(value) =>
          update((d) => {
            d.design.margin = value;
          })
        }
      />
      <Toggle
        label="Page numbers"
        checked={cv.design.pageNumbers}
        onChange={(value) =>
          update((d) => {
            d.design.pageNumbers = value;
          })
        }
      />
    </div>
  );
}
