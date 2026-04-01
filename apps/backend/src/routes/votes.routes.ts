import { Router } from 'express';
import { castVote } from '../controllers/votes.controller';
import rateLimit from 'express-rate-limit';

const voteRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 votes per minute
  message: { error: 'Bahut zyada votes.' },
});

const router = Router();

router.post('/:postId', voteRateLimiter, castVote);

export default router;