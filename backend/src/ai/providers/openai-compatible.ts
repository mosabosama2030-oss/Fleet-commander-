import { LlmError } from '../contracts.ts';
import type {
  FinishReason,
  LlmProvider,
  LlmErrorCode,
  LlmRequest,
  ProviderResult,
} from '../contracts.ts';

export type ProviderFetch = typeof globalThis.fetch;

export interface OpenAICompatibleProviderOptions {
  readonly id: string;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly model: string;
  readonly supportsJson: boolean;
  readonly maxContextTokens: number;
  readonly fetcher?: ProviderFetch;
}

/** Only the four reviewed provider origins are permitted; arbitrary URLs are rejected. */
const ALLOWED_BASE_URLS = new Set([
  'https://openrouter.ai/api/v1',
  'https://generativelanguage.googleapis.com/v1beta/openai',
  'https://api.mistral.ai/v1',
  'https://integrate.api.nvidia.com/v1',
]);

const MAX_PROVIDER_RESPONSE_BYTES = 1_000_000;

async function readBoundedJson(response: Response, signal: AbortSignal): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new LlmError('INVALID_OUTPUT', 'Provider response body is empty');

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_PROVIDER_RESPONSE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The size limit remains authoritative even if cancellation fails.
        }
        throw new LlmError('INVALID_OUTPUT', 'Provider response exceeds the size limit');
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (signal.aborted || isAbortError(error)) {
      throw new LlmError('TIMEOUT', 'Provider response read timed out');
    }
    throw new LlmError('PROVIDER_UNAVAILABLE', 'Provider response could not be read');
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Releasing a completed reader is best-effort.
    }
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let source: string;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new LlmError('INVALID_OUTPUT', 'Provider response is not valid UTF-8');
  }
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new LlmError('INVALID_OUTPUT', 'Provider returned invalid JSON');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finishReason(value: unknown): FinishReason | null {
  if (typeof value !== 'string') return null;
  switch (value.trim().toLowerCase()) {
    case 'stop':
      return 'stop';
    case 'length':
    case 'max_tokens':
      return 'length';
    case 'content_filter':
    case 'safety':
      return 'content_filter';
    default:
      return null;
  }
}

function messageText(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return null;

  const parts: string[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.text !== 'string') continue;
    if (item.type === undefined || item.type === 'text' || item.type === 'output_text') {
      parts.push(item.text);
    }
  }
  return parts.length > 0 ? parts.join('') : null;
}

function tokenCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function errorCodeForStatus(status: number): LlmErrorCode {
  if (status === 401 || status === 403) return 'AUTH_FAILED';
  if (status === 408 || status === 504) return 'TIMEOUT';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'PROVIDER_UNAVAILABLE';
  if (status >= 400) return 'BAD_REQUEST';
  return 'PROVIDER_UNAVAILABLE';
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError';
}

/**
 * A small, dependency-free Chat Completions adapter.
 * Secrets and response bodies are deliberately excluded from all thrown errors.
 */
export function createOpenAICompatibleProvider(
  options: OpenAICompatibleProviderOptions,
): LlmProvider {
  const apiKey = options.apiKey.trim();
  if (!apiKey || /[\r\n]/.test(apiKey)) {
    throw new TypeError('A valid provider API key is required');
  }
  if (!ALLOWED_BASE_URLS.has(options.baseUrl)) {
    throw new TypeError('Provider base URL is not in the allowlist');
  }
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/i.test(options.id)) {
    throw new TypeError('Provider id is invalid');
  }
  if (!options.model.trim()) {
    throw new TypeError('Provider model is required');
  }
  if (!Number.isSafeInteger(options.maxContextTokens) || options.maxContextTokens < 1) {
    throw new TypeError('Provider context limit is invalid');
  }

  const fetcher = options.fetcher ?? globalThis.fetch;
  const capabilities = Object.freeze({
    json: options.supportsJson,
    maxContextTokens: options.maxContextTokens,
  });
  const endpoint = options.baseUrl + '/chat/completions';

  return Object.freeze({
    id: options.id,
    capabilities,

    async complete(
      req: Pick<LlmRequest, 'messages' | 'maxOutputTokens' | 'responseFormat'>,
      signal: AbortSignal,
    ): Promise<ProviderResult> {
      if (signal.aborted) {
        throw new LlmError('TIMEOUT', 'Provider request was cancelled');
      }
      if (req.responseFormat === 'json' && !capabilities.json) {
        throw new LlmError('BAD_REQUEST', 'Provider does not support JSON mode');
      }

      const requestBody: Record<string, unknown> = {
        model: options.model,
        messages: req.messages,
        max_tokens: req.maxOutputTokens,
        stream: false,
      };
      if (req.responseFormat === 'json') {
        // JSON mode only. The Gateway and consumer still validate the actual schema.
        requestBody.response_format = { type: 'json_object' };
      }

      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal,
          redirect: 'error',
        });
      } catch (error) {
        if (signal.aborted || isAbortError(error)) {
          throw new LlmError('TIMEOUT', 'Provider request timed out');
        }
        throw new LlmError('PROVIDER_UNAVAILABLE', 'Provider request failed');
      }

      if (!response.ok) {
        try {
          await response.body?.cancel();
        } catch {
          // Do not include an untrusted provider error body in diagnostics.
        }
        const code = errorCodeForStatus(response.status);
        throw new LlmError(code, 'Provider returned an HTTP error');
      }

      const payload = await readBoundedJson(response, signal);
      if (!isRecord(payload) || !Array.isArray(payload.choices)) {
        throw new LlmError('INVALID_OUTPUT', 'Provider response shape is invalid');
      }

      const firstChoice = payload.choices[0];
      if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
        throw new LlmError('INVALID_OUTPUT', 'Provider response choice is invalid');
      }
      const text = messageText(firstChoice.message.content);
      const normalizedFinishReason = finishReason(firstChoice.finish_reason);
      if (text === null || text.trim() === '' || normalizedFinishReason === null) {
        throw new LlmError('INVALID_OUTPUT', 'Provider response content is invalid');
      }
      if (normalizedFinishReason === 'length') {
        throw new LlmError('INVALID_OUTPUT', 'Provider output was truncated');
      }

      const usage = isRecord(payload.usage) ? payload.usage : {};
      const estimatedInput = Math.ceil(
        req.messages.reduce((total, message) => total + message.content.length, 0) / 2,
      );
      const estimatedOutput = Math.ceil(text.length / 2);

      return {
        text,
        finishReason: normalizedFinishReason,
        usage: {
          inputTokens: tokenCount(usage.prompt_tokens) ?? estimatedInput,
          outputTokens: tokenCount(usage.completion_tokens) ?? estimatedOutput,
        },
        model: typeof payload.model === 'string' && payload.model.trim()
          ? payload.model
          : options.model,
      };
    },
  });
}
