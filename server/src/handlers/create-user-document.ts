
import { db } from '../db';
import { userDocumentsTable, usersTable, templatesTable } from '../db/schema';
import { type CreateUserDocumentInput, type UserDocument } from '../schema';
import { eq } from 'drizzle-orm';

export const createUserDocument = async (input: CreateUserDocumentInput): Promise<UserDocument> => {
  try {
    // Verify user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Verify template exists if template_id is provided
    if (input.template_id) {
      const templates = await db.select()
        .from(templatesTable)
        .where(eq(templatesTable.id, input.template_id))
        .execute();

      if (templates.length === 0) {
        throw new Error(`Template with id ${input.template_id} not found`);
      }
    }

    // Insert user document record
    const result = await db.insert(userDocumentsTable)
      .values({
        user_id: input.user_id,
        template_id: input.template_id || null,
        title: input.title,
        document_data: input.document_data,
        file_type: input.file_type || null,
        status: input.status || 'draft'
      })
      .returning()
      .execute();

    // Type assertion to handle the document_data field type conversion
    const document = result[0];
    return {
      ...document,
      document_data: document.document_data as Record<string, any>
    };
  } catch (error) {
    console.error('User document creation failed:', error);
    throw error;
  }
};
