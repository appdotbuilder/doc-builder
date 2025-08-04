
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createTemplateInputSchema,
  createUserDocumentInputSchema,
  updateUserDocumentInputSchema,
  createPurchaseInputSchema,
  getTemplatesByCategoryInputSchema,
  getUserDocumentsInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create-user';
import { getTemplateCategories } from './handlers/get-template-categories';
import { getTemplatesByCategory } from './handlers/get-templates-by-category';
import { getTemplateById } from './handlers/get-template-by-id';
import { createUserDocument } from './handlers/create-user-document';
import { getUserDocuments } from './handlers/get-user-documents';
import { updateUserDocument } from './handlers/update-user-document';
import { createPurchase } from './handlers/create-purchase';
import { updateUserSubscription } from './handlers/update-user-subscription';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  updateUserSubscription: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUserSubscription(input)),

  // Template operations
  getTemplateCategories: publicProcedure
    .query(() => getTemplateCategories()),

  getTemplatesByCategory: publicProcedure
    .input(getTemplatesByCategoryInputSchema)
    .query(({ input }) => getTemplatesByCategory(input)),

  getTemplateById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getTemplateById(input.id)),

  // Document management
  createUserDocument: publicProcedure
    .input(createUserDocumentInputSchema)
    .mutation(({ input }) => createUserDocument(input)),

  getUserDocuments: publicProcedure
    .input(getUserDocumentsInputSchema)
    .query(({ input }) => getUserDocuments(input)),

  updateUserDocument: publicProcedure
    .input(updateUserDocumentInputSchema)
    .mutation(({ input }) => updateUserDocument(input)),

  // Purchase operations
  createPurchase: publicProcedure
    .input(createPurchaseInputSchema)
    .mutation(({ input }) => createPurchase(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
