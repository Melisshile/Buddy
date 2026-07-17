import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();

const REGION = 'us-central1';

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
      version: '1.0.0',
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
