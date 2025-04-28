import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders FarmaTech loading screen", () => {
  render(<App />);
  const loadingElement = screen.getByText(/Loading FarmaTech/i);
  expect(loadingElement).toBeInTheDocument();
});
