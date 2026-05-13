"use client";

import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import { Bell, Check, Clock, Package, Receipt, MapPin } from "lucide-react";

const notifications = [
  { id: "1", type: "new_order", title: "Novo Pedido", message: "Academia Strong fez novo pedido de R$ 3.400", read: false, time: "14:30" },
  { id: "2", type: "delay", title: "Pedido Atrasado", message: "Pedido #001 com prazo comprometido", read: false, time: "10:00" },
  { id: "3", type: "approved", title: "Aprovado", message: "Orçamento #002 aprovado", read: true, time: "16:45" },
  { id: "4", type: "completed", title: "Concluído", message: "Produção do pedido #006 finalizada", read: true, time: "12:00" },
];

const typeConfig: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  new_order: { icon: Package, bg: "bg-blue-100", color: "text-blue-600" },
  delay: { icon: Clock, bg: "bg-red-100", color: "text-red-600" },
  approved: { icon: Receipt, bg: "bg-emerald-100", color: "text-emerald-600" },
  completed: { icon: Check, bg: "bg-emerald-100", color: "text-emerald-600" },
};

export default function NotificationsPage() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout>
      <Header
        title="Notificações"
        description={`${unreadCount} não lidas`}
      />

      <div className="p-5 space-y-3">
        {notifications.map((notification, index) => {
          const config = typeConfig[notification.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`card flex gap-4 cursor-pointer hover:shadow-md transition-shadow ${!notification.read ? "border-l-4 border-l-primary" : ""}`}
            >
              <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{notification.title}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{notification.time}</span>
                </div>
                <p className="text-sm text-gray-500">{notification.message}</p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </motion.div>
          );
        })}

        {notifications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Nenhuma notificação</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}