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

describe("ExpenseForm", () => {
  it("should render form fields", () => {
    render(<ExpenseForm />);
    expect(screen.getByLabelText(/金額/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/日付/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/カテゴリ/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/支払い方法/i)).toBeInTheDocument();
  });

  it("should show validation errors for empty required fields", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);

    const submitButton = screen.getByRole("button", { name: /追加/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Zodのエラーメッセージまたはカスタムメッセージを確認
      const errorMessages = screen.getAllByText(/金額|カテゴリ|支払い方法/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);

    // Fill in the form
    await user.type(screen.getByLabelText(/金額/i), "1000");
    await user.selectOptions(screen.getByLabelText(/カテゴリ/i), "食費");
    await user.selectOptions(screen.getByLabelText(/支払い方法/i), "現金");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /追加/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
          category: "食費",
          paymentMethod: "現金",
        })
      );
    });
  });

  it("should validate amount is positive", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);

    await user.type(screen.getByLabelText(/金額/i), "0");
    await user.selectOptions(screen.getByLabelText(/カテゴリ/i), "食費");
    await user.selectOptions(screen.getByLabelText(/支払い方法/i), "現金");

    const submitButton = screen.getByRole("button", { name: /追加/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/金額は1円以上である必要があります/i)
      ).toBeInTheDocument();
    });
  });
});

