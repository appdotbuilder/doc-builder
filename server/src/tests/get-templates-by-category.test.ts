
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { templateCategoriesTable, templatesTable } from '../db/schema';
import { type GetTemplatesByCategoryInput } from '../schema';
import { getTemplatesByCategory } from '../handlers/get-templates-by-category';

describe('getTemplatesByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get templates for a specific category', async () => {
    // Create test category
    const categoryResult = await db.insert(templateCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category',
        sort_order: 1
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test templates in this category
    await db.insert(templatesTable)
      .values([
        {
          title: 'Template 1',
          description: 'First template',
          category_id: categoryId,
          template_data: { fields: ['name', 'date'] },
          preview_url: 'https://example.com/preview1.jpg',
          is_premium: false,
          price: null,
          downloads_count: 10
        },
        {
          title: 'Template 2',
          description: 'Second template',
          category_id: categoryId,
          template_data: { fields: ['title', 'content'] },
          preview_url: 'https://example.com/preview2.jpg',
          is_premium: true,
          price: '29.99',
          downloads_count: 5
        }
      ])
      .execute();

    // Create template in different category (should not be returned)
    const otherCategoryResult = await db.insert(templateCategoriesTable)
      .values({
        name: 'Other Category',
        slug: 'other-category',
        sort_order: 2
      })
      .returning()
      .execute();

    await db.insert(templatesTable)
      .values({
        title: 'Other Template',
        description: 'Template in other category',
        category_id: otherCategoryResult[0].id,
        template_data: { fields: ['other'] },
        is_premium: false,
        downloads_count: 0
      })
      .execute();

    const input: GetTemplatesByCategoryInput = {
      category_id: categoryId
    };

    const result = await getTemplatesByCategory(input);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Template 1');
    expect(result[0].category_id).toEqual(categoryId);
    expect(result[0].price).toBeNull();
    expect(result[0].downloads_count).toEqual(10);
    expect(result[1].title).toEqual('Template 2');
    expect(result[1].category_id).toEqual(categoryId);
    expect(result[1].price).toEqual(29.99);
    expect(typeof result[1].price).toEqual('number');
    expect(result[1].downloads_count).toEqual(5);
  });

  it('should return empty array for non-existent category', async () => {
    const input: GetTemplatesByCategoryInput = {
      category_id: 999
    };

    const result = await getTemplatesByCategory(input);

    expect(result).toHaveLength(0);
  });

  it('should handle pagination with limit', async () => {
    // Create test category
    const categoryResult = await db.insert(templateCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        sort_order: 1
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create 5 test templates
    const templateData = Array.from({ length: 5 }, (_, i) => ({
      title: `Template ${i + 1}`,
      description: `Template number ${i + 1}`,
      category_id: categoryId,
      template_data: { field: `value${i + 1}` },
      is_premium: false,
      downloads_count: i
    }));

    await db.insert(templatesTable)
      .values(templateData)
      .execute();

    const input: GetTemplatesByCategoryInput = {
      category_id: categoryId,
      limit: 3
    };

    const result = await getTemplatesByCategory(input);

    expect(result).toHaveLength(3);
    result.forEach(template => {
      expect(template.category_id).toEqual(categoryId);
    });
  });

  it('should handle pagination with offset', async () => {
    // Create test category
    const categoryResult = await db.insert(templateCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        sort_order: 1
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create 5 test templates
    const templateData = Array.from({ length: 5 }, (_, i) => ({
      title: `Template ${i + 1}`,
      description: `Template number ${i + 1}`,
      category_id: categoryId,
      template_data: { field: `value${i + 1}` },
      is_premium: false,
      downloads_count: i
    }));

    await db.insert(templatesTable)
      .values(templateData)
      .execute();

    const input: GetTemplatesByCategoryInput = {
      category_id: categoryId,
      limit: 2,
      offset: 2
    };

    const result = await getTemplatesByCategory(input);

    expect(result).toHaveLength(2);
    // Should get templates 3 and 4 (0-indexed: positions 2 and 3)
    expect(result[0].title).toEqual('Template 3');
    expect(result[1].title).toEqual('Template 4');
  });

  it('should handle templates with and without pricing correctly', async () => {
    // Create test category
    const categoryResult = await db.insert(templateCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        sort_order: 1
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create templates with different pricing scenarios
    await db.insert(templatesTable)
      .values([
        {
          title: 'Free Template',
          category_id: categoryId,
          template_data: { type: 'free' },
          is_premium: false,
          price: null,
          downloads_count: 100
        },
        {
          title: 'Premium Template',
          category_id: categoryId,
          template_data: { type: 'premium' },
          is_premium: true,
          price: '15.50',
          downloads_count: 25
        }
      ])
      .execute();

    const input: GetTemplatesByCategoryInput = {
      category_id: categoryId
    };

    const result = await getTemplatesByCategory(input);

    expect(result).toHaveLength(2);
    
    const freeTemplate = result.find(t => t.title === 'Free Template');
    const premiumTemplate = result.find(t => t.title === 'Premium Template');

    expect(freeTemplate).toBeDefined();
    expect(freeTemplate!.price).toBeNull();
    expect(freeTemplate!.is_premium).toBe(false);

    expect(premiumTemplate).toBeDefined();
    expect(premiumTemplate!.price).toEqual(15.50);
    expect(typeof premiumTemplate!.price).toEqual('number');
    expect(premiumTemplate!.is_premium).toBe(true);
  });

  it('should handle template_data as proper object', async () => {
    // Create test category
    const categoryResult = await db.insert(templateCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        sort_order: 1
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create template with complex template_data
    const complexTemplateData = {
      sections: ['header', 'body', 'footer'],
      fields: {
        header: { title: 'string', logo: 'image' },
        body: { content: 'text', items: 'list' }
      },
      styles: { color: '#000000', font: 'Arial' }
    };

    await db.insert(templatesTable)
      .values({
        title: 'Complex Template',
        category_id: categoryId,
        template_data: complexTemplateData,
        is_premium: true,
        price: '49.99',
        downloads_count: 15
      })
      .execute();

    const input: GetTemplatesByCategoryInput = {
      category_id: categoryId
    };

    const result = await getTemplatesByCategory(input);

    expect(result).toHaveLength(1);
    expect(result[0].template_data).toEqual(complexTemplateData);
    expect(result[0].template_data['sections']).toEqual(['header', 'body', 'footer']);
    expect(result[0].template_data['fields']['header']['title']).toEqual('string');
  });
});
