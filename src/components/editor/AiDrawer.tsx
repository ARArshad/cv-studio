"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Sparkles, Square, Trash2, Check } from "lucide-react";
import { Button, Field, inputCls } from "@/components/ui";
import {
  AI_CACHE,
  aiTargets,
  cvFacts,
  unexpectedNumbers,
  type AiResponse,
  type AiTask,
} from "@/lib/ai";
import { escapeHtml, toText } from "@/lib/rich";
import { useLibrary } from "@/lib/store";
import { useEditor } from "./context";
import { applyPath } from "./ops";

export function AiDrawer() {
  const { cv, update, lastPath } = useEditor();
  const targets = useMemo(() => aiTargets(cv), [cv]);
  const initialTarget =
    targets.find((target) => target.path === lastPath) ?? targets[0];
  const [targetPath, setTargetPath] = useState(initialTarget?.path ?? "");
  const [baseline, setBaseline] = useState(initialTarget?.value ?? "");
  const [input, setInput] = useState(toText(initialTarget?.value ?? ""));
  const [task, setTask] = useState<AiTask>(
    cv.data.letter ? "letter" : "rewrite",
  );
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "generating" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState("");
  const [cacheWarning, setCacheWarning] = useState(false);
  const [applied, setApplied] = useState(false);
  const thread = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = status === "loading" || status === "generating";
  const target = targets.find((target) => target.path === targetPath);
  const changed = !!target && target.value !== baseline;
  const extraNumbers = unexpectedNumbers(input, result);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    thread.current?.terminate();
    thread.current = null;
    setStatus("idle");
    setProgress(0);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      thread.current?.terminate();
    },
    [],
  );
  const load = () => {
    stop();
    setError("");
    setCacheWarning(false);
    setProgressText("Preparing the model…");
    setStatus("loading");
    try {
      const worker = new Worker(
        new URL("../../workers/writing.worker.ts", import.meta.url),
        { type: "module" },
      );
      thread.current = worker;
      worker.onmessage = (event: MessageEvent<AiResponse>) => {
        if (thread.current !== worker) return;
        const message = event.data;
        if (message.type === "progress") {
          setProgress(message.progress ?? 0);
          setProgressText(message.text);
        } else if (message.type === "ready") {
          if (timer.current) clearTimeout(timer.current);
          setStatus("ready");
          setProgress(1);
        } else if (message.type === "token") setResult(message.text);
        else if (message.type === "complete") {
          if (timer.current) clearTimeout(timer.current);
          setResult(message.text);
          setStatus("ready");
        } else if (message.type === "cache-warning") setCacheWarning(true);
        else if (message.type === "error") {
          stop();
          setError(
            "The local model could not finish. Your document is unchanged. Try again on a supported desktop browser, or use the built-in writing tools.",
          );
          setStatus("error");
        }
      };
      worker.onerror = (event) => {
        event.preventDefault();
        if (thread.current !== worker) return;
        stop();
        setError(
          "The browser could not start local AI. The editor and built-in writing tools still work without it.",
        );
        setStatus("error");
      };
      timer.current = setTimeout(() => {
        stop();
        setError(
          "The model took too long to load. Try again on a faster connection or continue with the built-in writing tools.",
        );
        setStatus("error");
      }, 600000);
      worker.postMessage({ type: "load" });
    } catch {
      stop();
      setError(
        "Local AI is not available in this browser. You can still use the writing phrases and optimizer.",
      );
      setStatus("error");
    }
  };
  const generate = () => {
    if (!thread.current || status !== "ready") return;
    setResult("");
    setError("");
    setApplied(false);
    setStatus("generating");
    timer.current = setTimeout(() => {
      stop();
      setError(
        "This device is taking too long to generate. Try a shorter source text or use the built-in phrases.",
      );
      setStatus("error");
    }, 180000);
    thread.current.postMessage({
      type: "generate",
      text: input.trim(),
      task,
      language,
    });
  };
  const chooseTarget = (path: string) => {
    const chosen = targets.find((item) => item.path === path);
    setTargetPath(path);
    setBaseline(chosen?.value ?? "");
    setInput(toText(chosen?.value ?? ""));
    setResult("");
    setApplied(false);
  };
  const facts = cv.data.letter?.sourceCvId
    ? useLibrary.getState().cvs[cv.data.letter.sourceCvId]
    : cv.data.letter
      ? undefined
      : cv;
  return (
    <div className="space-y-5" data-testid="ai-drawer">
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-700">
          <Sparkles className="h-4 w-4" />
          Free AI, on your device
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          No API key, subscription, or usage billing. Your text stays in this
          browser. First use downloads about 550 MB of model and runtime files;
          performance depends on your device.
        </p>
      </div>
      {status !== "ready" && status !== "generating" && !busy && (
        <Button className="w-full" onClick={load}>
          <Download className="h-4 w-4" />
          Load free AI
        </Button>
      )}
      {status === "loading" && (
        <div role="status" className="space-y-2">
          <p className="text-sm text-brand-700">{progressText}</p>
          <progress
            max={1}
            value={progress}
            aria-label="AI model download progress"
            className="h-2 w-full accent-brand-600"
          />
          <p className="text-xs text-slate-500">
            {Math.round(progress * 100)}% · This can take a few minutes the
            first time.
          </p>
        </div>
      )}
      {status === "ready" && (
        <p
          className="flex items-center gap-2 text-xs font-medium text-brand-700"
          role="status"
        >
          <Check className="h-3.5 w-3.5" />
          Model ready · runs locally
        </p>
      )}
      {cacheWarning && (
        <p className="text-xs leading-5 text-amber-700">
          Your browser could not cache all the files. Another session may need
          to download them again.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800"
        >
          {error}
        </p>
      )}
      <Field label="Text to improve">
        <select
          className={inputCls}
          value={targetPath}
          disabled={busy}
          onChange={(e) => chooseTarget(e.target.value)}
        >
          <option value="">Manual text · copy suggestion only</option>
          {targets.map((target) => (
            <option key={target.path} value={target.path}>
              {target.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="What would you like to do?">
        <select
          className={inputCls}
          value={task}
          disabled={busy}
          onChange={(e) => setTask(e.target.value as AiTask)}
        >
          <option value="rewrite">Improve the wording</option>
          <option value="shorten">Make it more concise</option>
          <option value="profile">Draft a professional profile</option>
          <option value="letter">Draft a cover-letter paragraph</option>
          <option value="translate">Translate the text</option>
        </select>
      </Field>
      {task === "translate" && (
        <Field label="Translate into">
          <select
            className={inputCls}
            value={language}
            disabled={busy}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {["English", "Spanish", "French", "German", "Arabic", "Urdu"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </Field>
      )}
      <Field label="Source text or facts">
        <textarea
          className={`${inputCls} min-h-36`}
          maxLength={6000}
          value={input}
          disabled={busy}
          placeholder="Paste the facts or existing wording. AI suggestions must be checked before use."
          onChange={(e) => {
            setInput(e.target.value);
            setApplied(false);
          }}
          data-testid="ai-source"
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        {facts && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => {
              setInput(cvFacts(facts));
              setResult("");
              setApplied(false);
            }}
          >
            Use CV experience
          </Button>
        )}
        {target && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => chooseTarget(target.path)}
          >
            Reload selected text
          </Button>
        )}
      </div>
      <Button
        variant="primary"
        className="w-full"
        disabled={status !== "ready" || input.trim().length < 5}
        onClick={generate}
        data-testid="ai-generate"
      >
        <Sparkles className="h-4 w-4" />
        Generate a suggestion
      </Button>
      {busy && (
        <Button className="w-full" onClick={stop}>
          <Square className="h-3 w-3" />
          {status === "loading" ? "Cancel download" : "Stop generating"}
        </Button>
      )}
      {result && (
        <div className="space-y-3">
          <Field label="Review and edit the suggestion">
            <textarea
              className={`${inputCls} min-h-40`}
              value={result}
              disabled={busy}
              onChange={(e) => {
                setResult(e.target.value);
                setApplied(false);
              }}
              data-testid="ai-result"
            />
          </Field>
          <p className="text-xs leading-5 text-slate-500">
            Check every fact, name, number, and qualification. Nothing is added
            to your document automatically.
          </p>
          {extraNumbers.length > 0 && (
            <p className="text-xs text-amber-700">
              These numbers were not in the source: {extraNumbers.join(", ")}.
              Remove or correct them before applying.
            </p>
          )}
          {changed && (
            <p className="text-xs text-amber-700">
              The selected field changed after you started. Reload its text or
              copy the suggestion to avoid replacing newer edits.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              disabled={
                busy ||
                !target ||
                changed ||
                !!extraNumbers.length ||
                !result.trim()
              }
              onClick={() => {
                if (!target || changed) return;
                const currentCv = useLibrary.getState().cvs[cv.id];
                const current = currentCv
                  ? aiTargets(currentCv).find(
                      (item) => item.path === target.path,
                    )
                  : undefined;
                if (current?.value !== baseline) {
                  setError(
                    "The field has changed. Reload its text before applying a suggestion.",
                  );
                  return;
                }
                update((d) =>
                  applyPath(
                    d,
                    target.path,
                    escapeHtml(result.trim()).replace(/\n/g, "<br>"),
                  ),
                );
                setBaseline(escapeHtml(result.trim()).replace(/\n/g, "<br>"));
                setApplied(true);
              }}
              data-testid="ai-apply"
            >
              Use reviewed text
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result);
                  setError("");
                } catch {
                  setError(
                    "Copy is unavailable here. Select and copy the suggestion manually.",
                  );
                }
              }}
            >
              Copy suggestion
            </Button>
          </div>
          {applied && (
            <p className="text-xs font-medium text-brand-700" role="status">
              Applied. You can undo this change in the editor.
            </p>
          )}
        </div>
      )}
      <details className="border-t border-slate-200 pt-4 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium">
          Privacy, downloads, and storage
        </summary>
        <p className="mt-3 leading-5">
          The open-source Qwen2.5-0.5B model runs in a separate browser worker.
          Model files download from Hugging Face; CV text is never sent to a
          generation server. Models are cached separately from your documents
          when the browser allows it. Closing this panel releases model memory.
        </p>
        <a
          className="mt-3 block text-brand-700 underline"
          href="https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct"
          target="_blank"
          rel="noreferrer"
        >
          Model information and Apache 2.0 licence
        </a>
        <Button
          size="sm"
          variant="ghost"
          className="mt-3"
          onClick={async () => {
            stop();
            try {
              await caches.delete(AI_CACHE);
              setError("");
              setProgressText(
                "Model files removed. Your documents are unchanged.",
              );
            } catch {
              setError(
                "Your browser did not allow the model cache to be removed.",
              );
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove downloaded model files
        </Button>
        {status === "idle" && progressText.includes("removed") && (
          <p className="mt-2">{progressText}</p>
        )}
      </details>
    </div>
  );
}
