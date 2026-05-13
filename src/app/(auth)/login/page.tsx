"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { loginSchema, type LoginInput } from "@/shared/validators/schemas";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/shared/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (data.email === "admin@proart.com.br" && data.password === "admin123") {
      const foundUser = {
        id: "1",
        name: "Administrador",
        email: "admin@proart.com.br",
        role: "admin" as const,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      login(foundUser, "demo-token-" + Date.now());
      document.cookie = `proart-token=demo-token-${Date.now()}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `proart-user=${JSON.stringify(foundUser)}; path=/; max-age=${60 * 60 * 24 * 7}`;
      router.push("/dashboard");
    } else {
      alert("Credenciais inválidas");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="pt-20 px-6 safe-area-top">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-gray-900 font-bold text-2xl">P</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PROART</h1>
            <p className="text-sm text-gray-500">Sistema de Gestão</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo</h2>
          <p className="text-gray-500 mb-8">Entre com suas credenciais para continuar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="seu@email.com.br"
                  className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 mt-2">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-12 bg-white rounded-2xl text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-2">{errors.password.message}</p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20"
                  {...register("rememberMe")}
                />
                <span className="text-sm text-gray-600">Lembrar-me</span>
              </label>
              <a href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-dark">
                Esqueceu senha?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 active-scale hover:bg-gray-800 transition-all mt-2 shadow-lg shadow-gray-900/20"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Demo: <span className="font-medium text-gray-700">admin@proart.com.br</span> / <span className="font-medium text-gray-700">admin123</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}