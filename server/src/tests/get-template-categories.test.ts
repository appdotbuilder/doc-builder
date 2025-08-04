
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { templateCategoriesTable } from '../db/schema';
import { getTemplateCategories } from '../handlers/get-template-categories';

describe('getTemplateCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getTemplateCategories();
    expect(result).toEqual([]);
  });

  it('should fetch all template categories', async () => {
    // Create test categories
    await db.insert(templateCategoriesTable)
      .values([
        {
          name: 'Business',
          slug: 'business',
          description: 'Business documents',
          icon_url: 'business-icon.svg',
          sort_order: 1
        },
        {
          name: 'Personal',
          slug: 'personal',
          description: 'Personal documents',
          icon_url: 'personal-icon.svg',
          sort_order: 2
        }
      ])
      .execute();

    const result = await getTemplateCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Business');
    expect(result[0].slug).toEqual('business');
    expect(result[0].description).toEqual('Business documents');
    expect(result[0].icon_url).toEqual('business-icon.svg');
    expect(result[0].sort_order).toEqual(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Personal');
    expect(result[1].slug).toEqual('personal');
  });

  it('should return categories ordered by sort_order', async () => {
    // Create categories with different sort orders
    await db.insert(templateCategoriesTable)
      .values([
        {
          name: 'Real Estate',
          slug: 'real-estate',
          sort_order: 3
        },
        {
          name: 'Business',
          slug: 'business',
          sort_order: 1
        },
        {
          name: 'Personal',
          slug: 'personal',
          sort_order: 2
        }
      ])
      .execute();

    const result = await getTemplateCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Business');
    expect(result[0].sort_order).toEqual(1);
    expect(result[1].name).toEqual('Personal');
    expect(result[1].sort_order).toEqual(2);
    expect(result[2].name).toEqual('Real Estate');
    expect(result[2].sort_order).toEqual(3);
  });

  it('should handle categories with null optional fields', async () => {
    // Create category with minimal required fields
    await db.insert(templateCategoriesTable)
      .values({
        name: 'Legal',
        slug: 'legal',
        sort_order: 1
        // description and icon_url are null
      })
      .execute();

    const result = await getTemplateCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Legal');
    expect(result[0].slug).toEqual('legal');
    expect(result[0].description).toBeNull();
    expect(result[0].icon_url).toBeNull();
    expect(result[0].sort_order).toEqual(1);
  });
});
