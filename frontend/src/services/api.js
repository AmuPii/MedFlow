const API_URL = "http://127.0.0.1:8765";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }
  return response.json();
}

export function getRecords(month) {
  return request(`/records?month=${month}`);
}

export function updateRecord(date, status) {
  return request(`/records/${date}`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
}

export function getSettings() {
  return request("/settings");
}

export function updateSettings(notificationTime) {
  return request("/settings", {
    method: "PUT",
    body: JSON.stringify({ notification_time: notificationTime })
  });
}

export function getStats() {
  return request("/stats");
}

