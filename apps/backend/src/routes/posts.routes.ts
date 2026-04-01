import Post from '../models/Post.model';
import { Router } from 'express';
import {
  getNearbyPosts,
  getPostsByPlace,
  createPost,
  reportPost
} from '../controllers/posts.controller';
import rateLimit from 'express-rate-limit';

const postRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ghanta
  max: 10,                   // 10 posts per hour
  message: { error: 'Bahut zyada posts. Thoda ruko.' },
});

const router = Router();

router.get('/nearby',            getNearbyPosts);
router.get('/place/:placeId',    getPostsByPlace);
router.post('/',  postRateLimiter, createPost);
router.post('/:id/report',       reportPost);
router.get('/search', async (req: any, res) => {
  try {
    const { q } = req.query;
    const posts = await Post.find({
      isHidden: false,
      placeName: { $regex: q, $options: 'i' }
    })
      .sort({ hotScore: -1 })
      .limit(20)
      .lean();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});
export default router;