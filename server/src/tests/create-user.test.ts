
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create-user';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  subscription_type: 'free'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.subscription_type).toEqual('free');
    expect(result.subscription_expires_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.trial_ends_at).toBeInstanceOf(Date);
  });

  it('should create a user with minimal fields', async () => {
    const minimalInput: CreateUserInput = {
      email: 'minimal@example.com',
      name: 'Minimal User'
    };

    const result = await createUser(minimalInput);

    expect(result.email).toEqual('minimal@example.com');
    expect(result.name).toEqual('Minimal User');
    expect(result.avatar_url).toBeNull();
    expect(result.subscription_type).toEqual('free');
    expect(result.trial_ends_at).toBeInstanceOf(Date);
  });

  it('should set trial period to 7 days from now', async () => {
    const beforeCreation = new Date();
    const result = await createUser(testInput);
    const afterCreation = new Date();

    expect(result.trial_ends_at).toBeInstanceOf(Date);
    
    // Trial should be approximately 7 days from now
    const expectedTrialStart = new Date(beforeCreation.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expectedTrialEnd = new Date(afterCreation.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    expect(result.trial_ends_at!.getTime()).toBeGreaterThanOrEqual(expectedTrialStart.getTime());
    expect(result.trial_ends_at!.getTime()).toBeLessThanOrEqual(expectedTrialEnd.getTime());
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(users[0].subscription_type).toEqual('free');
    expect(users[0].trial_ends_at).toBeInstanceOf(Date);
  });

  it('should handle premium subscription type', async () => {
    const premiumInput: CreateUserInput = {
      email: 'premium@example.com',
      name: 'Premium User',
      subscription_type: 'premium'
    };

    const result = await createUser(premiumInput);

    expect(result.subscription_type).toEqual('premium');
  });

  it('should throw error for duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com',
      name: 'Duplicate User'
    };

    expect(createUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });
});
