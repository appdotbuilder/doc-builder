
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if user with this email already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Set default trial period to 7 days from now
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        name: input.name,
        avatar_url: input.avatar_url || null,
        subscription_type: input.subscription_type || 'free',
        trial_ends_at: trialEndsAt
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    // Re-throw with more specific error handling
    if (error instanceof Error && error.message.includes('already exists')) {
      throw new Error('An account with this email address already exists');
    }
    throw new Error('Failed to create user account');
  }
};
