
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, userDocumentsTable } from '../db/schema';
import { type CreateUserInput, type CreateUserDocumentInput, type UpdateUserDocumentInput } from '../schema';
import { updateUserDocument } from '../handlers/update-user-document';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User'
};

const testDocument: CreateUserDocumentInput = {
  user_id: 1, // Will be set after user creation
  title: 'Original Document',
  document_data: { field1: 'value1', field2: 'value2' },
  status: 'draft'
};

describe('updateUserDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update document title', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name
      })
      .returning()
      .execute();

    // Create document
    const docResult = await db.insert(userDocumentsTable)
      .values({
        ...testDocument,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateUserDocumentInput = {
      id: docResult[0].id,
      title: 'Updated Document Title'
    };

    const result = await updateUserDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Updated Document Title');
    expect(result!.document_data).toEqual(testDocument.document_data);
    expect(result!.status).toEqual('draft');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update document data', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name
      })
      .returning()
      .execute();

    // Create document
    const docResult = await db.insert(userDocumentsTable)
      .values({
        ...testDocument,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const newDocumentData = { field1: 'updated_value1', field3: 'new_value' };
    const updateInput: UpdateUserDocumentInput = {
      id: docResult[0].id,
      document_data: newDocumentData
    };

    const result = await updateUserDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.document_data).toEqual(newDocumentData);
    expect(result!.title).toEqual('Original Document');
  });

  it('should update document status', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name
      })
      .returning()
      .execute();

    // Create document
    const docResult = await db.insert(userDocumentsTable)
      .values({
        ...testDocument,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateUserDocumentInput = {
      id: docResult[0].id,
      status: 'completed'
    };

    const result = await updateUserDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('completed');
    expect(result!.title).toEqual('Original Document');
  });

  it('should update is_favorite flag', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name
      })
      .returning()
      .execute();

    // Create document
    const docResult = await db.insert(userDocumentsTable)
      .values({
        ...testDocument,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateUserDocumentInput = {
      id: docResult[0].id,
      is_favorite: true
    };

    const result = await updateUserDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.is_favorite).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name
      })
      .returning()
      .execute();

    // Create document
    const docResult = await db.insert(userDocumentsTable)
      .values({
        ...testDocument,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateUserDocumentInput = {
      id: docResult[0].id,
      title: 'Multi-Update Title',
      status: 'completed',
      is_favorite: true,
      document_data: { updated: 'data' }
    };

    const result = await updateUserDocument(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Multi-Update Title');
    expect(result!.status).toEqual('completed');
    expect(result!.is_favorite).toBe(true);
    expect(result!.document_data).toEqual({ updated: 'data' });
  });

  it('should save changes to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name
      })
      .returning()
      .execute();

    // Create document
    const docResult = await db.insert(userDocumentsTable)
      .values({
        ...testDocument,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateUserDocumentInput = {
      id: docResult[0].id,
      title: 'Database Updated Title'
    };

    await updateUserDocument(updateInput);

    // Verify changes in database
    const documents = await db.select()
      .from(userDocumentsTable)
      .where(eq(userDocumentsTable.id, docResult[0].id))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].title).toEqual('Database Updated Title');
    expect(documents[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent document', async () => {
    const updateInput: UpdateUserDocumentInput = {
      id: 999,
      title: 'Non-existent Document'
    };

    const result = await updateUserDocument(updateInput);

    expect(result).toBeNull();
  });
});
