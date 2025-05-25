// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/types";

export function middleware(request: NextRequest) {
  const authSession = request.cookies.get("auth-storage");
  let user = null;

  if (authSession) {
    try {
      const parsed = JSON.parse(authSession.value);
      user = parsed.state?.user;
    } catch (error) {
      console.error("Ошибка при разборе auth-session:", error);
    }
  }

  const isAuthenticated = !!user;
  const isActive = user?.isActive === true;
  const isBlocked = user?.isBlocked === true;
  const path = request.nextUrl.pathname;

  // Публичные страницы - логин и регистрация
  if (path.startsWith("/login") || path.startsWith("/register")) {
    if (isAuthenticated && isActive && !isBlocked) {
      return redirectByRole(user.role, request);
    }
    return NextResponse.next();
  }

  // Если пользователь не авторизован, не активирован или заблокирован
  if (!isAuthenticated || !isActive || isBlocked) {
    const loginUrl = new URL(request.nextUrl.origin);
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Защита маршрутов по ролям

  // Администратор - доступ ко всем маршрутам /admin
  if (path.startsWith("/admin") && user.role !== UserRole.ADMIN) {
    return redirectByRole(user.role, request);
  }

  // Куратор - доступ к маршрутам /curator
  if (path.startsWith("/curator") && user.role !== UserRole.CURATOR) {
    return redirectByRole(user.role, request);
  }

  // Абитуриент - доступ к маршрутам /applicant
  if (path.startsWith("/applicant") && user.role !== UserRole.APPLICANT) {
    return redirectByRole(user.role, request);
  }

  // Перенаправление с главной страницы
  if (path === "/") {
    return redirectByRole(user.role, request);
  }

  return NextResponse.next();
}

function redirectByRole(role: UserRole, request: NextRequest) {
  let path: string;

  switch (role) {
    case UserRole.ADMIN:
      path = "/admin/dashboard";
      break;
    case UserRole.CURATOR:
      path = "/curator/dashboard";
      break;
    case UserRole.APPLICANT:
      path = "/applicant/dashboard";
      break;
    default:
      path = "/login";
  }

  const url = new URL(request.nextUrl.origin);
  url.pathname = path;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|public|favicon.ico).*)",
    "/admin/:path*",
    "/curator/:path*",
    "/applicant/:path*",
    "/login",
    "/register",
    "/",
  ],
};
