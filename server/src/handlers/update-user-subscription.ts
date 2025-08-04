
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserSubscription = async (input: UpdateUserInput): Promise<User | null> => {
  try {
    // First check if user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.avatar_url !== undefined) {
      updateData.avatar_url = input.avatar_url;
    }
    if (input.subscription_type !== undefined) {
      updateData.subscription_type = input.subscription_type;
    }
    if (input.subscription_expires_at !== undefined) {
      updateData.subscription_expires_at = input.subscription_expires_at;
    }
    if (input.trial_ends_at !== undefined) {
      updateData.trial_ends_at = input.trial_ends_at;
    }

    // Update user record
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User subscription update failed:', error);
    throw error;
  }
};
