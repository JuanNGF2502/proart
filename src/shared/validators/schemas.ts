import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.boolean(),
}).refine((data) => data.password === "true" || data.confirmPassword === true, {
  message: "Confirme sua senha",
  path: ["confirmPassword"],
});

export const clientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  whatsapp: z.string().optional(),
  email: z.string().email("Email inválido").or(z.literal("")),
  cpfCnpj: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }),
  notes: z.string().optional(),
});

export const budgetItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  width: z.number().min(0.1, "Largura deve ser maior que 0"),
  height: z.number().min(0.1, "Altura deve ser maior que 0"),
  unit: z.enum(["cm", "m", "un", "pct"]),
  quantity: z.number().min(1, "Quantidade deve ser pelo menos 1"),
  material: z.string().optional(),
  finish: z.string().optional(),
  deadline: z.number().min(1, "Prazo deve ser pelo menos 1 dia").optional(),
  observations: z.string().optional(),
  unitPrice: z.number().min(0, "Preço unitário não pode ser negativo"),
  discount: z.number().min(0).max(100).optional(),
});

export const budgetSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  items: z.array(budgetItemSchema).min(1, "Adicione pelo menos 1 item"),
  observations: z.string().optional(),
  discount: z.number().min(0).max(100).optional(),
  freight: z.number().min(0).optional(),
  deposit: z.number().min(0).optional(),
  validity: z.number().min(1).max(365).optional(),
});

export const orderSchema = z.object({
  budgetId: z.string(),
  clientId: z.string(),
  items: z.array(budgetItemSchema),
  status: z.enum(["pending", "approved", "production", "printing", "finishing", "completed", "delivered"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  deadline: z.date(),
  observations: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "production", "attendance", "finance"]),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  category: z.string(),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  costPrice: z.number().min(0).optional(),
  unit: z.enum(["cm", "m", "un", "pct"]),
  productionTime: z.number().min(1).optional(),
  active: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type BudgetItemInput = z.infer<typeof budgetItemSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type ProductInput = z.infer<typeof productSchema>;
