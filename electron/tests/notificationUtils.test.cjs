const test = require("node:test");
const assert = require("node:assert/strict");
const { shouldTriggerNotification } = require("../notificationUtils");

test("dispara quando horario bate e ainda nao notificou hoje", () => {
  const now = new Date("2026-05-18T09:00:00");
  const canNotify = shouldTriggerNotification(now, "09:00", null);
  assert.equal(canNotify, true);
});

test("nao dispara quando horario nao bate", () => {
  const now = new Date("2026-05-18T09:03:00");
  const canNotify = shouldTriggerNotification(now, "09:00", null);
  assert.equal(canNotify, false);
});

test("nao dispara duas vezes no mesmo dia", () => {
  const now = new Date("2026-05-18T09:00:00");
  const canNotify = shouldTriggerNotification(now, "09:00", "2026-05-18");
  assert.equal(canNotify, false);
});

