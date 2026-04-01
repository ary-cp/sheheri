import { Router } from 'express';
import User from '../models/User.model';
import { generateNickname, isValidNickname } from '../services/nickname.service';

const router = Router();

// GET /api/nickname/generate — random nickname suggest karo
router.get('/generate', (_req, res) => {
  const nickname = generateNickname();
  res.json({ nickname });
});

// POST /api/nickname/set — nickname save karo
router.post('/set', async (req: any, res) => {
  try {
    const { nickname } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    if (!isValidNickname(nickname)) {
      return res.status(400).json({
        error: 'Nickname must be 3-20 characters — only letters, numbers, underscore'
      });
    }

    // Check karo nickname already exist karta hai
    const existing = await User.findOne({ nickname });
    if (existing) {
      return res.status(400).json({ error: 'Nickname already taken — try another!' });
    }

    // Save karo
    await User.findOneAndUpdate(
      { anonymousId: userId },
      { nickname, nicknameSet: true },
      { upsert: true }
    );

    res.json({ success: true, nickname });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set nickname' });
  }
});

// GET /api/nickname/me — current user ka nickname
router.get('/me', async (req: any, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.json({ nickname: null, nicknameSet: false });

    const user = await User.findOne({ anonymousId: userId });
    res.json({
      nickname: user?.nickname || null,
      nicknameSet: user?.nicknameSet || false,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nickname' });
  }
});

export default router;