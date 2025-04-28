import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

const AllTheProviders = ({ children, authValue }) => {
  const defaultAuthValue = {
    user: { id: "1", role: "manufacturer", organization: "TestCorp" },
    token: "mock-token",
    loading: false,
    ...authValue,
  };

  return (
    <BrowserRouter>
      <AuthContext.Provider value={defaultAuthValue}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

const customRender = (ui, options = {}) =>
  render(ui, {
    wrapper: (props) => (
      <AllTheProviders {...props} authValue={options.authValue} />
    ),
    ...options,
  });

export * from "@testing-library/react";
export { customRender as render };
