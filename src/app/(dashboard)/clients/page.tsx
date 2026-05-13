"use client";

import { useState } from "react";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import { Plus, Search, Phone, Mail, ChevronRight, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { useClients } from "@/hooks";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const { clients, loading, error } = useClients();

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contact_name && c.contact_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <Header
        title="Clientes"
        description={`${clients.length} clientes`}
        actions={
          <Link href="/clients/new" className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Plus className="h-5 w-5 text-white" />
          </Link>
        }
      />

      <div className="p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clientes..."
            className="input pl-12"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Erro ao carregar clientes: {error}</p>
          </div>
        )}

        {/* Clients List */}
        {!loading && !error && (
          <div className="space-y-3">
            {filteredClients.map((client, index) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="card flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-gray-900">{client.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900">{client.name}</p>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{client.contact_name || client.email}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </span>
                      )}
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                      client.status === 'vip' ? 'bg-amber-100 text-amber-700' :
                      client.status === 'recorrente' ? 'bg-blue-100 text-blue-700' :
                      client.status === 'inadimplente' ? 'bg-red-100 text-red-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {client.status === 'vip' ? 'VIP' :
                       client.status === 'recorrente' ? 'Recorrente' :
                       client.status === 'inadimplente' ? 'Inadimplente' : 'Ativo'}
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredClients.length === 0 && (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
