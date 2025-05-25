// scripts/setupCollections.js
const { Client, Databases, Permission, Role } = require("node-appwrite");
require("dotenv").config({ path: ".env.local" });

const appwriteConfig = {
  endpoint:
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "",
  collections: {
    users: process.env.NEXT_PUBLIC_USERS_COLLECTION_ID || "users",
    institutes:
      process.env.NEXT_PUBLIC_INSTITUTES_COLLECTION_ID || "institutes",
    directions:
      process.env.NEXT_PUBLIC_DIRECTIONS_COLLECTION_ID || "directions",
    tests: process.env.NEXT_PUBLIC_TESTS_COLLECTION_ID || "tests",
    questions: process.env.NEXT_PUBLIC_QUESTIONS_COLLECTION_ID || "questions",
    testSessions:
      process.env.NEXT_PUBLIC_TEST_SESSIONS_COLLECTION_ID || "test_sessions",
    testResults:
      process.env.NEXT_PUBLIC_TEST_RESULTS_COLLECTION_ID || "test_results",
    applicantProfiles:
      process.env.NEXT_PUBLIC_APPLICANT_PROFILES_COLLECTION_ID ||
      "applicant_profiles",
    curatorAssignments:
      process.env.NEXT_PUBLIC_CURATOR_ASSIGNMENTS_COLLECTION_ID ||
      "curator_assignments",
  },
};

const COLLECTION_SCHEMAS = {
  users: {
    name: { type: "string", required: true, size: 255 },
    email: { type: "email", required: true, size: 320 },
    role: {
      type: "enum",
      required: true,
      elements: ["ADMIN", "CURATOR", "APPLICANT"],
    },
    isActive: { type: "boolean", required: false, default: false },
    isBlocked: { type: "boolean", required: false, default: false },
    createdAt: { type: "datetime", required: true },
    createdBy: { type: "string", required: false },
  },

  institutes: {
    name: { type: "string", required: true, size: 255 },
    code: { type: "string", required: true, size: 50 },
    description: { type: "string", required: false, size: 1000 },
    isActive: { type: "boolean", required: false, default: true },
    createdBy: { type: "string", required: true, size: 36 },
    createdAt: { type: "datetime", required: true },
  },

  directions: {
    name: { type: "string", required: true, size: 255 },
    code: { type: "string", required: true, size: 50 },
    instituteId: { type: "string", required: true, size: 36 },
    description: { type: "string", required: false, size: 1000 },
    isActive: { type: "boolean", required: false, default: true },
    createdBy: { type: "string", required: true, size: 36 },
    createdAt: { type: "datetime", required: true },
  },

  tests: {
    title: { type: "string", required: true, size: 255 },
    description: { type: "string", required: false, size: 1000 },
    directionId: { type: "string", required: true, size: 36 },
    curatorId: { type: "string", required: true, size: 36 },
    timeLimit: { type: "integer", required: false, min: 0, max: 300 },
    totalQuestions: { type: "integer", required: false, default: 0 },
    maxScore: { type: "integer", required: false, default: 100 },
    passingScore: { type: "integer", required: false, default: 60 },
    isActive: { type: "boolean", required: false, default: true },
    isPublished: { type: "boolean", required: false, default: false },
    createdAt: { type: "datetime", required: true },
    updatedAt: { type: "datetime", required: false },
  },

  questions: {
    testId: { type: "string", required: true, size: 36 },
    questionText: { type: "string", required: true, size: 1000 },
    optionA: { type: "string", required: true, size: 500 },
    optionB: { type: "string", required: true, size: 500 },
    optionC: { type: "string", required: true, size: 500 },
    optionD: { type: "string", required: true, size: 500 },
    correctAnswer: {
      type: "enum",
      required: true,
      elements: ["A", "B", "C", "D"],
    },
    points: { type: "integer", required: false, default: 1, min: 1, max: 10 },
    order: { type: "integer", required: true, min: 1 },
    createdAt: { type: "datetime", required: true },
  },

  testSessions: {
    applicantId: { type: "string", required: true, size: 36 },
    testId: { type: "string", required: true, size: 36 },
    status: {
      type: "enum",
      required: true,
      elements: ["IN_PROGRESS", "COMPLETED", "ABANDONED", "TIME_UP"],
    },
    startedAt: { type: "datetime", required: true },
    completedAt: { type: "datetime", required: false },
    timeSpent: { type: "integer", required: false, min: 0 },
    currentQuestionIndex: { type: "integer", required: false, default: 0 },
    answers: { type: "string", required: false, size: 10000 },
    score: { type: "integer", required: false, min: 0, max: 100 },
    correctAnswers: { type: "integer", required: false, default: 0 },
    totalQuestions: { type: "integer", required: false, default: 0 },
    grade: {
      type: "enum",
      required: false,
      elements: [
        "неудовлетворительно",
        "удовлетворительно",
        "хорошо",
        "отлично",
      ],
    },
  },

  testResults: {
    sessionId: { type: "string", required: true, size: 36 },
    applicantId: { type: "string", required: true, size: 36 },
    testId: { type: "string", required: true, size: 36 },
    score: { type: "integer", required: true, min: 0, max: 100 },
    correctAnswers: { type: "integer", required: true, default: 0 },
    totalQuestions: { type: "integer", required: true, default: 0 },
    timeSpent: { type: "integer", required: true, min: 0 },
    grade: {
      type: "enum",
      required: true,
      elements: [
        "неудовлетворительно",
        "удовлетворительно",
        "хорошо",
        "отлично",
      ],
    },
    isPassed: { type: "boolean", required: true, default: false },
    completedAt: { type: "datetime", required: true },
    detailedAnswers: { type: "string", required: false, size: 20000 },
  },

  applicantProfiles: {
    userId: { type: "string", required: true, size: 36 },
    firstName: { type: "string", required: true, size: 100 },
    lastName: { type: "string", required: true, size: 100 },
    middleName: { type: "string", required: false, size: 100 },
    birthDate: { type: "datetime", required: true },
    passportNumber: { type: "string", required: true, size: 50 },
    passportIssueDate: { type: "datetime", required: true },
    passportIssuedBy: { type: "string", required: true, size: 500 },
    citizenship: { type: "string", required: true, size: 100 },
    phone: { type: "string", required: true, size: 20 },
    directionId: { type: "string", required: true, size: 36 },
    isProfileComplete: { type: "boolean", required: false, default: false },
    createdAt: { type: "datetime", required: true },
    updatedAt: { type: "datetime", required: false },
  },

  curatorAssignments: {
    curatorId: { type: "string", required: true, size: 36 },
    instituteId: { type: "string", required: true, size: 36 },
    assignedBy: { type: "string", required: true, size: 36 },
    createdAt: { type: "datetime", required: true },
  },
};

const COLLECTION_INDEXES = {
  users: [
    { key: "email", type: "unique" },
    { key: "role", type: "key" },
    { key: "isActive", type: "key" },
    { key: "isBlocked", type: "key" },
  ],
  institutes: [
    { key: "code", type: "unique" },
    { key: "createdBy", type: "key" },
    { key: "isActive", type: "key" },
  ],
  directions: [
    { key: "code", type: "key" },
    { key: "instituteId", type: "key" },
    { key: "createdBy", type: "key" },
    { key: "isActive", type: "key" },
    {
      key: "institute_code",
      type: "unique",
      attributes: ["instituteId", "code"],
    },
  ],
  tests: [
    { key: "directionId", type: "key" },
    { key: "curatorId", type: "key" },
    { key: "isActive", type: "key" },
    { key: "isPublished", type: "key" },
    { key: "createdAt", type: "key" },
  ],
  questions: [
    { key: "testId", type: "key" },
    { key: "order", type: "key" },
    {
      key: "test_order",
      type: "unique",
      attributes: ["testId", "order"],
    },
  ],
  testSessions: [
    { key: "applicantId", type: "key" },
    { key: "testId", type: "key" },
    { key: "status", type: "key" },
    { key: "startedAt", type: "key" },
    {
      key: "applicant_test",
      type: "key",
      attributes: ["applicantId", "testId"],
    },
  ],
  testResults: [
    { key: "sessionId", type: "unique" },
    { key: "applicantId", type: "key" },
    { key: "testId", type: "key" },
    { key: "completedAt", type: "key" },
    { key: "score", type: "key" },
    { key: "grade", type: "key" },
  ],
  applicantProfiles: [
    { key: "userId", type: "unique" },
    { key: "directionId", type: "key" },
    { key: "passportNumber", type: "unique" },
    { key: "isProfileComplete", type: "key" },
  ],
  curatorAssignments: [
    { key: "curatorId", type: "key" },
    { key: "instituteId", type: "key" },
    { key: "assignedBy", type: "key" },
    {
      key: "curator_institute",
      type: "unique",
      attributes: ["curatorId", "instituteId"],
    },
  ],
};

const client = new Client();
client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const createAttribute = async (databaseId, collectionId, key, schema) => {
  try {
    const attributeType = schema.type;

    let isRequired = schema.required || false;
    let defaultValue = schema.default;

    if (isRequired && defaultValue !== null && defaultValue !== undefined) {
      console.log(
        `    ⚠️ Исправление ${key}: required=true с default значением -> required=false`
      );
      isRequired = false;
    }

    switch (attributeType) {
      case "string":
        return await databases.createStringAttribute(
          databaseId,
          collectionId,
          key,
          schema.size || 255,
          isRequired,
          defaultValue || null,
          schema.array || false
        );

      case "email":
        return await databases.createEmailAttribute(
          databaseId,
          collectionId,
          key,
          isRequired,
          defaultValue || null,
          schema.array || false
        );

      case "enum":
        return await databases.createEnumAttribute(
          databaseId,
          collectionId,
          key,
          schema.elements,
          isRequired,
          defaultValue || null,
          schema.array || false
        );

      case "boolean":
        return await databases.createBooleanAttribute(
          databaseId,
          collectionId,
          key,
          isRequired,
          defaultValue !== null && defaultValue !== undefined
            ? defaultValue
            : null,
          schema.array || false
        );

      case "datetime":
        return await databases.createDatetimeAttribute(
          databaseId,
          collectionId,
          key,
          isRequired,
          defaultValue || null,
          schema.array || false
        );

      case "integer":
        return await databases.createIntegerAttribute(
          databaseId,
          collectionId,
          key,
          isRequired,
          schema.min || null,
          schema.max || null,
          defaultValue || null,
          schema.array || false
        );

      case "url":
        return await databases.createUrlAttribute(
          databaseId,
          collectionId,
          key,
          isRequired,
          defaultValue || null,
          schema.array || false
        );

      default:
        throw new Error(`Неподдерживаемый тип атрибута: ${attributeType}`);
    }
  } catch (error) {
    console.error(`Ошибка создания атрибута ${key}:`, error.message);
    throw error;
  }
};

const createIndex = async (databaseId, collectionId, indexConfig) => {
  try {
    return await databases.createIndex(
      databaseId,
      collectionId,
      indexConfig.key,
      indexConfig.type,
      indexConfig.attributes || [indexConfig.key],
      indexConfig.orders || ["ASC"]
    );
  } catch (error) {
    console.error(`Ошибка создания индекса ${indexConfig.key}:`, error.message);
    throw error;
  }
};

const setupCollections = async () => {
  try {
    console.log("🧪 Начинаем создание коллекций для системы тестирования...");
    console.log(
      "📋 Всего коллекций для создания:",
      Object.keys(COLLECTION_SCHEMAS).length
    );

    const databaseId = appwriteConfig.databaseId;

    if (!databaseId) {
      throw new Error("Database ID не найден! Проверьте переменные окружения.");
    }

    for (const [collectionName, schema] of Object.entries(COLLECTION_SCHEMAS)) {
      console.log(`\n📁 Создание коллекции: ${collectionName}`);

      try {
        const collectionId = appwriteConfig.collections[collectionName];

        const collection = await databases.createCollection(
          databaseId,
          collectionId,
          collectionName,
          [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
          ],
          false
        );

        console.log(
          `  ✅ Коллекция ${collectionName} создана (ID: ${collectionId})`
        );

        console.log(`  📝 Добавление атрибутов...`);
        let attributeCount = 0;

        for (const [attributeKey, attributeSchema] of Object.entries(schema)) {
          try {
            await createAttribute(
              databaseId,
              collectionId,
              attributeKey,
              attributeSchema
            );
            attributeCount++;
            console.log(`    ✅ ${attributeKey} (${attributeSchema.type})`);

            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`    ❌ ${attributeKey}: ${error.message}`);
          }
        }

        console.log(
          `  📊 Создано атрибутов: ${attributeCount}/${
            Object.keys(schema).length
          }`
        );

        if (COLLECTION_INDEXES[collectionName]) {
          console.log(`  🔍 Создание индексов...`);
          let indexCount = 0;

          for (const indexConfig of COLLECTION_INDEXES[collectionName]) {
            try {
              await createIndex(databaseId, collectionId, indexConfig);
              indexCount++;
              console.log(`    ✅ Индекс: ${indexConfig.key}`);

              await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (error) {
              console.error(
                `    ❌ Индекс ${indexConfig.key}: ${error.message}`
              );
            }
          }

          console.log(
            `  📈 Создано индексов: ${indexCount}/${COLLECTION_INDEXES[collectionName].length}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Ошибка создания коллекции ${collectionName}:`,
          error.message
        );
      }
    }

    console.log("\n🎉 Настройка коллекций системы тестирования завершена!");
    console.log("🔗 Откройте консоль Appwrite для проверки результата.");
    console.log("\n📝 Следующие шаги:");
    console.log("1. Проверьте созданные коллекции в консоли Appwrite");
    console.log("2. Запустите приложение: npm run dev");
    console.log("3. Зарегистрируйтесь как первый администратор");
  } catch (error) {
    console.error("💥 Общая ошибка:", error.message);
    console.log("\n🔍 Проверьте:");
    console.log("- Переменные окружения в .env.local");
    console.log("- Права доступа API ключа");
    console.log("- Подключение к интернету");
  }
};

const resetCollections = async () => {
  try {
    console.log("🗑️ Удаление существующих коллекций системы тестирования...");

    const databaseId = appwriteConfig.databaseId;
    let deletedCount = 0;

    for (const [collectionName] of Object.entries(COLLECTION_SCHEMAS)) {
      try {
        const collectionId = appwriteConfig.collections[collectionName];
        await databases.deleteCollection(databaseId, collectionId);
        deletedCount++;
        console.log(`✅ ${collectionName} удалена`);
      } catch (error) {
        console.log(`⚠️ ${collectionName} не найдена или уже удалена`);
      }
    }

    console.log(`🧹 Удалено коллекций: ${deletedCount}`);
  } catch (error) {
    console.error("Ошибка при удалении коллекций:", error.message);
  }
};

const checkEnvironment = () => {
  const required = [
    "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    "NEXT_PUBLIC_APPWRITE_DATABASE_ID",
    "APPWRITE_API_KEY",
  ];

  const missing = required.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.error("❌ Отсутствуют переменные окружения:");
    missing.forEach((env) => console.error(`  - ${env}`));
    console.log("\n💡 Создайте файл .env.local с необходимыми переменными");
    process.exit(1);
  }

  console.log("✅ Все переменные окружения найдены");
};

const main = async () => {
  console.log("🧪 Система тестирования абитуриентов - Настройка базы данных\n");

  checkEnvironment();

  const command = process.argv[2];

  switch (command) {
    case "setup":
      await setupCollections();
      break;
    case "reset":
      await resetCollections();
      break;
    case "reset-setup":
      await resetCollections();
      console.log("\n⏳ Ожидание 3 секунды перед созданием...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await setupCollections();
      break;
    default:
      console.log("📖 Использование:");
      console.log(
        "  node scripts/setupCollections.js setup        - Создать коллекции"
      );
      console.log(
        "  node scripts/setupCollections.js reset        - Удалить коллекции"
      );
      console.log(
        "  node scripts/setupCollections.js reset-setup  - Пересоздать коллекции"
      );
      break;
  }
};

if (require.main === module) {
  main().catch(console.error);
}
