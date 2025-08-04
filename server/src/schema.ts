
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  subscription_type: z.enum(['free', 'premium']),
  subscription_expires_at: z.coerce.date().nullable(),
  trial_ends_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Template category schema
export const templateCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  icon_url: z.string().nullable(),
  sort_order: z.number().int(),
  created_at: z.coerce.date()
});

export type TemplateCategory = z.infer<typeof templateCategorySchema>;

// Template schema
export const templateSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  category_id: z.number(),
  template_data: z.record(z.any()), // JSON field for template structure
  preview_url: z.string().nullable(),
  is_premium: z.boolean(),
  price: z.number().nullable(),
  downloads_count: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Template = z.infer<typeof templateSchema>;

// User document schema
export const userDocumentSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  template_id: z.number().nullable(),
  title: z.string(),
  document_data: z.record(z.any()), // JSON field for filled document data
  file_url: z.string().nullable(),
  file_type: z.enum(['pdf', 'doc', 'docx']).nullable(),
  status: z.enum(['draft', 'completed', 'trashed']),
  is_favorite: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserDocument = z.infer<typeof userDocumentSchema>;

// Purchase schema
export const purchaseSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  template_id: z.number().nullable(),
  purchase_type: z.enum(['subscription', 'individual_document']),
  amount: z.number(),
  currency: z.string(),
  payment_status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  payment_provider: z.string().nullable(),
  payment_provider_id: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Purchase = z.infer<typeof purchaseSchema>;

// Input schemas for creating/updating
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  avatar_url: z.string().nullable().optional(),
  subscription_type: z.enum(['free', 'premium']).optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  subscription_type: z.enum(['free', 'premium']).optional(),
  subscription_expires_at: z.coerce.date().nullable().optional(),
  trial_ends_at: z.coerce.date().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const createTemplateInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  category_id: z.number(),
  template_data: z.record(z.any()),
  preview_url: z.string().nullable().optional(),
  is_premium: z.boolean().optional(),
  price: z.number().nullable().optional()
});

export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;

export const createUserDocumentInputSchema = z.object({
  user_id: z.number(),
  template_id: z.number().nullable().optional(),
  title: z.string(),
  document_data: z.record(z.any()),
  file_type: z.enum(['pdf', 'doc', 'docx']).nullable().optional(),
  status: z.enum(['draft', 'completed', 'trashed']).optional()
});

export type CreateUserDocumentInput = z.infer<typeof createUserDocumentInputSchema>;

export const updateUserDocumentInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  document_data: z.record(z.any()).optional(),
  status: z.enum(['draft', 'completed', 'trashed']).optional(),
  is_favorite: z.boolean().optional()
});

export type UpdateUserDocumentInput = z.infer<typeof updateUserDocumentInputSchema>;

export const createPurchaseInputSchema = z.object({
  user_id: z.number(),
  template_id: z.number().nullable().optional(),
  purchase_type: z.enum(['subscription', 'individual_document']),
  amount: z.number().positive(),
  currency: z.string(),
  payment_provider: z.string().nullable().optional(),
  payment_provider_id: z.string().nullable().optional()
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseInputSchema>;

// Query input schemas
export const getTemplatesByCategoryInputSchema = z.object({
  category_id: z.number(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetTemplatesByCategoryInput = z.infer<typeof getTemplatesByCategoryInputSchema>;

export const getUserDocumentsInputSchema = z.object({
  user_id: z.number(),
  status: z.enum(['draft', 'completed', 'trashed']).optional(),
  is_favorite: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetUserDocumentsInput = z.infer<typeof getUserDocumentsInputSchema>;
