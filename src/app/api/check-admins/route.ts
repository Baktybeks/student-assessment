// src/app/api/check-admins/route.ts

import { appwriteConfig } from "@/constants/appwriteConfig";
import { Client, Databases, Query } from "appwrite";
import { UserRole } from "@/types";

export async function GET() {
  try {
    const client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);

    const database = new Databases(client);

    // Проверяем, есть ли пользователи с ролью SUPER_ADMIN
    const adminCheck = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.users,
      [Query.equal("role", UserRole.ADMIN)]
    );

    // Если нет Супер админов, значит это первый пользователь
    const isFirstUser = adminCheck.total === 0;

    return Response.json({ isFirstUser });
  } catch (error) {
    console.error("Ошибка при проверке Супер Админов:", error);
    return Response.json({ message: "Ошибка сервера" }, { status: 500 });
  }
}
