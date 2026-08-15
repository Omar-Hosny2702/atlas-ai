import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let authServer: ReturnType<typeof createServer> | null = null;
let appServer: ReturnType<typeof createServer> | null = null;
let authPrivateKey: crypto.KeyObject;
let baseUrl = 'http://127.0.0.1:0';
let authPort = 0;

function base64url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function signJwt(sub: string): string {
  const header = { alg: 'RS256', kid: 'test-key', typ: 'JWT' };
  const payload = {
    sub,
    iss: `http://127.0.0.1:${authPort}/`,
    aud: 'atlas-ai-api',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${encodedHeader}.${encodedPayload}`);
  const signature = signer.sign(authPrivateKey, 'base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function fetchJson(input: string, init?: RequestInit): Promise<{ status: number; body: any }> {
  const response = await fetch(input, init);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function startMockAuth0(): Promise<void> {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  authPrivateKey = crypto.createPrivateKey(privateKey);
  const jwk = crypto.createPublicKey(publicKey).export({ format: 'jwk' }) as Record<string, string>;
  jwk.kid = 'test-key';
  jwk.alg = 'RS256';

  authServer = createServer((req, res) => {
    if (req.url === '/.well-known/jwks.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  });

  await new Promise<void>((resolve) => {
    authServer.listen(0, '127.0.0.1', () => {
      const address = authServer!.address();
      authPort = typeof address === 'object' && address ? address.port : 0;
      resolve();
    });
  });
}

async function startApp(): Promise<void> {
  const dbName = `test-${Date.now()}-${Math.random().toString(16).slice(2)}.db`;
  process.env.NODE_ENV = 'test';
  process.env.AUTH0_DISABLED = 'false';
  process.env.AUTH0_DOMAIN = `http://127.0.0.1:${authPort}`;
  process.env.AUTH0_AUDIENCE = 'atlas-ai-api';
  process.env.AUTH0_ISSUER = `http://127.0.0.1:${authPort}/`;
  process.env.DATABASE_PATH = path.resolve(__dirname, `../data/${dbName}`);

  const { app } = await import('../src/server.ts');
  appServer = createServer(app);

  await new Promise<void>((resolve) => {
    appServer.listen(0, '127.0.0.1', () => {
      const address = appServer!.address();
      baseUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
      resolve();
    });
  });
}

async function closeApp(): Promise<void> {
  if (appServer) {
    await new Promise<void>((resolve, reject) => {
      appServer.close((err) => (err ? reject(err) : resolve()));
    });
    appServer = null;
  }

  if (authServer) {
    await new Promise<void>((resolve, reject) => {
      authServer.close((err) => (err ? reject(err) : resolve()));
    });
    authServer = null;
  }

  const { closeDatabase } = await import('../src/db/database.ts');
  closeDatabase();
}

async function main(): Promise<void> {
  await startMockAuth0();
  await startApp();

  try {
    const unauthenticatedList = await fetchJson(`${baseUrl}/api/conversations`);
    assert.equal(unauthenticatedList.status, 401);

    const unauthenticatedCreate = await fetchJson(`${baseUrl}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No auth' }),
    });
    assert.equal(unauthenticatedCreate.status, 401);

    const tokenA = signJwt('auth0|user-a');
    const tokenB = signJwt('auth0|user-b');

    const createA = await fetchJson(`${baseUrl}/api/conversations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'User A chat', userId: 'auth0|evil' }),
    });
    assert.equal(createA.status, 201);
    assert.equal(createA.body.title, 'User A chat');
    const conversationA = createA.body;

    const listA = await fetchJson(`${baseUrl}/api/conversations`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(listA.status, 200);
    assert.equal(listA.body.length, 1);
    assert.equal(listA.body[0].title, 'User A chat');

    const listB = await fetchJson(`${baseUrl}/api/conversations`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(listB.status, 200);
    assert.deepEqual(listB.body, []);

    const getB = await fetchJson(`${baseUrl}/api/conversations/${conversationA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.ok(getB.status === 403 || getB.status === 404);

    const patchB = await fetchJson(`${baseUrl}/api/conversations/${conversationA.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'hijack' }),
    });
    assert.ok(patchB.status === 403 || patchB.status === 404);

    const deleteB = await fetchJson(`${baseUrl}/api/conversations/${conversationA.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.ok(deleteB.status === 403 || deleteB.status === 404);

    const createB = await fetchJson(`${baseUrl}/api/conversations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'User B chat' }),
    });
    assert.equal(createB.status, 201);
    const conversationB = createB.body;

    const aAccessesB = await fetchJson(`${baseUrl}/api/conversations/${conversationB.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.ok(aAccessesB.status === 403 || aAccessesB.status === 404);

    const chatBAsA = await fetchJson(`${baseUrl}/api/chat/${conversationB.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'You should not be here' }),
    });
    assert.ok(chatBAsA.status === 403 || chatBAsA.status === 404);

    console.log('PASS: auth and ownership regressions');
  } finally {
    await closeApp();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
