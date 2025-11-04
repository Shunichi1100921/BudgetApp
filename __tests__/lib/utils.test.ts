import { formatCurrency, formatDate, formatMonth } from "@/lib/utils";

describe("utils", () => {
  describe("formatCurrency", () => {
    it("should format positive numbers correctly", () => {
      expect(formatCurrency(1000)).toContain("1,000");
      expect(formatCurrency(1000000)).toContain("1,000,000");
      expect(formatCurrency(12345)).toContain("12,345");
    });

    it("should format zero correctly", () => {
      expect(formatCurrency(0)).toContain("0");
    });

    it("should format negative numbers correctly", () => {
      const result = formatCurrency(-1000);
      expect(result).toContain("1,000");
      expect(result).toContain("-");
    });
  });

  describe("formatDate", () => {
    it("should format date string correctly", () => {
      expect(formatDate("2024-01-15")).toContain("2024");
      expect(formatDate("2024-01-15")).toContain("1");
      expect(formatDate("2024-01-15")).toContain("15");
    });
  });

  describe("formatMonth", () => {
    it("should format month string correctly", () => {
      expect(formatMonth("2024-01")).toBe("2024年1月");
      expect(formatMonth("2024-12")).toBe("2024年12月");
    });
  });
});

