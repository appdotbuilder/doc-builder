
import { db } from '../db';
import { templatesTable } from '../db/schema';
import { type Template } from '../schema';
import { eq } from 'drizzle-orm';

export const getTemplateById = async (id: number): Promise<Template | null> => {
  try {
    const results = await db.select()
      .from(templatesTable)
      .where(eq(templatesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const template = results[0];
    return {
      ...template,
      price: template.price ? parseFloat(template.price) : null,
      template_data: template.template_data as Record<string, any>
    };
  } catch (error) {
    console.error('Template fetch failed:', error);
    throw error;
  }
};
