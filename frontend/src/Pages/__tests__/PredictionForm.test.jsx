import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PredictionForm from "../Clinician/PredictionForm";

// --------------------
// DYNAMIC AUTH MOCK
// --------------------
let mockToken = "fake-jwt-token";

vi.mock("../../Context/AuthContext", () => ({
  useAuth: () => ({
    token: mockToken,
  }),
}));

// --------------------
// ROUTER + LAYOUT MOCKS
// --------------------
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../Components/DashboardLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

// --------------------
// TESTS
// --------------------
describe("PredictionForm", () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
    mockToken = "fake-jwt-token"; // reset auth
    window.alert = vi.fn();
  });

  test("blocks submission when user is not authenticated", async () => {
  mockToken = null; // simulate logged-out user
  window.alert = vi.fn();

  render(<PredictionForm />);

  // Fill REQUIRED fields so HTML validation passes
  fireEvent.change(
    document.querySelector('input[name="age"]'),
    { target: { value: "45" } }
  );

  fireEvent.change(
    document.querySelector('select[name="gender"]'),
    { target: { value: "male" } }
  );

  fireEvent.change(
    document.querySelector('input[name="csf_protein"]'),
    { target: { value: "120" } }
  );

  fireEvent.click(
    screen.getByRole("button", { name: /predict subtype/i })
  );

  expect(window.alert).toHaveBeenCalledWith(
    "Not authenticated. Please log in again."
  );

  expect(fetch).not.toHaveBeenCalled();
});
});
