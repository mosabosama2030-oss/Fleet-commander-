import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VoiceSession } from '../src/index.ts';

const COMMAND = 'ابدأ الشيفت العداد ١٢٠٠٠';

function makeSession(ttlMs = 20_000) {
  let now = 0;
  const session = new VoiceSession(() => now, ttlMs);
  return {
    session,
    setNow(value: number) {
      now = value;
    },
  };
}

describe('voice confirmation TTL boundaries', () => {
  it('accepts an explicit confirmation at the exact TTL boundary', () => {
    const { session, setNow } = makeSession();

    const preview = session.handle(COMMAND);
    assert.equal(preview.action, null);
    assert.match(preview.reply.text, /12000/);
    assert.match(preview.reply.text, /أأكّد/);

    setNow(20_000);
    const confirmed = session.handle('أيوه');

    assert.deepEqual(confirmed.action, {
      kind: 'start_shift',
      startOdometerKm: 12000,
    });
    assert.equal(confirmed.reply.text, 'ثانية واحدة، بنفّذ.');
  });

  it('rejects confirmation one millisecond after TTL and cannot replay it', () => {
    const { session, setNow } = makeSession();

    const preview = session.handle(COMMAND);
    assert.equal(preview.action, null);

    setNow(20_001);
    const expired = session.handle('أيوه');

    assert.equal(expired.action, null);
    assert.equal(expired.reply.text, 'المهلة خلصت. قول الأمر تاني من فضلك.');

    const replay = session.handle('أيوه');
    assert.equal(replay.action, null);
    assert.equal(replay.reply.text, 'مفيش حاجة معلّقة أأكّدها.');
  });

  it('still requires a fresh confirmation after a command is re-issued', () => {
    const { session, setNow } = makeSession();

    session.handle(COMMAND);
    setNow(20_001);
    assert.equal(session.handle('أيوه').action, null);

    const newPreview = session.handle(COMMAND);
    assert.equal(newPreview.action, null);
    assert.match(newPreview.reply.text, /أأكّد/);

    const confirmed = session.handle('أيوه');
    assert.deepEqual(confirmed.action, {
      kind: 'start_shift',
      startOdometerKm: 12000,
    });
  });
});
