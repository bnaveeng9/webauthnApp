const base64url = require('base64url');
const { v4: uuidv4 } = require('uuid');

// In-memory user store. For production replace with a persistent DB.
// User shape:
// {
//   id: '<base64url id>',
//   username: '<username>',
//   credentials: [ { credentialID: '<base64url>', credentialPublicKey: '<base64url>', counter: number, transports: [..] } ],
//   currentChallenge: '<challenge string>'
// }

const users = new Map();

function createUser(username) {
  const id = base64url.encode(Buffer.from(uuidv4()));
  const user = { id, username, credentials: [], currentChallenge: undefined };
  users.set(username, user);
  return user;
}

function getUser(username) {
  return users.get(username);
}

function getUserById(id) {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

function addCredentialToUser(username, cred) {
  const user = getUser(username);
  if (!user) return null;
  user.credentials.push(cred);
  return user;
}

module.exports = { createUser, getUser, getUserById, addCredentialToUser };
