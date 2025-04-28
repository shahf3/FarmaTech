import "@testing-library/jest-dom";
import React from "react";

jest.mock("axios", () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: {
      headers: { common: {}, post: {}, get: {}, put: {}, delete: {} },
    },
  };
  return mockAxios;
});

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: "MED1" }),
  useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  NavLink: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
global.localStorage = localStorageMock;

jest.mock("react-qr-reader", () => ({
  QrReader: jest.fn().mockImplementation(() => null),
}));

jest.mock("html5-qrcode", () => ({
  Html5QrcodeScanner: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    clear: jest.fn(),
  })),
}));

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = function () {
    return {
      matches: false,
      media: "",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };
}

global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
