import type { LlmGateway } from '../ai/gateway.ts';
import { llmIntent } from './llm-intent.ts';
import type { TurnResult, VoiceContext, VoiceSession } from './session.ts';

/**
 * دور صوتي واحد: القواعد أولًا (مجانًا)، والنموذج فقط عند العجز وبوجود Gateway.
 * الفشل في أي نقطة يرجع لسلوك القواعد وحدها.
 */
export async function handleAssisted(
  session: VoiceSession,
  gateway: LlmGateway | null,
  transcript: string,
  ctx: VoiceContext,
  requestId: string,
): Promise<TurnResult> {
  if (!gateway || !session.wantsLlm(transcript)) return session.handle(transcript, ctx);
  const hint = await llmIntent(gateway, transcript, requestId);
  return session.handle(transcript, ctx, hint);
}
