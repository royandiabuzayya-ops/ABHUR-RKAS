import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { getSchoolData, saveSchoolData } from './src/db/school.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Body parsing middleware (support large JSON states)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Client Firebase config endpoint
app.get('/api/firebase-config', (_req, res) => {
  res.json({
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
  });
});

// Sync / Register authenticated user
app.post('/api/auth/sync-user', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || `${uid}@school.local`;
    if (!uid) {
      return res.status(401).json({ error: 'Missing UID' });
    }
    const user = await getOrCreateUser(uid, email);
    res.json({ user });
  } catch (error: any) {
    console.error('Failed to sync user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Fetch school data for the logged-in user
app.get('/api/school-data', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Missing UID' });
    }
    const user = await getOrCreateUser(uid, req.user?.email || `${uid}@school.local`);
    const data = await getSchoolData(user.id);
    res.json({ data });
  } catch (error: any) {
    console.error('Failed to fetch school data:', error);
    res.status(500).json({ error: 'Failed to fetch school data' });
  }
});

// Save school data for the logged-in user
app.post('/api/school-data', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Missing UID' });
    }
    const user = await getOrCreateUser(uid, req.user?.email || `${uid}@school.local`);
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'Missing state payload' });
    }
    await saveSchoolData(user.id, state);
    res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('Failed to save school data:', error);
    res.status(500).json({ error: 'Failed to save school data' });
  }
});

// Serve static assets
app.use(express.static(__dirname));

// Fallback all other routes to index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
