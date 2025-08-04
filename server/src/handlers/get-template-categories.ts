
import { db } from '../db';
import { templateCategoriesTable } from '../db/schema';
import { type TemplateCategory } from '../schema';
import { asc } from 'drizzle-orm';

export const getTemplateCategories = async (): Promise<TemplateCategory[]> => {
  try {
    const results = await db.select()
      .from(templateCategoriesTable)
      .orderBy(asc(templateCategoriesTable.sort_order))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch template categories:', error);
    throw error;
  }
};
