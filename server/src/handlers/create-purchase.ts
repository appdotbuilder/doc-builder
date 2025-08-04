
import { db } from '../db';
import { purchasesTable, usersTable, templatesTable } from '../db/schema';
import { type CreatePurchaseInput, type Purchase } from '../schema';
import { eq } from 'drizzle-orm';

export const createPurchase = async (input: CreatePurchaseInput): Promise<Purchase> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Verify template exists if template_id is provided
    if (input.template_id) {
      const template = await db.select()
        .from(templatesTable)
        .where(eq(templatesTable.id, input.template_id))
        .execute();

      if (template.length === 0) {
        throw new Error('Template not found');
      }
    }

    // Insert purchase record
    const result = await db.insert(purchasesTable)
      .values({
        user_id: input.user_id,
        template_id: input.template_id || null,
        purchase_type: input.purchase_type,
        amount: input.amount.toString(), // Convert number to string for numeric column
        currency: input.currency,
        payment_status: 'pending', // Default status
        payment_provider: input.payment_provider || null,
        payment_provider_id: input.payment_provider_id || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const purchase = result[0];
    return {
      ...purchase,
      amount: parseFloat(purchase.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Purchase creation failed:', error);
    throw error;
  }
};
