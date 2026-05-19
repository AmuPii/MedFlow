import React, { useEffect, useMemo, useState } from "react";

import DayModal from "./components/DayModal";
import Sidebar from "./components/Sidebar";
import { getRecords, getSettings, getStats, updateRecord, updateSettings } from "./services/api";
import { buildCalendarMatrix, formatIsoDate, formatMonthKey, WEEK_LABELS } from "./utils/calendar";

const MONTH_LABEL = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

const EMPTY_STATS = {
  total_registrados: 0,
  tomados: 0,
  nao_tomados: 0,
  aderencia_percentual: 0,
  streak_atual: 0,
  melhor_streak: 0
};

function getDayStatus(records, date) {
  if (!date) return "blank";
  const key = formatIsoDate(date);
  return records[key] || "neutral";
}

export default function App() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [records, setRecords] = useState({});
  const [notificationTime, setNotificationTime] = useState("09:00");
  const [stats, setStats] = useState(EMPTY_STATS);
  const [selectedDate, setSelectedDate] = useState(null);
  const [saving, setSaving] = useState(false);

  const monthKey = formatMonthKey(monthDate);
  const calendarCells = useMemo(() => buildCalendarMatrix(monthDate), [monthDate]);

  async function refreshMonth() {
    const response = await getRecords(monthKey);
    setRecords(response.records);
  }

  async function refreshStats() {
    const data = await getStats();
    setStats(data);
  }

  useEffect(() => {
    refreshMonth().catch(() => {});
  }, [monthKey]);

  useEffect(() => {
    getSettings()
      .then((settings) => setNotificationTime(settings.notification_time))
      .catch(() => {});
    refreshStats().catch(() => {});
  }, []);

  async function handleSaveDay(status) {
    if (!selectedDate) return;
    setSaving(true);
    try {
      const dateKey = formatIsoDate(selectedDate);
      const response = await updateRecord(dateKey, status);
      setRecords(response.records);
      await refreshStats();
      setSelectedDate(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleTimeChange(nextTime) {
    setNotificationTime(nextTime);
    try {
      await updateSettings(nextTime);
    } catch (_) {
      // Keep optimistic value; API retries on next change.
    }
  }

  return (
    <div className="layout">
      <Sidebar
        stats={stats}
        notificationTime={notificationTime}
        onChangeNotification={handleTimeChange}
      />
      <main className="calendar-container">
        <header className="calendar-header">
          <button className="month-btn" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>
            ◀
          </button>
          <h2>{MONTH_LABEL.format(monthDate)}</h2>
          <button className="month-btn" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>
            ▶
          </button>
        </header>

        <div className="calendar-grid">
          {WEEK_LABELS.map((label) => (
            <div className="weekday" key={label}>{label}</div>
          ))}
          {calendarCells.map((day, idx) => {
            const status = getDayStatus(records, day);
            return (
              <button
                key={day ? formatIsoDate(day) : `blank-${idx}`}
                disabled={!day}
                className={`day ${status}`}
                onClick={() => day && setSelectedDate(day)}
              >
                {day ? day.getDate() : ""}
              </button>
            );
          })}
        </div>
      </main>

      <DayModal
        open={Boolean(selectedDate)}
        date={selectedDate}
        currentStatus={selectedDate ? getDayStatus(records, selectedDate) : "neutral"}
        onClose={() => !saving && setSelectedDate(null)}
        onSelect={handleSaveDay}
      />
    </div>
  );
}

