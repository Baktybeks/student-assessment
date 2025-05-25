// components/common/Layout.tsx
"use client";

import React from "react";
import { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = "Система оценки компетенций",
  description = "Платформа для оценки компетенций преподавателей и студентов",
}) => {
  React.useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">{children}</main>
    </div>
  );
};

export default Layout;
