import { Request, Response } from 'express';
import Vote from '../models/Vote.model';
import Post from '../models/Post.model';
import { calculateHotScore } from '../services/hotScore.service';

// POST /api/votes/:postId
export async function castVote(req: any, res: Response) {
  try {
    const { postId } = req.params;
    const { value } = req.body;
    const userId = req.session.userId;

    const existing = await Vote.findOne({ userId, postId });

    if (existing) {
      if (existing.value === value) {
        // Same button dobara dabaya = un-vote
        await Vote.deleteOne({ _id: existing._id });
        await Post.findByIdAndUpdate(postId, {
          $inc: { [value === 1 ? 'upvotes' : 'downvotes']: -1 },
        });
      } else {
        // Upvote tha, downvote kiya = flip
        existing.value = value;
        await existing.save();
        await Post.findByIdAndUpdate(postId, {
          $inc: {
            upvotes:   value === 1 ? 1 : -1,
            downvotes: value === -1 ? 1 : -1,
          },
        });
      }
    } else {
      // Pehli baar vote
      await Vote.create({ userId, postId, value });
      await Post.findByIdAndUpdate(postId, {
        $inc: { [value === 1 ? 'upvotes' : 'downvotes']: 1 },
      });
    }

    // HotScore recalculate karo
    const post = await Post.findById(postId);
    if (post) {
      post.hotScore = calculateHotScore(post.upvotes, post.downvotes, post.createdAt);
      await post.save();
    }

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: 'Vote failed' });
  }
}