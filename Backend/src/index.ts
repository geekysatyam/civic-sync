import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDb } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startCronJobs } from './jobs/cron.js';

import authRoutes from './routes/authRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import userRoutes from './routes/userRoutes.js';
import pollRoutes from './routes/pollRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import karmaRoutes from './routes/karmaRoutes.js';
import mayorRoutes from './routes/mayorRoutes.js';
import stateRoutes from './routes/stateRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import geoRoutes from './routes/geoRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import ghostAuditRoutes from './routes/ghostAuditRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import contractorRoutes, { contractorPanelRoutes } from './routes/contractorRoutes.js';
import deptHeadRoutes from './routes/deptHeadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { getGoogleCallbackUrl, isGoogleOAuthEnabled, warnIfCallbackPortMismatch } from './services/googleAuthService.js';

// Prevent Node 22 from crashing on unhandled async rejections in route handlers
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

const app = express();
const PORT = parseInt(process.env.PORT ?? '5000', 10);

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:8080,http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (clientUrls.includes(origin)) {
        cb(null, origin);
        return;
      }
      cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/karma', karmaRoutes);
app.use('/api/mayor', mayorRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/ghost-audits', ghostAuditRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api/contractor', contractorPanelRoutes);
app.use('/api/dept-head', deptHeadRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is required.');
}

// Start listening immediately so Railway healthcheck passes
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CivicSync API running on port ${PORT}`);
  if (isGoogleOAuthEnabled()) {
    warnIfCallbackPortMismatch();
    console.log('Google OAuth redirect URI (add EXACTLY in Google Console → Authorized redirect URIs):');
    console.log(`  ${getGoogleCallbackUrl()}`);
  }
});

connectDb(uri)
  .then(() => startCronJobs())
  .catch((e) => {
    console.error('MongoDB connection failed:', e);
    process.exit(1);
  });
