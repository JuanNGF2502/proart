"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { registerSchema, type RegisterInput } from "@/shared/validators/schemas";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: false,
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    const result = await signUp(data.email, data.password, data.name);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirme seu email</h2>
          <p className="text-gray-500 mb-8">
            Enviamos um link de confirmação para seu email.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-primary font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="pt-20 px-6 safe-area-top">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Link href="/login" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Criar Conta</h1>
            <p className="text-sm text-gray-500">PROART</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Cadastre-se</h2>
          <p className="text-gray-500 mb-8">Preencha seus dados para criar uma conta</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-500 mt-2">{errors.name.message}</p>
              )}
            </div>

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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full h-14 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 active-scale hover:bg-gray-800 transition-all mt-2 shadow-lg shadow-gray-900/20 disabled:opacity-50"
            >
              {isLoading || authLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Criar conta
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Já tem conta?{" "}
              <a href="/login" className="font-medium text-primary hover:text-primary-dark">
                Entrar
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}