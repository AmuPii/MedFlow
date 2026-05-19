import { describe, expect, it } from "vitest";

import { buildCalendarMatrix, formatIsoDate } from "../src/utils/calendar";

describe("calendar utils", () => {
  it("gera matriz de calendario multiplo de 7", () => {
    const matrix = buildCalendarMatrix(new Date("2026-05-01T00:00:00"));
    expect(matrix.length % 7).toBe(0);
  });

  it("formata data no padrao iso", () => {
    const iso = formatIsoDate(new Date("2026-05-09T00:00:00"));
    expect(iso).toBe("2026-05-09");
  });
});

