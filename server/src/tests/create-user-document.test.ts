
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, templatesTable, templateCategoriesTable, userDocumentsTable } from '../db/schema';
import { type CreateUserDocumentInput } from '../schema';
import { createUserDocument } from '../handlers/create-user-document';
import { eq } from 'drizzle-orm';

describe('createUserDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testTemplateId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(templateCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category'
      })
      .returning()
      .execute();

    // Create test template
    const templateResult = await db.insert(templatesTable)
      .values({
        title: 'Test Template',
        category_id: categoryResult[0].id,
        template_data: { field1: 'value1' }
      })
      .returning()
      .execute();
    testTemplateId = templateResult[0].id;
  });

  it('should create a user document with template', async () => {
    const testInput: CreateUserDocumentInput = {
      user_id: testUserId,
      template_id: testTemplateId,
      title: 'My Document',
      document_data: { field1: 'filled value', field2: 'another value' },
      file_type: 'pdf',
      status: 'draft'
    };

    const result = await createUserDocument(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.template_id).toEqual(testTemplateId);
    expect(result.title).toEqual('My Document');
    expect(result.document_data).toEqual({ field1: 'filled value', field2: 'another value' });
    expect(result.file_type).toEqual('pdf');
    expect(result.status).toEqual('draft');
    expect(result.is_favorite).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user document without template', async () => {
    const testInput: CreateUserDocumentInput = {
      user_id: testUserId,
      title: 'Uploaded Document',
      document_data: { content: 'uploaded content' },
      file_type: 'docx',
      status: 'completed'
    };

    const result = await createUserDocument(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.template_id).toBeNull();
    expect(result.title).toEqual('Uploaded Document');
    expect(result.document_data).toEqual({ content: 'uploaded content' });
    expect(result.file_type).toEqual('docx');
    expect(result.status).toEqual('completed');
    expect(result.is_favorite).toEqual(false);
  });

  it('should use default values when optional fields are not provided', async () => {
    const testInput: CreateUserDocumentInput = {
      user_id: testUserId,
      title: 'Simple Document',
      document_data: { simple: 'data' }
    };

    const result = await createUserDocument(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.template_id).toBeNull();
    expect(result.title).toEqual('Simple Document');
    expect(result.file_type).toBeNull();
    expect(result.status).toEqual('draft'); // Default value
    expect(result.is_favorite).toEqual(false); // Default value
  });

  it('should save user document to database', async () => {
    const testInput: CreateUserDocumentInput = {
      user_id: testUserId,
      template_id: testTemplateId,
      title: 'Database Test Document',
      document_data: { test: 'data' },
      file_type: 'pdf'
    };

    const result = await createUserDocument(testInput);

    const documents = await db.select()
      .from(userDocumentsTable)
      .where(eq(userDocumentsTable.id, result.id))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].user_id).toEqual(testUserId);
    expect(documents[0].template_id).toEqual(testTemplateId);
    expect(documents[0].title).toEqual('Database Test Document');
    expect(documents[0].document_data).toEqual({ test: 'data' });
    expect(documents[0].file_type).toEqual('pdf');
    expect(documents[0].status).toEqual('draft');
  });

  it('should throw error when user does not exist', async () => {
    const testInput: CreateUserDocumentInput = {
      user_id: 99999, // Non-existent user
      title: 'Invalid User Document',
      document_data: { test: 'data' }
    };

    expect(createUserDocument(testInput)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should throw error when template does not exist', async () => {
    const testInput: CreateUserDocumentInput = {
      user_id: testUserId,
      template_id: 99999, // Non-existent template
      title: 'Invalid Template Document',
      document_data: { test: 'data' }
    };

    expect(createUserDocument(testInput)).rejects.toThrow(/template with id 99999 not found/i);
  });
});
