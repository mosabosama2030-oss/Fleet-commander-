import type { LlmProvider } from '../contracts.ts';
import {
  createOpenAICompatibleProvider,
  type ProviderFetch,
} from './openai-compatible.ts';

export type ProviderEnvironment = Readonly<Record<string, string | undefined>>;

interface ProviderDefinition {
  readonly id: string;
  readonly envKey: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly supportsJson: boolean;
  readonly maxContextTokens: number;
}

/**
 * Pinned model/provider catalogue. No environment-controlled host or model ID:
 * credentials cannot redirect server-side requests or silently select a paid model.
 */
export const PROVIDER_CATALOG: readonly ProviderDefinition[] = Object.freeze([
  {
    id: 'openrouter-gemma-4',
    envKey: 'FC_OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemma-4-31b-it:free',
    supportsJson: true,
    maxContextTokens: 262_144,
  },
  {
    id: 'gemini-flash-lite',
    envKey: 'FC_GEMINI_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-3.1-flash-lite',
    // Keep text-only until a dedicated Gemini-native structured-output adapter is reviewed.
    supportsJson: false,
    maxContextTokens: 1_048_576,
  },
  {
    id: 'mistral-small-4',
    envKey: 'FC_MISTRAL_API_KEY',
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-small-2603',
    supportsJson: true,
    maxContextTokens: 262_144,
  },
  {
    id: 'nvidia-nemotron-3-ultra',
    envKey: 'FC_NVIDIA_API_KEY',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'nvidia/nemotron-3-ultra-550b-a55b',
    supportsJson: false,
    maxContextTokens: 1_000_000,
  },
]);

/**
 * Creates adapters only for credentials explicitly provided by the server.
 * This does not enable the Gateway, any purpose, any provider policy, or any budget.
 * There is no network access during construction.
 */
export function createConfiguredLlmProviders(
  env: ProviderEnvironment,
  fetcher?: ProviderFetch,
): Readonly<Record<string, LlmProvider>> {
  const providers: Record<string, LlmProvider> = Object.create(null) as Record<string, LlmProvider>;

  for (const definition of PROVIDER_CATALOG) {
    const apiKey = env[definition.envKey]?.trim();
    if (!apiKey) continue;

    providers[definition.id] = createOpenAICompatibleProvider({
      id: definition.id,
      baseUrl: definition.baseUrl,
      apiKey,
      model: definition.model,
      supportsJson: definition.supportsJson,
      maxContextTokens: definition.maxContextTokens,
      ...(fetcher ? { fetcher } : {}),
    });
  }

  return Object.freeze(providers);
}
