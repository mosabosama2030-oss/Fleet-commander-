import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { BudgetState, BudgetStore } from './contracts.ts';

/**
 * FC-AI-01 (PROPOSED): تخزين الميزانية في ملف JSON واحد على الجهاز المحلي (يناسب التطوير المحلي DEC-08).
 * - الكتابة ذرّية: ملف مؤقت ثم rename، فلا يبقى ملف نصف مكتوب عند الانقطاع.
 * - ملف غير موجود ⇒ null (بداية نظيفة). ملف تالف أو بقيم غير صالحة ⇒ يرمي، ولا يُفترض صفر
 *   (التصفير الصامت يفتح الميزانية)؛ المشغّل يقرر حذف الملف بوعي.
 * - عملية واحدة فقط تكتب (خادم واحد، كابتن واحد)؛ لا قفل بين عمليات متعددة.
 */
export class FileBudgetStore implements BudgetStore {
  readonly #path: string;

  constructor(path: string) {
    this.#path = path;
  }

  load(): BudgetState | null {
    let raw: string;
    try {
      raw = readFileSync(this.#path, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
    let o: unknown;
    try {
      o = JSON.parse(raw);
    } catch {
      throw new Error('budget file is corrupt');
    }
    const j = o as Record<string, unknown> | null;
    if (
      typeof j !== 'object' ||
      j === null ||
      typeof j.day !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(j.day) ||
      !Number.isSafeInteger(j.requests) ||
      !Number.isSafeInteger(j.tokens) ||
      (j.requests as number) < 0 ||
      (j.tokens as number) < 0
    ) {
      throw new Error('budget file has invalid content');
    }
    return { day: j.day, requests: j.requests as number, tokens: j.tokens as number };
  }

  save(state: BudgetState): void {
    mkdirSync(dirname(this.#path), { recursive: true });
    const tmp = `${this.#path}.tmp`;
    writeFileSync(tmp, JSON.stringify(state), { encoding: 'utf8', mode: 0o600 });
    renameSync(tmp, this.#path);
  }
}
