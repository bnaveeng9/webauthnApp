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
app.use(
  cors({
  origin: "*",
  credentials: true,
})
);
//app.use((req, res, next) => { bodyParser.json(); } );
app.use(bodyParser.json());

//Simple way: allow all origins
 app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});


// Configuration - adapt these for your environment
const rpName = 'Example WebAuthn App';
const rpID = 'https://webauthn.ngbandi.online';
const origin = 'https://demowebserver.ngbandi.online';

// POST /register/options
// body: { username }
app.post('/register/options', (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Missing username' });

  let user = getUser(username);
  if (!user) user = createUser(username);

  const options = generateRegistrationOptions({
    rpName,
    origin,
    userID: user.id,
    userName: user.username,
    timeout: 60000,
    attestationType: 'public-key',
    authenticatorSelection: {
      userVerification: 'preferred',
    },
    excludeCredentials: user.credentials.map((cred) => ({
      id: base64url.toBuffer(cred.credentialID),
      type: 'public-key',
      transports: cred.transports || undefined,
    })),
    supportedAlgorithmIDs: [-7, -257],
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
  console.log('Received /register/verify request with body:', req);
  try {
    const verification = await verifyRegistrationResponse({
       credential: attestation,
       response:  attestation ,
       expectedChallenge: user.currentChallenge,
       expectedOrigin: req.headers.host || origin,
       expectedRPID: origin,
    });

    

    const {verified, registrationInfo } = verification;
    if (verified && registrationInfo) {
    
      const { credentialPublicKey, credentialID, counter } = attestation;

      addCredentialToUser(username, {
        credentialID: base64url.encode(credentialID),
        credentialPublicKey: base64url.encode(credentialPublicKey),
        counter,
      });
    }

    // Clear challenge
   // user.currentChallenge = undefined;

    return res.json({ verified });
  } catch (err) {
    console.error('Registration verification error', err);
    return res.status(400).json({ error: err.message || err.toString() });
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
  const credential = user.credentials.find((c) => c.credentialID === assertion.id || c.credentialID === base64url.encode(base64url.toBuffer(assertion.id)));
  if (!credential) return res.status(400).json({ error: 'Unknown credential ID' });

  try {
    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: base64url.toBuffer(credential.credentialPublicKey),
        credentialID: base64url.toBuffer(credential.credentialID),
        counter: credential.counter || 0,
      },
    });

    const { verified, authenticationInfo } = verification;
    if (verified && authenticationInfo) {
      credential.counter = authenticationInfo.newCounter;
    }

   // user.currentChallenge = undefined;
    return res.json({ verified });
  } catch (err) {
    console.error('Authentication verification error', err);
    return res.status(400).json({ error: err.message || err.toString() });
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
        <p>The server rpID : ${rpID} and origin ${origin} is running and ready to accept requests. </p>
      </body>
    </html>
  `);
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`WebAuthn backend listening on http://dev.ngb.com:${PORT}`));



// const certPath = process.env.SSL_CERT_PATH || '../certs/opensearch.crt';
// const keyPath = process.env.SSL_KEY_PATH || '../certs/opensearch.key';

// let server: http.Server | https.Server;

// if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
//   const options = {
//     key: fs.readFileSync(keyPath),
//     cert: fs.readFileSync(certPath),
//   };
//   server = https.createServer(options, app);
//   server.listen(process.env.PORT || 443, () => {
//     console.log('HTTPS server listening on port', process.env.PORT || 443);
//   });
// } else {
//   server = http.createServer(app);
//   server.listen(process.env.PORT || 3000, () => {
//     console.log('HTTP server listening on port', process.env.PORT || 3000);
//   });
// }