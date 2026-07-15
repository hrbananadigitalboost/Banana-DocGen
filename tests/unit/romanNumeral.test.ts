import { describe, expect, it } from "vitest";
import { toRomanMonth } from "@/lib/numbering/romanNumeral";

describe("toRomanMonth", () => {
  const expected: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII",
  };

  it.each(Object.entries(expected))("bulan %s -> %s", (month, roman) => {
    expect(toRomanMonth(Number(month))).toBe(roman);
  });

  it("melempar error untuk bulan di luar 1-12", () => {
    expect(() => toRomanMonth(0)).toThrow(RangeError);
    expect(() => toRomanMonth(13)).toThrow(RangeError);
    expect(() => toRomanMonth(1.5)).toThrow(RangeError);
  });
});
