"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSuccess(true);
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-h2 font-bold text-black mb-2">Email Enviado!</h2>
          <p className="text-body text-gray mb-8">
            Enviamos instruções para recuperação de senha. Verifique sua caixa de entrada.
          </p>
          <Link href="/login" className="btn-primary inline-flex items-center justify-center gap-2 px-6">
            Voltar para login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-6">
        <Link href="/login" className="inline-flex items-center gap-2 text-gray">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-body">Voltar</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-black font-bold text-xl">P</span>
            </div>
            <div>
              <h1 className="text-h2 font-bold text-black">Recuperar Senha</h1>
              <p className="text-small text-gray">Sistema de Gestão</p>
            </div>
          </div>

          <p className="text-body text-gray mb-6">
            Informe o email cadastrado para receber instruções de recuperação.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-small text-gray mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  className="w-full h-14 pl-12 pr-4 bg-surface rounded-xl text-body text-black placeholder:text-gray border border-gray-light focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 active-scale transition-all"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Enviar instruções"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
