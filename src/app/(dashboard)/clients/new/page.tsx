"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/shared/components/layouts";
import { Header } from "@/shared/components/layouts";
import { motion } from "framer-motion";
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Building2, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function NewClientPage() {
  const router = useRouter();
  const [client, setClient] = useState({
    name: "",
    contact_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    instagram: "",
    document: "",
    document_type: "" as "cpf" | "cnpj" | "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    notes: "",
    status: "ativo" as "ativo" | "recorrente" | "inadimplente" | "vip",
    preferred_contact: "whatsapp" as "whatsapp" | "telefone" | "email",
    delivery_preference: true,
    pickup_preference: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setClient((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!client.name) {
      setError("Preencha o nome do cliente.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: client.name,
          contact_name: client.contact_name,
          phone: client.phone,
          whatsapp: client.whatsapp,
          email: client.email,
          instagram: client.instagram,
          document: client.document,
          document_type: client.document_type || null,
          address: client.address,
          city: client.city,
          state: client.state?.toUpperCase(),
          zip_code: client.zip_code,
          notes: client.notes,
          status: client.status,
          preferred_contact: client.preferred_contact,
          delivery_preference: client.delivery_preference,
          pickup_preference: client.pickup_preference,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("timeline").insert({
        client_id: data.id,
        event_type: "client_created",
        title: "Cliente criado",
        description: client.name,
      });

      router.push(`/clients/${data.id}`);
    } catch (e: any) {
      setError(e.message || "Erro ao salvar cliente");
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Header
        title="Novo Cliente"
        description="Cadastrar novo cliente"
        actions={
          <Link href="/clients" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
        }
      />

      <div className="p-5 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Informações da Empresa</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nome da Empresa *</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome da empresa ou razão social"
                  value={client.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="input pl-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">CNPJ / CPF</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={client.document}
                    onChange={(e) => {
                      const doc = e.target.value;
                      handleChange("document", doc);
                      handleChange("document_type", doc.length > 14 ? "cnpj" : doc.length > 11 ? "cpf" : "");
                    }}
                    className="input pl-12"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Instagram</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    placeholder="empresa"
                    value={client.instagram?.replace("@", "")}
                    onChange={(e) => handleChange("instagram", `@${e.target.value}`)}
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <User className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Dados do Contato</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Nome do Contato</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome da pessoa de contato"
                  value={client.contact_name}
                  onChange={(e) => handleChange("contact_name", e.target.value)}
                  className="input pl-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={client.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="input pl-12"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={client.whatsapp}
                    onChange={(e) => handleChange("whatsapp", e.target.value)}
                    className="input pl-12"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="email@empresa.com"
                  value={client.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="input pl-12"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Address */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Endereço</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Endereço</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rua, número, bairro"
                  value={client.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="input pl-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Cidade</label>
                <input
                  type="text"
                  placeholder="Cidade"
                  value={client.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">UF</label>
                <input
                  type="text"
                  placeholder="SP"
                  maxLength={2}
                  value={client.state}
                  onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">CEP</label>
              <input
                type="text"
                placeholder="00000-000"
                value={client.zip_code}
                onChange={(e) => handleChange("zip_code", e.target.value)}
                className="input max-w-[200px]"
              />
            </div>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Observações</h3>
          <textarea
            placeholder="Adicione observações sobre o cliente..."
            value={client.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            className="w-full h-24 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-3">
          <button
            onClick={() => router.push("/clients")}
            className="flex-1 h-14 bg-gray-100 text-gray-700 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 h-14 bg-primary text-gray-900 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Cliente
              </>
            )}
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
