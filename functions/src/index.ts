import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();

const REGION = 'us-central1';
const OPENAI_URL = 'https://api.openai.com/v1/responses';

/** Health check for Buddy Cloud Functions */
export const buddyHealth = functions
  .region(REGION)
  .https.onRequest((req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.status(204).send('');
      return;
    }
    res.json({
      ok: true,
      service: 'buddy-functions',
      project: process.env.GCLOUD_PROJECT || 'buddy-46cbb',
      version: '2.0.0',
      openai: Boolean(process.env.OPENAI_API_KEY),
    });
  });

/** Seed Firestore user profile when Auth user is created */
export const ensureUserProfile = functions
  .region(REGION)
  .auth.user()
  .onCreate(async (user) => {
    const now = Date.now();
    await admin
      .firestore()
      .collection('users')
      .doc(user.uid)
      .set(
        {
          uid: user.uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          preferences: {},
          persona: 'teacher',
          createdAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
  });

/**
 * OpenAI Responses API proxy — keeps OPENAI_API_KEY server-side.
 * Set secret: firebase functions:config:set openai.key="sk-..."
 * or use process.env.OPENAI_API_KEY in modern secrets.
 */
export const buddyOpenAI = functions
  .region(REGION)
  .runWith({
    timeoutSeconds: 120,
    memory: '512MB',
  })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'POST only' });
      return;
    }

    const apiKey =
      process.env.OPENAI_API_KEY ||
      (functions.config().openai && functions.config().openai.key) ||
      '';
    if (!apiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not configured on Functions' });
      return;
    }

    // Optional Auth — prefer signed-in users when Firebase Auth token present
    const authHeader = req.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        await admin.auth().verifyIdToken(authHeader.slice(7));
      } catch {
        res.status(401).json({ error: 'Invalid auth token' });
        return;
      }
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const upstream = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      const text = await upstream.text();
      res.status(upstream.status).type('application/json').send(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'proxy failed';
      res.status(502).json({ error: message });
    }
  });
