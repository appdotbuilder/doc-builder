
import { db } from '../db';
import { userDocumentsTable } from '../db/schema';
import { type GetUserDocumentsInput, type UserDocument } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const getUserDocuments = async (input: GetUserDocumentsInput): Promise<UserDocument[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [
      eq(userDocumentsTable.user_id, input.user_id)
    ];

    // Add optional filters
    if (input.status !== undefined) {
      conditions.push(eq(userDocumentsTable.status, input.status));
    }

    if (input.is_favorite !== undefined) {
      conditions.push(eq(userDocumentsTable.is_favorite, input.is_favorite));
    }

    // Apply pagination
    const limit = input.limit || 50;
    const offset = input.offset || 0;

    // Execute query directly without intermediate assignments
    const results = await db.select()
      .from(userDocumentsTable)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .execute();

    // Transform results to match UserDocument type
    return results.map(doc => ({
      ...doc,
      document_data: doc.document_data as Record<string, any>
    }));
  } catch (error) {
    console.error('Get user documents failed:', error);
    throw error;
  }
};
