import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login-failed' }),
  (req: any, res) => {
    req.session.userId = req.user.anonymousId;
    if (!req.user.nicknameSet) {
      res.redirect('http://localhost:3000/nickname');
    } else {
      res.redirect('http://localhost:3000');
    }
  }
);

router.post('/logout', (req: any, res) => {
  req.logout(() => {
    req.session.destroy();
    res.json({ success: true });
  });
});

router.get('/me', (req: any, res) => {
  if (!req.user) {
    return res.json({ loggedIn: false, anonymousId: req.session.userId });
  }
  res.json({
    loggedIn:    true,
    displayName: req.user.displayName,
    avatar:      req.user.avatar,
    anonymousId: req.user.anonymousId,
    nickname:    req.user.nickname,
    nicknameSet: req.user.nicknameSet,
  });
});

export default router;