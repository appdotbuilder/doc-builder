
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { templatesTable, templateCategoriesTable } from '../db/schema';
import { getTemplateById } from '../handlers/get-template-by-id';

describe('getTemplateById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a template by id', async () => {
    // Create prerequisite category first
    const categoryResult = await db.insert(templateCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category description',
        sort_order: 1
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create template
    const templateData = {
      title: 'Test Template',
      description: 'A template for testing',
      category_id: categoryId,
      template_data: { fields: ['name', 'email'], layout: 'standard' },
      preview_url: 'https://example.com/preview.png',
      is_premium: true,
      price: '29.99',
      downloads_count: 50
    };

    const insertResult = await db.insert(templatesTable)
      .values(templateData)
      .returning()
      .execute();

    const templateId = insertResult[0].id;

    // Test the handler
    const result = await getTemplateById(templateId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(templateId);
    expect(result!.title).toEqual('Test Template');
    expect(result!.description).toEqual('A template for testing');
    expect(result!.category_id).toEqual(categoryId);
    expect(result!.template_data).toEqual({ fields: ['name', 'email'], layout: 'standard' });
    expect(result!.preview_url).toEqual('https://example.com/preview.png');
    expect(result!.is_premium).toEqual(true);
    expect(result!.price).toEqual(29.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.downloads_count).toEqual(50);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent template', async () => {
    const result = await getTemplateById(999);
    expect(result).toBeNull();
  });

  it('should handle template with null price', async () => {
    // Create prerequisite category first
    const categoryResult = await db.insert(templateCategoriesTable)
      .values({
        name: 'Free Category',
        slug: 'free-category',
        description: 'Free templates',
        sort_order: 1
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create free template with null price
    const templateData = {
      title: 'Free Template',
      description: 'A free template',
      category_id: categoryId,
      template_data: { type: 'basic' },
      is_premium: false,
      price: null,
      downloads_count: 100
    };

    const insertResult = await db.insert(templatesTable)
      .values(templateData)
      .returning()
      .execute();

    const templateId = insertResult[0].id;

    // Test the handler
    const result = await getTemplateById(templateId);

    expect(result).not.toBeNull();
    expect(result!.price).toBeNull();
    expect(result!.is_premium).toEqual(false);
    expect(result!.title).toEqual('Free Template');
  });
});
