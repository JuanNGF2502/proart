"use client";

import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import { User, Palette, Bell, Shield, LogOut, ChevronRight, Mail, Phone, MapPin, CreditCard } from "lucide-react";
import { useAuthStore } from "@/shared/store/auth-store";

const settingsSections = [
  {
    category: "Conta",
    icon: User,
    items: [
      { label: "Nome", value: "Administrador" },
      { label: "Email", value: "admin@proart.com.br" },
      { label: "Telefone", value: "(11) 99999-9999" },
    ],
  },
  {
    category: "Notificações",
    icon: Bell,
    items: [
      { label: "Novos Pedidos", value: "Ativado" },
      { label: "Atrasos", value: "Ativado" },
      { label: "Orçamentos", value: "Ativado" },
    ],
  },
  {
    category: "Preferências",
    icon: Palette,
    items: [
      { label: "Tema", value: "Claro" },
      { label: "Modo de acesso", value: "Padrão" },
    ],
  },
];

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout>
      <Header title="Configurações" />

      <div className="p-5 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <span className="text-gray-900 font-bold text-2xl">A</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user?.name || "Administrador"}</p>
            <p className="text-sm text-gray-500">{user?.email || "admin@proart.com.br"}</p>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {settingsSections.map((section, index) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card"
            >
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <section.icon className="h-5 w-5 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{section.category}</h3>
              </div>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-3 px-3 py-2 rounded-xl transition-colors">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full h-14 bg-red-500 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 active-scale hover:bg-red-600 transition-colors"
          onClick={() => {
            document.cookie = "proart-token=; path=/; max-age=0";
            document.cookie = "proart-user=; path=/; max-age=0";
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-5 w-5" />
          Sair da conta
        </motion.button>

        {/* Version */}
        <p className="text-center text-sm text-gray-400">PROART v1.0.0</p>
      </div>
    </DashboardLayout>
  );
}