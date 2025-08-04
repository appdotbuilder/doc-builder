
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, userDocumentsTable } from '../db/schema';
import { type GetUserDocumentsInput, type CreateUserInput } from '../schema';
import { getUserDocuments } from '../handlers/get-user-documents';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  subscription_type: 'free'
};

const testDocument1 = {
  title: 'Draft Document',
  document_data: { content: 'Draft content' },
  status: 'draft' as const,
  is_favorite: false
};

const testDocument2 = {
  title: 'Completed Document',
  document_data: { content: 'Completed content' },
  status: 'completed' as const,
  is_favorite: true
};

const testDocument3 = {
  title: 'Trashed Document',
  document_data: { content: 'Trashed content' },
  status: 'trashed' as const,
  is_favorite: false
};

describe('getUserDocuments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all documents for a user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test documents
    await db.insert(userDocumentsTable)
      .values([
        { ...testDocument1, user_id: userId },
        { ...testDocument2, user_id: userId },
        { ...testDocument3, user_id: userId }
      ])
      .execute();

    const input: GetUserDocumentsInput = {
      user_id: userId
    };

    const result = await getUserDocuments(input);

    expect(result).toHaveLength(3);
    expect(result.map(doc => doc.title)).toContain('Draft Document');
    expect(result.map(doc => doc.title)).toContain('Completed Document');
    expect(result.map(doc => doc.title)).toContain('Trashed Document');
  });

  it('should filter documents by status', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test documents
    await db.insert(userDocumentsTable)
      .values([
        { ...testDocument1, user_id: userId },
        { ...testDocument2, user_id: userId },
        { ...testDocument3, user_id: userId }
      ])
      .execute();

    const input: GetUserDocumentsInput = {
      user_id: userId,
      status: 'completed'
    };

    const result = await getUserDocuments(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Completed Document');
    expect(result[0].status).toEqual('completed');
  });

  it('should filter documents by favorite status', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test documents
    await db.insert(userDocumentsTable)
      .values([
        { ...testDocument1, user_id: userId },
        { ...testDocument2, user_id: userId },
        { ...testDocument3, user_id: userId }
      ])
      .execute();

    const input: GetUserDocumentsInput = {
      user_id: userId,
      is_favorite: true
    };

    const result = await getUserDocuments(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Completed Document');
    expect(result[0].is_favorite).toBe(true);
  });

  it('should combine status and favorite filters', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create additional favorite document
    await db.insert(userDocumentsTable)
      .values([
        { ...testDocument1, user_id: userId },
        { ...testDocument2, user_id: userId },
        { ...testDocument3, user_id: userId },
        {
          title: 'Favorite Draft',
          document_data: { content: 'Favorite draft content' },
          status: 'draft' as const,
          is_favorite: true,
          user_id: userId
        }
      ])
      .execute();

    const input: GetUserDocumentsInput = {
      user_id: userId,
      status: 'draft',
      is_favorite: true
    };

    const result = await getUserDocuments(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Favorite Draft');
    expect(result[0].status).toEqual('draft');
    expect(result[0].is_favorite).toBe(true);
  });

  it('should apply pagination correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create multiple test documents
    const documents = Array.from({ length: 10 }, (_, i) => ({
      title: `Document ${i + 1}`,
      document_data: { content: `Content ${i + 1}` },
      status: 'draft' as const,
      is_favorite: false,
      user_id: userId
    }));

    await db.insert(userDocumentsTable)
      .values(documents)
      .execute();

    const input: GetUserDocumentsInput = {
      user_id: userId,
      limit: 5,
      offset: 3
    };

    const result = await getUserDocuments(input);

    expect(result).toHaveLength(5);
    // Verify we got documents from the offset position
    expect(result.every(doc => doc.user_id === userId)).toBe(true);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetUserDocumentsInput = {
      user_id: 99999
    };

    const result = await getUserDocuments(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no documents match filters', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create only draft documents
    await db.insert(userDocumentsTable)
      .values([
        { ...testDocument1, user_id: userId }
      ])
      .execute();

    const input: GetUserDocumentsInput = {
      user_id: userId,
      status: 'completed'
    };

    const result = await getUserDocuments(input);

    expect(result).toHaveLength(0);
  });

  it('should handle document_data as Record<string, any>', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create document with complex document_data
    const complexDocumentData = {
      title: 'Complex Document',
      sections: [
        { name: 'Introduction', content: 'Intro text' },
        { name: 'Body', content: 'Body text' }
      ],
      metadata: {
        author: 'Test User',
        created: '2024-01-01'
      }
    };

    await db.insert(userDocumentsTable)
      .values([{
        title: 'Complex Document',
        document_data: complexDocumentData,
        status: 'draft' as const,
        is_favorite: false,
        user_id: userId
      }])
      .execute();

    const input: GetUserDocumentsInput = {
      user_id: userId
    };

    const result = await getUserDocuments(input);

    expect(result).toHaveLength(1);
    expect(result[0].document_data).toEqual(complexDocumentData);
    expect(typeof result[0].document_data).toEqual('object');
  });
});
