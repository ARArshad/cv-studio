import {
  AI_MODEL,
  AI_REVISION,
  AI_CACHE,
  aiInstruction,
  type AiRequest,
  type AiResponse,
} from "@/lib/ai";
import type { TextGenerationPipeline } from "@huggingface/transformers";

let generator: TextGenerationPipeline | null = null;
let loading: Promise<TextGenerationPipeline> | null = null;
let busy = false;
const post = (message: AiResponse) => self.postMessage(message);
async function loadModel() {
  if (generator) return generator;
  if (!loading)
    loading = (async () => {
      const { env, pipeline } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      env.useBrowserCache = false;
      if (env.backends.onnx.wasm) {
        env.backends.onnx.wasm.numThreads = 1;
        env.backends.onnx.wasm.proxy = false;
      }
      try {
        const cache = await caches.open(AI_CACHE);
        env.useCustomCache = true;
        env.customCache = {
          match: (request: string) => cache.match(request),
          put: async (request: string, response: Response) => {
            try {
              await cache.put(request, response);
            } catch {
              post({ type: "cache-warning" });
            }
          },
        };
      } catch {
        env.useCustomCache = false;
        post({ type: "cache-warning" });
      }
      const model = await pipeline("text-generation", AI_MODEL, {
        revision: AI_REVISION,
        dtype: "q8",
        device: "wasm",
        progress_callback: (value: unknown) => {
          const progress = value as {
            status?: string;
            file?: string;
            progress?: number;
          };
          if (
            progress.status === "progress" &&
            progress.file?.endsWith(".onnx")
          )
            post({
              type: "progress",
              progress: Math.max(
                0,
                Math.min(1, (progress.progress ?? 0) / 100),
              ),
              text: "Downloading the AI model…",
            });
          else if (
            progress.status === "done" &&
            progress.file?.endsWith(".onnx")
          )
            post({
              type: "progress",
              progress: 1,
              text: "Preparing the model on your device…",
            });
        },
      });
      generator = model;
      return model;
    })().catch((error) => {
      loading = null;
      throw error;
    });
  return loading;
}
self.onmessage = async (event: MessageEvent<AiRequest>) => {
  if (busy) return;
  busy = true;
  try {
    const request = event.data;
    if (request.type === "load") {
      post({
        type: "progress",
        text: "Preparing the optional model download…",
        progress: 0,
      });
      await loadModel();
      post({ type: "ready" });
    } else if (request.type === "generate") {
      if (
        typeof request.text !== "string" ||
        request.text.trim().length < 5 ||
        request.text.length > 6000
      )
        throw new Error(
          "Please enter between 5 and 6,000 characters to work with.",
        );
      const model = await loadModel();
      const { TextStreamer } = await import("@huggingface/transformers");
      let text = "";
      const streamer = new TextStreamer(model.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (token) => {
          text += token;
          post({ type: "token", text });
        },
      });
      await model(
        [
          {
            role: "system",
            content:
              "You edit resumes. Follow the writing task and output only the finished text. Keep the original facts and numbers. Do not ask questions or add explanations.",
          },
          ...(request.task === "rewrite" || request.task === "shorten"
            ? [
                {
                  role: "user",
                  content:
                    "Rewrite this resume sentence with an active verb. Output only the rewritten sentence.\nText: Responsible for helping 5 customers each day.",
                },
                { role: "assistant", content: "Assisted 5 customers daily." },
                {
                  role: "user",
                  content:
                    "Rewrite this resume sentence with an active verb. Output only the rewritten sentence.\nText: Responsible for preparing monthly dashboards used by 8 managers.",
                },
                {
                  role: "assistant",
                  content: "Prepared monthly dashboards used by 8 managers.",
                },
              ]
            : []),
          {
            role: "user",
            content: `${aiInstruction(request.task, request.language)}\nText: ${request.text}\n\nOutput only the finished text:`,
          },
        ],
        {
          max_new_tokens: 192,
          do_sample: false,
          return_full_text: false,
          streamer,
          repetition_penalty: 1.1,
        },
      );
      if (!text.trim())
        throw new Error(
          "The model did not produce a suggestion. Try a shorter, more specific source text.",
        );
      post({ type: "complete", text: text.trim() });
    }
  } catch (error) {
    post({
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "The local AI could not run on this device.",
    });
  } finally {
    busy = false;
  }
};
