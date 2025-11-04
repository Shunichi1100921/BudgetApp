import {
  expenseStorage,
  budgetStorage,
  paymentMethodStorage,
} from "@/lib/storage";
import { Expense, Budget, PaymentMethodConfig } from "@/lib/types";

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });
  mockLocalStorage.getItem.mockReturnValue(null);
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.getItem.mockClear();
});

describe("storage", () => {
  describe("expenseStorage", () => {
    it("should return empty array when no data exists", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(expenseStorage.getAll()).toEqual([]);
    });

    it("should save and retrieve expenses", () => {
      const expenses: Expense[] = [
        {
          id: "1",
          amount: 1000,
          category: "食費",
          paymentMethod: "現金",
          description: "テスト",
          date: "2024-01-15",
          createdAt: "2024-01-15T00:00:00Z",
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expenses));
      expect(expenseStorage.getAll()).toEqual(expenses);
    });

    it("should add expense", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      const expense: Expense = {
        id: "1",
        amount: 1000,
        category: "食費",
        paymentMethod: "現金",
        description: "テスト",
        date: "2024-01-15",
        createdAt: "2024-01-15T00:00:00Z",
      };

      expenseStorage.add(expense);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "budget-app-expenses",
        JSON.stringify([expense])
      );
    });

    it("should delete expense", () => {
      const expenses: Expense[] = [
        {
          id: "1",
          amount: 1000,
          category: "食費",
          paymentMethod: "現金",
          description: "テスト",
          date: "2024-01-15",
          createdAt: "2024-01-15T00:00:00Z",
        },
        {
          id: "2",
          amount: 2000,
          category: "交通費",
          paymentMethod: "クレジットカード",
          description: "テスト2",
          date: "2024-01-16",
          createdAt: "2024-01-16T00:00:00Z",
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expenses));
      expenseStorage.delete("1");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "budget-app-expenses",
        JSON.stringify([expenses[1]])
      );
    });
  });

  describe("budgetStorage", () => {
    it("should return empty array when no data exists", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(budgetStorage.getAll()).toEqual([]);
    });

    it("should add budget", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      const budget: Budget = {
        id: "1",
        category: "食費",
        amount: 50000,
        month: "2024-01",
        createdAt: "2024-01-15T00:00:00Z",
      };

      budgetStorage.add(budget);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "budget-app-budgets",
        JSON.stringify([budget])
      );
    });
  });

  describe("paymentMethodStorage", () => {
    it("should return empty array when no data exists", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(paymentMethodStorage.getAll()).toEqual([]);
    });

    it("should add payment method", () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      const paymentMethod: PaymentMethodConfig = {
        id: "1",
        name: "現金",
        balance: 100000,
      };

      paymentMethodStorage.add(paymentMethod);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "budget-app-payment-methods",
        JSON.stringify([paymentMethod])
      );
    });
  });
});

