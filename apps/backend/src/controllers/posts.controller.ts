import { Request, Response } from 'express';
import Post from '../models/Post.model';
import Place from '../models/Place.model';
import User from '../models/User.model';
import { calculateHotScore } from '../services/hotScore.service';
import { filterContent } from '../services/moderation.service';

// GET /api/posts/nearby
export async function getNearbyPosts(req: Request, res: Response) {
  try {
    const { lat, lng, radius = 5000, page = 1, limit = 20 } = req.query;

    const posts = await Post.find({
      isHidden: false,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [+lng!, +lat!] },
          $maxDistance: +radius,
        },
      },
    })
      .sort({ hotScore: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .lean();

    res.json({ posts, page: +page, hasMore: posts.length === +limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nearby posts' });
  }
}

// GET /api/posts/place/:googlePlaceId
export async function getPostsByPlace(req: Request, res: Response) {
  try {
    const { googlePlaceId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({
      googlePlaceId,
      isHidden: false,
    })
      .sort({ hotScore: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .lean();

    res.json({ posts, page: +page, hasMore: posts.length === +limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch place posts' });
  }
}

// POST /api/posts
export async function createPost(req: any, res: Response) {
  try {
    const { content, googlePlaceId, placeName, placeAddress, lat, lng } = req.body;
    const authorId = req.session.userId;

    // Moderation check
    const { clean, flagged } = filterContent(content);
    if (flagged) {
      return res.status(400).json({ error: 'Post contains prohibited content' });
    }

    // Place already exist karta hai toh update karo, nahi toh banao
    let place = await Place.findOneAndUpdate(
      { googlePlaceId },
      {
        $setOnInsert: {
          googlePlaceId,
          name: placeName,
          address: placeAddress,
          location: { type: 'Point', coordinates: [+lng, +lat] },
        },
        $inc: { postCount: 1 },
      },
      { upsert: true, new: true }
    );

    const post = await Post.create({
      content: clean,
      authorId,
      placeId: place._id,
      googlePlaceId,
      placeName,
      location: { type: 'Point', coordinates: [+lng, +lat] },
      hotScore: calculateHotScore(0, 0, new Date()),
    });

    // User ka post count badhaao
    await User.findOneAndUpdate(
      { anonymousId: authorId },
      { $inc: { postCount: 1 } },
      { upsert: true }
    );

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
}

// POST /api/posts/:id/report
export async function reportPost(req: any, res: Response) {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { reportCount: 1 } },
      { new: true }
    );
    // 5 reports = auto hide
    if (post && post.reportCount >= 5) {
      post.isHidden = true;
      await post.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report post' });
  }
}