import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExpenseForm from "@/components/ExpenseForm";
import { useBudgetStore } from "@/lib/store/useBudgetStore";

// Mock the store
jest.mock("@/lib/store/useBudgetStore");
const mockAddExpense = jest.fn();

beforeEach(() => {
  (useBudgetStore as jest.Mock).mockReturnValue({
    addExpense: mockAddExpense,
  });
  mockAddExpense.mockClear();
});

describe("ExpenseForm Integration Test", () => {
  it("should successfully submit form with valid data", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);

    // Fill in all required fields
    const amountInput = screen.getByLabelText(/金額/i);
    await user.clear(amountInput);
    await user.type(amountInput, "3000");

    const dateInput = screen.getByLabelText(/日付/i);
    await user.clear(dateInput);
    await user.type(dateInput, "2025-11-03");

    const categorySelect = screen.getByLabelText(/カテゴリ/i);
    await user.selectOptions(categorySelect, "娯楽");

    const paymentMethodSelect = screen.getByLabelText(/支払い方法/i);
    await user.selectOptions(paymentMethodSelect, "現金");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /追加/i });
    await user.click(submitButton);

    // Wait for form submission
    await waitFor(
      () => {
        expect(mockAddExpense).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 3000,
            category: "娯楽",
            paymentMethod: "現金",
            date: "2025-11-03",
          })
        );
      },
      { timeout: 3000 }
    );
  });

  it("should show validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);

    // Try to submit without filling fields
    const submitButton = screen.getByRole("button", { name: /追加/i });
    await user.click(submitButton);

    // Wait for validation errors
    await waitFor(() => {
      const errorMessages = screen.getAllByText(/を選択してください|は1円以上/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });
});

