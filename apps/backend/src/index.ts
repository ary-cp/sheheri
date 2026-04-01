import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import passport from 'passport';
import connectDB from './config/db';
import postsRouter from './routes/posts.routes';
import votesRouter from './routes/votes.routes';
import placesRouter from './routes/places.routes';
import authRouter from './routes/auth.routes';
import nicknameRouter from './routes/nickname.routes';
import { initPassport } from './config/passport';

dotenv.config();
connectDB();
initPassport();

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI! }),
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 365 },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req: any, _res, next) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4();
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Sheheri backend chal raha hai ✅' });
});

app.use('/api/posts',    postsRouter);
app.use('/api/votes',    votesRouter);
app.use('/api/places',   placesRouter);
app.use('/api/auth',     authRouter);
app.use('/api/nickname', nicknameRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});