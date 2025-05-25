// components/ClientOnlyToastContainer.tsx
"use client";

import { ToastContainer } from "react-toastify";

export function ClientOnlyToastContainer() {
  return <ToastContainer position="top-right" autoClose={3000} />;
}
