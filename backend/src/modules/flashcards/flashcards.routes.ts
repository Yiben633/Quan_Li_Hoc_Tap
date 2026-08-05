import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { validateBody } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as c from './flashcards.controller.js';
import { cardSchema, cardUpdateSchema, reviewSchema, setSchema, setUpdateSchema } from './flashcards.schemas.js';
export const flashcardsRouter = Router(); flashcardsRouter.use(authenticate);
flashcardsRouter.get('/flashcards/due', asyncHandler(c.due)); flashcardsRouter.get('/flashcard-sets', asyncHandler(c.sets)); flashcardsRouter.post('/flashcard-sets', validateBody(setSchema), asyncHandler(c.createSet)); flashcardsRouter.get('/flashcard-sets/:id', asyncHandler(c.set)); flashcardsRouter.patch('/flashcard-sets/:id', validateBody(setUpdateSchema), asyncHandler(c.updateSet)); flashcardsRouter.delete('/flashcard-sets/:id', asyncHandler(c.removeSet)); flashcardsRouter.get('/flashcard-sets/:setId/flashcards', asyncHandler(c.cards)); flashcardsRouter.post('/flashcard-sets/:setId/flashcards', validateBody(cardSchema), asyncHandler(c.createCard)); flashcardsRouter.post('/flashcards/:id/review', validateBody(reviewSchema), asyncHandler(c.review)); flashcardsRouter.put('/flashcards/:id/review', validateBody(reviewSchema), asyncHandler(c.review)); flashcardsRouter.patch('/flashcards/:id', validateBody(cardUpdateSchema), asyncHandler(c.updateCard)); flashcardsRouter.delete('/flashcards/:id', asyncHandler(c.removeCard));
