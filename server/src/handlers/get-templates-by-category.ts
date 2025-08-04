
import { db } from '../db';
import { templatesTable } from '../db/schema';
import { type GetTemplatesByCategoryInput, type Template } from '../schema';
import { eq } from 'drizzle-orm';

export const getTemplatesByCategory = async (input: GetTemplatesByCategoryInput): Promise<Template[]> => {
  try {
    // Build the base query
    const baseQuery = db.select().from(templatesTable);

    // Apply category filter
    const filteredQuery = baseQuery.where(eq(templatesTable.category_id, input.category_id));

    // Apply pagination with defaults
    const limit = input.limit || 20;
    const offset = input.offset || 0;
    const finalQuery = filteredQuery.limit(limit).offset(offset);

    const results = await finalQuery.execute();

    // Convert numeric fields and ensure proper typing
    return results.map(template => ({
      ...template,
      price: template.price ? parseFloat(template.price) : null,
      template_data: template.template_data as Record<string, any>
    }));
  } catch (error) {
    console.error('Failed to get templates by category:', error);
    throw error;
  }
};
