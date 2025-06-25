// src/app/(dashboard)/applicant/profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useProfileByUserId,
  useCreateProfile,
  useUpdateProfile,
  profileApi,
} from "@/services/profileService";
import { useActiveDirections } from "@/services/instituteService";
import {
  ApplicantProfile,
  UpdateApplicantProfileDto,
  UserRole,
} from "@/types";
import { toast } from "react-toastify";
import {
  User,
  Save,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Building,
  GraduationCap,
  Edit,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Zap,
  Target,
  BookOpen,
  Award,
  Settings,
  Database,
} from "lucide-react";

export default function ApplicantProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = useProfileByUserId(user?.$id || "");
  const { data: directions = [] } = useActiveDirections();
  const createProfileMutation = useCreateProfile();
  const updateProfileMutation = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [formData, setFormData] = useState<UpdateApplicantProfileDto>({
    firstName: "",
    lastName: "",
    middleName: "",
    birthDate: "",
    passportNumber: "",
    passportIssueDate: "",
    passportIssuedBy: "",
    citizenship: "Российская Федерация",
    phone: "",
    directionId: "",
  });

  // Инициализация формы при загрузке профиля
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        middleName: profile.middleName || "",
        birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : "",
        passportNumber: profile.passportNumber || "",
        passportIssueDate: profile.passportIssueDate ? new Date(profile.passportIssueDate).toISOString().split('T')[0] : "",
        passportIssuedBy: profile.passportIssuedBy || "",
        citizenship: profile.citizenship || "Российская Федерация",
        phone: profile.phone || "",
        directionId: profile.directionId || "",
      });
    } else if (!isLoading && user && !profile) {
      // Если профиля нет, включаем режим редактирования
      setIsEditing(true);
    }
  }, [profile, isLoading, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("ОШИБКА АУТЕНТИФИКАЦИИ");
      return;
    }

    // Валидация
    const errors = profileApi.validateProfileData(formData);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    try {
      if (profile) {
        // Обновление существующего профиля
        await updateProfileMutation.mutateAsync({
          profileId: profile.$id,
          data: formData,
        });
        toast.success("✅ ПРОФИЛЬ УСПЕШНО ОБНОВЛЕН");
      } else {
        // Создание нового профиля
        if (!formData.directionId) {
          toast.error("ВЫБЕРИТЕ НАПРАВЛЕНИЕ ПОДГОТОВКИ");
          return;
        }
        await createProfileMutation.mutateAsync({
          userId: user.$id,
          directionId: formData.directionId,
        });
        // После создания обновляем данные
        await updateProfileMutation.mutateAsync({
          profileId: profile?.$id || "",
          data: formData,
        });
        toast.success("✅ ПРОФИЛЬ УСПЕШНО СОЗДАН И ЗАПОЛНЕН");
      }

      setIsEditing(false);
    } catch (error) {
      toast.error(`❌ ОШИБКА ПРИ СОХРАНЕНИИ: ${(error as Error).message}`);
    }
  };

  const getSelectedDirection = () => {
    return directions.find(d => d.$id === formData.directionId);
  };

  const getProfileCompletionPercentage = () => {
    const totalFields = 9; // количество обязательных полей
    let filledFields = 0;

    if (formData.firstName) filledFields++;
    if (formData.lastName) filledFields++;
    if (formData.birthDate) filledFields++;
    if (formData.passportNumber) filledFields++;
    if (formData.passportIssueDate) filledFields++;
    if (formData.passportIssuedBy) filledFields++;
    if (formData.citizenship) filledFields++;
    if (formData.phone) filledFields++;
    if (formData.directionId) filledFields++;

    return Math.round((filledFields / totalFields) * 100);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "НЕ УКАЗАНО";
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  const formatPassport = (passportNumber: string) => {
    if (!showPassport) {
      return passportNumber.replace(/./g, "●");
    }
    return passportNumber;
  };

  if (!user || user.role !== UserRole.APPLICANT) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-mono font-bold text-white mb-2 uppercase">
              ОШИБКА ДОСТУПА
            </h2>
            <p className="text-slate-300 font-mono">ДОСТУП ТОЛЬКО ДЛЯ АБИТУРИЕНТОВ</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent"></div>
            <span className="ml-3 text-slate-300 font-mono">ЗАГРУЗКА ПРОФИЛЯ...</span>
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = getProfileCompletionPercentage();
  const selectedDirection = getSelectedDirection();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 border-b-2 border-slate-700 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <User className="h-8 w-8 text-green-400" />
                <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                  МОЙ ПРОФИЛЬ АБИТУРИЕНТА
                </h1>
              </div>
              <p className="text-slate-300 font-mono uppercase">
                АНКЕТНЫЕ ДАННЫЕ ДЛЯ УЧАСТИЯ В ТЕСТИРОВАНИИ
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-800 border-2 border-slate-600 font-mono font-bold uppercase"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                ОБНОВИТЬ
              </button>

              {!isEditing && profile && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-blue-200 border-2 border-blue-600 font-mono font-bold uppercase"
                >
                  <Edit className="h-4 w-4" />
                  РЕДАКТИРОВАТЬ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Статус профиля */}
        <div className="mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-400" />
                СТАТУС ПРОФИЛЯ
              </h3>
              <div className="flex items-center gap-2">
                {profile?.isProfileComplete ? (
                  <span className="px-3 py-1 text-sm font-mono font-bold bg-green-800 text-green-200 border-2 border-green-600 uppercase">
                    <CheckCircle className="inline h-4 w-4 mr-1" />
                    ЗАПОЛНЕН
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-mono font-bold bg-yellow-800 text-yellow-200 border-2 border-yellow-600 uppercase">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    ТРЕБУЕТ ЗАПОЛНЕНИЯ
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-mono font-bold text-slate-300 uppercase">
                    ЗАПОЛНЕНО ПОЛЕЙ:
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-3 border-2 border-slate-600">
                  <div
                    className={`h-full ${
                      completionPercentage === 100 ? 'bg-green-500' : 
                      completionPercentage >= 70 ? 'bg-blue-500' : 
                      completionPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {!profile?.isProfileComplete && (
                <div className="bg-orange-900 border-2 border-orange-600 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-mono font-bold text-orange-200 mb-1 uppercase">
                        ВНИМАНИЕ!
                      </h4>
                      <p className="text-sm text-orange-300 font-mono">
                        ДЛЯ ПРОХОЖДЕНИЯ ТЕСТОВ НЕОБХОДИМО ПОЛНОСТЬЮ ЗАПОЛНИТЬ АНКЕТУ.
                        НЕЗАПОЛНЕННЫЙ ПРОФИЛЬ ОГРАНИЧИВАЕТ ДОСТУП К ТЕСТИРОВАНИЮ.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Основная форма */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Основная информация */}
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <h3 className="text-lg font-mono font-bold text-white mb-6 uppercase border-b border-slate-600 pb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              I. ОСНОВНАЯ ИНФОРМАЦИЯ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  ФАМИЛИЯ *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
                    placeholder="ВВЕДИТЕ ФАМИЛИЮ"
                    required
                  />
                ) : (
                  <div className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono">
                    {formData.lastName || "НЕ УКАЗАНО"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  ИМЯ *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
                    placeholder="ВВЕДИТЕ ИМЯ"
                    required
                  />
                ) : (
                  <div className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono">
                    {formData.firstName || "НЕ УКАЗАНО"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  ОТЧЕСТВО
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
                    placeholder="ВВЕДИТЕ ОТЧЕСТВО (ЕСЛИ ЕСТЬ)"
                  />
                ) : (
                  <div className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono">
                    {formData.middleName || "НЕ УКАЗАНО"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  ДАТА РОЖДЕНИЯ *
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                    required
                  />
                ) : (
                  <div className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDate(formData.birthDate)}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  ГРАЖДАНСТВО *
                </label>
                {isEditing ? (
                  <select
                    name="citizenship"
                    value={formData.citizenship}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                    required
                  >
                    <option value="Российская Федерация">КЫРГЫЗСКАЯ РЕСПУБЛИКА</option>
                    <option value="Иностранное">ИНОСТРАННОЕ ГРАЖДАНСТВО</option>
                  </select>
                ) : (
                  <div className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono">
                    {formData.citizenship || "НЕ УКАЗАНО"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Паспортные данные */}
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono font-bold text-white uppercase border-b border-slate-600 pb-2 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-400" />
                II. ПАСПОРТНЫЕ ДАННЫЕ
              </h3>
              
              {!isEditing && formData.passportNumber && (
                <button
                  type="button"
                  onClick={() => setShowPassport(!showPassport)}
                  className="flex items-center gap-2 px-3 py-1 text-xs text-slate-300 border border-slate-600 font-mono uppercase"
                >
                  {showPassport ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPassport ? "СКРЫТЬ" : "ПОКАЗАТЬ"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  СЕРИЯ И НОМЕР ПАСПОРТА *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="passportNumber"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                    placeholder="1234 567890"
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400"
                    required
                  />
                ) : (
                  <div className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono">
                    {formData.passportNumber ? formatPassport(formData.passportNumber) : "НЕ УКАЗАНО"}
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-400 font-mono">
                  ФОРМАТ: 4 ЦИФРЫ ПРОБЕЛ 6 ЦИФР
                </p>
              </div>

              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  ДАТА ВЫДАЧИ *
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="passportIssueDate"
                    value={formData.passportIssueDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                    required
                  />
                ) : (
                  <div className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono">
                    {formatDate(formData.passportIssueDate)}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  КЕМ ВЫДАН *
                </label>
                {isEditing ? (
                  <textarea
                    name="passportIssuedBy"
                    value={formData.passportIssuedBy}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
                    placeholder="УКАЖИТЕ ОРГАН, ВЫДАВШИЙ ПАСПОРТ"
                    required
                  />
                ) : (
                  <div className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono min-h-[60px]">
                    {formData.passportIssuedBy || "НЕ УКАЗАНО"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Контактная информация */}
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <h3 className="text-lg font-mono font-bold text-white mb-6 uppercase border-b border-slate-600 pb-2 flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-400" />
              III. КОНТАКТНАЯ ИНФОРМАЦИЯ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  НОМЕР ТЕЛЕФОНА *
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400"
                    required
                  />
                ) : (
                  <div className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {formData.phone || "НЕ УКАЗАНО"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  EMAIL АДРЕС
                </label>
                <div className="px-3 py-2 border-2 border-slate-600 bg-slate-600 text-slate-300 font-mono flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {user.email}
                  <span className="text-xs bg-slate-500 px-2 py-1 uppercase">СИСТЕМНЫЙ</span>
                </div>
                <p className="mt-1 text-xs text-slate-400 font-mono">
                  EMAIL НЕЛЬЗЯ ИЗМЕНИТЬ - ИСПОЛЬЗУЕТСЯ ДЛЯ ВХОДА В СИСТЕМУ
                </p>
              </div>
            </div>
          </div>

          {/* Направление подготовки */}
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <h3 className="text-lg font-mono font-bold text-white mb-6 uppercase border-b border-slate-600 pb-2 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-400" />
              IV. НАПРАВЛЕНИЕ ПОДГОТОВКИ
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  ВЫБРАННОЕ НАПРАВЛЕНИЕ *
                </label>
                {isEditing ? (
                  <select
                    name="directionId"
                    value={formData.directionId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                    required
                  >
                    <option value="">ВЫБЕРИТЕ НАПРАВЛЕНИЕ ПОДГОТОВКИ</option>
                    {directions.map((direction) => (
                      <option key={direction.$id} value={direction.$id}>
                        {direction.name} ({direction.code}) - {direction.institute?.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono">
                    {selectedDirection ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-purple-400" />
                          <span className="font-bold">{selectedDirection.name}</span>
                          <span className="text-slate-400">({selectedDirection.code})</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Building className="h-4 w-4" />
                          <span>{selectedDirection.institute?.name}</span>
                        </div>
                        {selectedDirection.description && (
                          <p className="text-sm text-slate-300 mt-2">
                            {selectedDirection.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      "НАПРАВЛЕНИЕ НЕ ВЫБРАНО"
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          {isEditing && (
            <div className="flex gap-4 pt-6 border-t-2 border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // Восстанавливаем исходные данные
                  if (profile) {
                    setFormData({
                      firstName: profile.firstName || "",
                      lastName: profile.lastName || "",
                      middleName: profile.middleName || "",
                      birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : "",
                      passportNumber: profile.passportNumber || "",
                      passportIssueDate: profile.passportIssueDate ? new Date(profile.passportIssueDate).toISOString().split('T')[0] : "",
                      passportIssuedBy: profile.passportIssuedBy || "",
                      citizenship: profile.citizenship || "Российская Федерация",
                      phone: profile.phone || "",
                      directionId: profile.directionId || "",
                    });
                  }
                }}
                className="flex-1 px-6 py-3 text-slate-300 bg-slate-700 border-2 border-slate-600 font-mono font-bold uppercase"
              >
                ОТМЕНА
              </button>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending || createProfileMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-green-200 bg-green-800 border-2 border-green-600 disabled:opacity-50 font-mono font-bold uppercase"
              >
                <Save className="h-4 w-4" />
                {updateProfileMutation.isPending || createProfileMutation.isPending ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ ПРОФИЛЬ"}
              </button>
            </div>
          )}
        </form>

        {/* Информационная панель */}
        <div className="mt-8 bg-blue-900 border-2 border-blue-600 p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-mono font-bold text-blue-200 mb-2 uppercase">
                БЕЗОПАСНОСТЬ И КОНФИДЕНЦИАЛЬНОСТЬ
              </h3>
              <ul className="text-sm text-blue-300 font-mono space-y-1">
                <li>• ВСЕ ПЕРСОНАЛЬНЫЕ ДАННЫЕ ЗАЩИЩЕНЫ И ИСПОЛЬЗУЮТСЯ ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ</li>
                <li>• ПАСПОРТНЫЕ ДАННЫЕ СКРЫТЫ ПО УМОЛЧАНИЮ И ДОСТУПНЫ ТОЛЬКО ВАМ</li>
                <li>• ПРОФИЛЬ МОЖНО РЕДАКТИРОВАТЬ В ЛЮБОЕ ВРЕМЯ</li>
                <li>• ЗАПОЛНЕННЫЙ ПРОФИЛЬ НЕОБХОДИМ ДЛЯ ДОСТУПА К ТЕСТАМ</li>
                <li>• ПРИ ВОЗНИКНОВЕНИИ ПРОБЛЕМ ОБРАТИТЕСЬ К КУРАТОРУ</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Статистика профиля */}
        {profile && (
          <div className="mt-8 bg-slate-800 border-2 border-slate-600 p-6">
            <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase border-b border-slate-600 pb-2 flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-400" />
              ИНФОРМАЦИЯ О ПРОФИЛЕ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                  СИСТЕМНЫЕ ДАННЫЕ:
                </h4>
                <div className="space-y-2 text-sm text-slate-300 font-mono">
                  <div className="flex justify-between border-b border-slate-700 pb-1">
                    <span>СОЗДАН:</span>
                    <span className="font-bold text-white">
                      {formatDate(profile.$createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-1">
                    <span>ОБНОВЛЕН:</span>
                    <span className="font-bold text-white">
                      {profile.updatedAt ? formatDate(profile.updatedAt) : "НЕ ОБНОВЛЯЛСЯ"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-1">
                    <span>ID ПРОФИЛЯ:</span>
                    <span className="font-bold text-white text-xs">
                      {profile.$id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                  СТАТУС ЗАПОЛНЕНИЯ:
                </h4>
                <div className="space-y-2 text-sm text-slate-300 font-mono">
                  <div className="flex justify-between border-b border-slate-700 pb-1">
                    <span>ЗАПОЛНЕНО:</span>
                    <span className="font-bold text-white">{completionPercentage}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-1">
                    <span>СТАТУС:</span>
                    <span className={`font-bold ${profile.isProfileComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                      {profile.isProfileComplete ? 'ЗАВЕРШЕН' : 'ТРЕБУЕТ ЗАПОЛНЕНИЯ'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-1">
                    <span>ДОСТУП К ТЕСТАМ:</span>
                    <span className={`font-bold ${profile.isProfileComplete ? 'text-green-400' : 'text-red-400'}`}>
                      {profile.isProfileComplete ? 'РАЗРЕШЕН' : 'ОГРАНИЧЕН'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                  РЕКОМЕНДАЦИИ:
                </h4>
                <div className="space-y-1 text-sm text-slate-300 font-mono">
                  {!profile.isProfileComplete && (
                    <>
                      <div className="text-yellow-400">• ЗАПОЛНИТЕ ВСЕ ОБЯЗАТЕЛЬНЫЕ ПОЛЯ</div>
                      <div className="text-yellow-400">• ПРОВЕРЬТЕ ПРАВИЛЬНОСТЬ ДАННЫХ</div>
                    </>
                  )}
                  {profile.isProfileComplete && (
                    <>
                      <div className="text-green-400">• ПРОФИЛЬ ЗАПОЛНЕН ПОЛНОСТЬЮ</div>
                      <div className="text-green-400">• МОЖЕТЕ ПРОХОДИТЬ ТЕСТЫ</div>
                    </>
                  )}
                  <div className="text-blue-400">• РЕГУЛЯРНО ПРОВЕРЯЙТЕ АКТУАЛЬНОСТЬ</div>
                  <div className="text-blue-400">• ОБРАЩАЙТЕСЬ К КУРАТОРАМ ПРИ ВОПРОСАХ</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}