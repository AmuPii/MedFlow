import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../src/App";

vi.mock("../src/services/api", () => ({
  getRecords: vi.fn(async () => ({ records: { "2026-05-18": "taken" } })),
  updateRecord: vi.fn(async () => ({ records: { "2026-05-18": "missed" } })),
  getSettings: vi.fn(async () => ({ notification_time: "09:00" })),
  updateSettings: vi.fn(async () => ({ notification_time: "10:00" })),
  getStats: vi.fn(async () => ({
    total_registrados: 1,
    tomados: 1,
    nao_tomados: 0,
    aderencia_percentual: 100,
    streak_atual: 1,
    melhor_streak: 1
  }))
}));

describe("app interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("abre modal ao clicar em um dia do calendario", async () => {
    render(<App />);
    const dayButton = await screen.findByRole("button", { name: "18" });
    fireEvent.click(dayButton);
    expect(await screen.findByText(/status atual/i)).toBeInTheDocument();
  });

  it("permite alterar horario de notificacao", async () => {
    render(<App />);
    const input = await screen.findByLabelText("Horário diário");
    fireEvent.change(input, { target: { value: "10:00" } });
    await waitFor(() => expect(input).toHaveValue("10:00"));
  });
});

