const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const base64url = require('base64url');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const { createUser, getUser, addCredentialToUser } = require('./users');

const app = express();

// CORS: use the middleware; avoid duplicating manual headers
app.use(
  cors({
    origin: '*',
    credentials: true,
  }),
);
app.use(bodyParser.json());

// Configuration - adapt these for your environment
// rpID must be the effective domain of the frontend origin, without scheme.
// If your frontend runs at https://demowebserver.ngbandi.online, rpID should be "demowebserver.ngbandi.online".
const rpName = 'Example WebAuthn App';
const rpID = 'webauthn.ngbandi.online';
const origin = 'https://webauthn.ngbandi.online';

// POST /register/options
// body: { username }
app.post('/register/options', (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Missing username' });

  let user = getUser(username);
  if (!user) user = createUser(username);

  const options = generateRegistrationOptions({
    rpName,
    rpID, // use rpID, not origin
    userID: user.id,
    userName: user.username,
    timeout: 60000,
    // Attestation types: 'none' | 'indirect' | 'direct' | 'enterprise'
    attestationType: 'none',
    authenticatorSelection: {
      userVerification: 'preferred',
    },
    excludeCredentials: user.credentials.map((cred) => ({
      id: base64url.toBuffer(cred.credentialID),
      type: 'public-key',
      transports: cred.transports || undefined,
    })),
    supportedAlgorithmIDs: [-7, -257], // ES256, RS256
  });

  // Save the challenge on the user for verification later
  user.currentChallenge = options.challenge;

  return res.json(options);
});

// POST /register/verify
// body: { username, attestation }
app.post('/register/verify', async (req, res) => {
  const { username, attestation } = req.body || {};
  if (!username || !attestation) return res.status(400).json({ error: 'Missing parameters' });

  const user = getUser(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    const verification = await verifyRegistrationResponse({
      response: attestation, // client response object from navigator.credentials.create
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin, // full origin (scheme + host + optional port)
      expectedRPID: rpID, // domain only
      requireUserVerification: false, // set true if you want to enforce UV
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const {
        credentialPublicKey,
        credentialID,
        counter,
        // transports may be present depending on client/platform
        transports,
      } = registrationInfo;

      addCredentialToUser(username, {
        credentialID: base64url.encode(credentialID),
        credentialPublicKey: base64url.encode(credentialPublicKey),
        counter,
        transports,
      });
    }

    // Clear challenge after verification attempt (whether verified or not)
    user.currentChallenge = undefined;

    return res.json({ verified });
  } catch (err) {
    console.error('Registration verification error', err);
    return res.status(400).json({ error: err.message || String(err) });
  }
});

// POST /auth/options
// body: { username }
app.post('/auth/options', (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Missing username' });

  const user = getUser(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const options = generateAuthenticationOptions({
    timeout: 60000,
    allowCredentials: user.credentials.map((cred) => ({
      id: base64url.toBuffer(cred.credentialID),
      type: 'public-key',
      transports: cred.transports || undefined,
    })),
    userVerification: 'preferred',
    rpID,
  });

  user.currentChallenge = options.challenge;
  return res.json(options);
});

// POST /auth/verify
// body: { username, assertion }
app.post('/auth/verify', async (req, res) => {
  const { username, assertion } = req.body || {};
  if (!username || !assertion) return res.status(400).json({ error: 'Missing parameters' });

  const user = getUser(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Find matching stored credential
  const assertionIDB64 = base64url.encode(base64url.toBuffer(assertion.id));
  const credential =
    user.credentials.find((c) => c.credentialID === assertion.id) ||
    user.credentials.find((c) => c.credentialID === assertionIDB64);

  if (!credential) return res.status(400).json({ error: 'Unknown credential ID' });

  try {
    const verification = await verifyAuthenticationResponse({
      response: assertion, // client response object from navigator.credentials.get
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false, // set true if you want to enforce UV
      authenticator: {
        credentialPublicKey: base64url.toBuffer(credential.credentialPublicKey),
        credentialID: base64url.toBuffer(credential.credentialID),
        counter: credential.counter || 0,
        transports: credential.transports || undefined,
      },
    });

    const { verified, authenticationInfo } = verification;
    if (verified && authenticationInfo) {
      credential.counter = authenticationInfo.newCounter;
    }

    // Clear challenge after verification attempt
    user.currentChallenge = undefined;

    return res.json({ verified });
  } catch (err) {
    console.error('Authentication verification error', err);
    return res.status(400).json({ error: err.message || String(err) });
  }
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>WebAuthn Backend</title>
      </head>
      <body>
        <h1>Welcome to the WebAuthn Backend</h1>
        <p>The server rpID: ${rpID} and origin ${origin} is running and ready to accept requests.</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`WebAuthn backend listening on http://dev.ngb.com:${PORT}`));