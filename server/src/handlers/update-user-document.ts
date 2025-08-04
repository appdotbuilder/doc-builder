
import { db } from '../db';
import { userDocumentsTable } from '../db/schema';
import { type UpdateUserDocumentInput, type UserDocument } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserDocument = async (input: UpdateUserDocumentInput): Promise<UserDocument | null> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.document_data !== undefined) {
      updateData.document_data = input.document_data;
    }
    
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    
    if (input.is_favorite !== undefined) {
      updateData.is_favorite = input.is_favorite;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the user document
    const result = await db.update(userDocumentsTable)
      .set(updateData)
      .where(eq(userDocumentsTable.id, input.id))
      .returning()
      .execute();

    // Return null if no document was updated (document not found)
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers (price is nullable)
    const document = result[0];
    return {
      ...document,
      // No numeric conversions needed for user documents table
    } as UserDocument;
  } catch (error) {
    console.error('User document update failed:', error);
    throw error;
  }
};
