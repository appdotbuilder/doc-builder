
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUserSubscription } from '../handlers/update-user-subscription';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: null,
  subscription_type: 'free'
};

describe('updateUserSubscription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user subscription to premium', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const expirationDate = new Date('2024-12-31');

    const updateInput: UpdateUserInput = {
      id: userId,
      subscription_type: 'premium',
      subscription_expires_at: expirationDate
    };

    const result = await updateUserSubscription(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.subscription_type).toEqual('premium');
    expect(result!.subscription_expires_at).toEqual(expirationDate);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update trial end date', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const trialEndDate = new Date('2024-01-15');

    const updateInput: UpdateUserInput = {
      id: userId,
      trial_ends_at: trialEndDate
    };

    const result = await updateUserSubscription(updateInput);

    expect(result).not.toBeNull();
    expect(result!.trial_ends_at).toEqual(trialEndDate);
    expect(result!.subscription_type).toEqual('free'); // Should remain unchanged
  });

  it('should update multiple user fields at once', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const expirationDate = new Date('2024-12-31');

    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Updated Name',
      email: 'updated@example.com',
      subscription_type: 'premium',
      subscription_expires_at: expirationDate,
      avatar_url: 'https://example.com/avatar.jpg'
    };

    const result = await updateUserSubscription(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Updated Name');
    expect(result!.email).toEqual('updated@example.com');
    expect(result!.subscription_type).toEqual('premium');
    expect(result!.subscription_expires_at).toEqual(expirationDate);
    expect(result!.avatar_url).toEqual('https://example.com/avatar.jpg');
  });

  it('should save changes to database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;
    const expirationDate = new Date('2024-12-31');

    const updateInput: UpdateUserInput = {
      id: userId,
      subscription_type: 'premium',
      subscription_expires_at: expirationDate
    };

    await updateUserSubscription(updateInput);

    // Verify changes in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].subscription_type).toEqual('premium');
    expect(users[0].subscription_expires_at).toEqual(expirationDate);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 999999, // Non-existent ID
      subscription_type: 'premium'
    };

    const result = await updateUserSubscription(updateInput);

    expect(result).toBeNull();
  });

  it('should update only provided fields', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        name: 'Original Name',
        subscription_type: 'free'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const originalName = userResult[0].name;

    // Update only subscription type
    const updateInput: UpdateUserInput = {
      id: userId,
      subscription_type: 'premium'
    };

    const result = await updateUserSubscription(updateInput);

    expect(result).not.toBeNull();
    expect(result!.subscription_type).toEqual('premium');
    expect(result!.name).toEqual(originalName); // Should remain unchanged
    expect(result!.email).toEqual(testUser.email); // Should remain unchanged
  });

  it('should handle null values correctly', async () => {
    // Create test user with avatar
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        avatar_url: 'https://example.com/old-avatar.jpg'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Update avatar to null
    const updateInput: UpdateUserInput = {
      id: userId,
      avatar_url: null
    };

    const result = await updateUserSubscription(updateInput);

    expect(result).not.toBeNull();
    expect(result!.avatar_url).toBeNull();
  });
});
