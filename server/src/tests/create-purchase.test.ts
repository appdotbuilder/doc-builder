
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { purchasesTable, usersTable, templatesTable, templateCategoriesTable } from '../db/schema';
import { type CreatePurchaseInput } from '../schema';
import { createPurchase } from '../handlers/create-purchase';
import { eq } from 'drizzle-orm';

describe('createPurchase', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testTemplateId: number;

  beforeEach(async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create prerequisite category and template
    const categoryResult = await db.insert(templateCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category'
      })
      .returning()
      .execute();

    const templateResult = await db.insert(templatesTable)
      .values({
        title: 'Test Template',
        category_id: categoryResult[0].id,
        template_data: { field: 'value' },
        price: '9.99'
      })
      .returning()
      .execute();
    testTemplateId = templateResult[0].id;
  });

  it('should create a subscription purchase', async () => {
    const testInput: CreatePurchaseInput = {
      user_id: testUserId,
      purchase_type: 'subscription',
      amount: 29.99,
      currency: 'EUR',
      payment_provider: 'stripe',
      payment_provider_id: 'pi_test123'
    };

    const result = await createPurchase(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.template_id).toBeNull();
    expect(result.purchase_type).toEqual('subscription');
    expect(result.amount).toEqual(29.99);
    expect(typeof result.amount).toEqual('number');
    expect(result.currency).toEqual('EUR');
    expect(result.payment_status).toEqual('pending');
    expect(result.payment_provider).toEqual('stripe');
    expect(result.payment_provider_id).toEqual('pi_test123');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an individual document purchase', async () => {
    const testInput: CreatePurchaseInput = {
      user_id: testUserId,
      template_id: testTemplateId,
      purchase_type: 'individual_document',
      amount: 9.99,
      currency: 'EUR'
    };

    const result = await createPurchase(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.template_id).toEqual(testTemplateId);
    expect(result.purchase_type).toEqual('individual_document');
    expect(result.amount).toEqual(9.99);
    expect(typeof result.amount).toEqual('number');
    expect(result.currency).toEqual('EUR');
    expect(result.payment_status).toEqual('pending');
    expect(result.payment_provider).toBeNull();
    expect(result.payment_provider_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save purchase to database', async () => {
    const testInput: CreatePurchaseInput = {
      user_id: testUserId,
      template_id: testTemplateId,
      purchase_type: 'individual_document',
      amount: 9.99,
      currency: 'EUR',
      payment_provider: 'paypal',
      payment_provider_id: 'PAYID-TEST123'
    };

    const result = await createPurchase(testInput);

    // Query using proper drizzle syntax
    const purchases = await db.select()
      .from(purchasesTable)
      .where(eq(purchasesTable.id, result.id))
      .execute();

    expect(purchases).toHaveLength(1);
    const purchase = purchases[0];
    expect(purchase.user_id).toEqual(testUserId);
    expect(purchase.template_id).toEqual(testTemplateId);
    expect(purchase.purchase_type).toEqual('individual_document');
    expect(parseFloat(purchase.amount)).toEqual(9.99);
    expect(purchase.currency).toEqual('EUR');
    expect(purchase.payment_status).toEqual('pending');
    expect(purchase.payment_provider).toEqual('paypal');
    expect(purchase.payment_provider_id).toEqual('PAYID-TEST123');
    expect(purchase.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const testInput: CreatePurchaseInput = {
      user_id: 99999, // Non-existent user
      purchase_type: 'subscription',
      amount: 29.99,
      currency: 'EUR'
    };

    expect(createPurchase(testInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when template does not exist', async () => {
    const testInput: CreatePurchaseInput = {
      user_id: testUserId,
      template_id: 99999, // Non-existent template
      purchase_type: 'individual_document',
      amount: 9.99,
      currency: 'EUR'
    };

    expect(createPurchase(testInput)).rejects.toThrow(/template not found/i);
  });

  it('should handle minimal input with defaults', async () => {
    const testInput: CreatePurchaseInput = {
      user_id: testUserId,
      purchase_type: 'subscription',
      amount: 19.99,
      currency: 'USD'
    };

    const result = await createPurchase(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.template_id).toBeNull();
    expect(result.purchase_type).toEqual('subscription');
    expect(result.amount).toEqual(19.99);
    expect(result.currency).toEqual('USD');
    expect(result.payment_status).toEqual('pending');
    expect(result.payment_provider).toBeNull();
    expect(result.payment_provider_id).toBeNull();
  });
});
