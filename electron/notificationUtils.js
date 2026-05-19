function shouldTriggerNotification(now, targetTime, lastNotificationDate) {
  const [hh, mm] = targetTime.split(":").map(Number);
  const currentKey = `${now.getHours()}:${now.getMinutes()}`;
  const targetKey = `${hh}:${mm}`;
  const today = now.toISOString().slice(0, 10);

  if (currentKey !== targetKey) return false;
  if (lastNotificationDate === today) return false;
  return true;
}

module.exports = {
  shouldTriggerNotification
};

