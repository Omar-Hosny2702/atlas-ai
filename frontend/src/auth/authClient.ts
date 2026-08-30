export interface AuthUser {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

export interface AuthSession {
  accessToken: string;
  idToken?: string;
  expiresAt: number;
  user: AuthUser;
}

interface AuthConfig {
  domain: string;
  clientId: string;
  audience: string;
  redirectUri: string;
  scope: string;
}

const AUTH_SESSION_KEY = 'atlas-auth-session';
const AUTH_REQUEST_KEY = 'atlas-auth-request';

function getEnvValue(name: string): string {
  const value =
    (import.meta.env[name] ?? '')
      .toString()
      .trim();

  return value;
}

function normalizeAuthDomain(
  value: string
): string {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return '';
  }

  if (
    /^https?:\/\//i.test(
      trimmed
    )
  ) {
    return trimmed.replace(
      /\/$/,
      ''
    );
  }

  return `https://${trimmed.replace(
    /\/$/,
    ''
  )}`;
}

export function getAuthConfig(): AuthConfig {
  return {
    domain:
      normalizeAuthDomain(
        getEnvValue(
          'VITE_AUTH0_DOMAIN'
        )
      ),

    clientId:
      getEnvValue(
        'VITE_AUTH0_CLIENT_ID'
      ),

    audience:
      getEnvValue(
        'VITE_AUTH0_AUDIENCE'
      ),

    redirectUri:
      getEnvValue(
        'VITE_AUTH0_REDIRECT_URI'
      ) ||
      `${window.location.origin}/callback`,

    scope:
      getEnvValue(
        'VITE_AUTH0_SCOPE'
      ) ||
      'openid profile email offline_access',
  };
}

export function isAuthConfigured(): boolean {
  const {
    domain,
    clientId,
    audience,
    redirectUri,
  } = getAuthConfig();

  return Boolean(
    domain &&
      clientId &&
      audience &&
      redirectUri
  );
}

function createRandomToken(
  length: number
): string {
  const values =
    new Uint32Array(
      length
    );

  crypto.getRandomValues(
    values
  );

  return Array.from(
    values,
    (value) =>
      value
        .toString(16)
        .padStart(
          2,
          '0'
        )
  )
    .join('')
    .slice(
      0,
      length
    );
}

async function sha256Base64Url(
  value: string
): Promise<string> {
  const bytes =
    new TextEncoder()
      .encode(
        value
      );

  const hash =
    await crypto.subtle.digest(
      'SHA-256',
      bytes
    );

  const array =
    Array.from(
      new Uint8Array(
        hash
      )
    );

  let binary = '';

  for (
    const byte of array
  ) {
    binary +=
      String.fromCharCode(
        byte
      );
  }

  return btoa(binary)
    .replace(
      /\+/g,
      '-'
    )
    .replace(
      /\//g,
      '_'
    )
    .replace(
      /=+$/g,
      ''
    );
}

function decodeJwtPayload(
  token: string
): Record<
  string,
  unknown
> {
  const [
    ,
    payloadPart,
  ] =
    token.split('.');

  if (!payloadPart) {
    throw new Error(
      'JWT payload is missing.'
    );
  }

  const normalized =
    payloadPart
      .replace(
        /-/g,
        '+'
      )
      .replace(
        /_/g,
        '/'
      );

  const padded =
    normalized.padEnd(
      normalized.length +
        (
          (
            4 -
            (
              normalized.length %
              4
            )
          ) %
          4
        ),
      '='
    );

  const binary =
    atob(
      padded
    );

  const bytes =
    Uint8Array.from(
      binary,
      (char) =>
        char.charCodeAt(
          0
        )
    );

  const json =
    new TextDecoder()
      .decode(
        bytes
      );

  return JSON.parse(
    json
  ) as Record<
    string,
    unknown
  >;
}

function readRequestState(): {
  state: string;
  nonce: string;
  verifier: string;
} | null {
  try {
    const raw =
      window.sessionStorage
        .getItem(
          AUTH_REQUEST_KEY
        );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(
        raw
      ) as {
        state?: string;
        nonce?: string;
        verifier?: string;
      };

    if (
      !parsed.state ||
      !parsed.nonce ||
      !parsed.verifier
    ) {
      return null;
    }

    return {
      state:
        parsed.state,

      nonce:
        parsed.nonce,

      verifier:
        parsed.verifier,
    };
  } catch {
    return null;
  }
}

function persistRequestState(
  state: string,
  nonce: string,
  verifier: string
): void {
  window.sessionStorage
    .setItem(
      AUTH_REQUEST_KEY,
      JSON.stringify({
        state,
        nonce,
        verifier,
      })
    );
}

function clearRequestState(): void {
  window.sessionStorage
    .removeItem(
      AUTH_REQUEST_KEY
    );
}

export function readAuthSession(): AuthSession | null {
  try {
    const raw =
      window.sessionStorage
        .getItem(
          AUTH_SESSION_KEY
        );

    if (!raw) {
      return null;
    }

    const session =
      JSON.parse(
        raw
      ) as AuthSession;

    if (
      !session?.accessToken ||
      !session?.expiresAt ||
      session.expiresAt <=
        Date.now()
    ) {
      window.sessionStorage
        .removeItem(
          AUTH_SESSION_KEY
        );

      return null;
    }

    return session;
  } catch {
    window.sessionStorage
      .removeItem(
        AUTH_SESSION_KEY
      );

    return null;
  }
}

function persistAuthSession(
  session: AuthSession
): void {
  window.sessionStorage
    .setItem(
      AUTH_SESSION_KEY,
      JSON.stringify(
        session
      )
    );
}

export function clearAuthSession(): void {
  window.sessionStorage
    .removeItem(
      AUTH_SESSION_KEY
    );

  clearRequestState();
}

export function getAccessToken(): string | null {
  const session =
    readAuthSession();

  return (
    session?.accessToken ??
    null
  );
}

export async function loginWithRedirect(): Promise<void> {
  const config =
    getAuthConfig();

  if (
    !isAuthConfigured()
  ) {
    throw new Error(
      'Auth0 is not configured. Set VITE_AUTH0_* environment variables.'
    );
  }

  const state =
    createRandomToken(
      32
    );

  const nonce =
    createRandomToken(
      32
    );

  const verifier =
    createRandomToken(
      96
    );

  const codeChallenge =
    await sha256Base64Url(
      verifier
    );

  persistRequestState(
    state,
    nonce,
    verifier
  );

  const authorizeUrl =
    new URL(
      `${config.domain}/authorize`
    );

  authorizeUrl.searchParams
    .set(
      'response_type',
      'code'
    );

  authorizeUrl.searchParams
    .set(
      'client_id',
      config.clientId
    );

  authorizeUrl.searchParams
    .set(
      'redirect_uri',
      config.redirectUri
    );

  authorizeUrl.searchParams
    .set(
      'scope',
      config.scope
    );

  authorizeUrl.searchParams
    .set(
      'audience',
      config.audience
    );

  authorizeUrl.searchParams
    .set(
      'state',
      state
    );

  authorizeUrl.searchParams
    .set(
      'nonce',
      nonce
    );

  authorizeUrl.searchParams
    .set(
      'code_challenge',
      codeChallenge
    );

  authorizeUrl.searchParams
    .set(
      'code_challenge_method',
      'S256'
    );

  window.location.assign(
    authorizeUrl.toString()
  );
}

export async function handleAuthCallback(): Promise<AuthSession | null> {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const code =
    params.get(
      'code'
    );

  const state =
    params.get(
      'state'
    );

  const error =
    params.get(
      'error'
    );

  if (error) {
    throw new Error(
      params.get(
        'error_description'
      ) ||
        'Authentication failed.'
    );
  }

  if (!code) {
    return readAuthSession();
  }

  const requestState =
    readRequestState();

  if (
    !requestState
  ) {
    throw new Error(
      'Auth0 callback state is missing. Please log in again.'
    );
  }

  if (
    state &&
    requestState.state !==
      state
  ) {
    throw new Error(
      'Auth0 callback state does not match. Please log in again.'
    );
  }

  const config =
    getAuthConfig();

  const tokenResponse =
    await fetch(
      `${config.domain}/oauth/token`,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',
        },

        body:
          new URLSearchParams({
            grant_type:
              'authorization_code',

            client_id:
              config.clientId,

            code,

            redirect_uri:
              config.redirectUri,

            code_verifier:
              requestState.verifier,

            audience:
              config.audience,
          }),
      }
    );

  if (
    !tokenResponse.ok
  ) {
    const detail =
      await tokenResponse.text();

    throw new Error(
      detail ||
        'Failed to exchange the Auth0 authorization code.'
    );
  }

  const data =
    (
      await tokenResponse.json()
    ) as {
      access_token?: string;
      id_token?: string;
      expires_in?: number;
    };

  const accessToken =
    data.access_token;

  if (
    !accessToken
  ) {
    throw new Error(
      'Auth0 did not return an API access token.'
    );
  }

  const accessClaims =
    decodeJwtPayload(
      accessToken
    );

  const aud =
    accessClaims.aud;

  if (
    (
      typeof aud ===
        'string' &&
      aud !==
        config.audience
    ) ||
    (
      Array.isArray(
        aud
      ) &&
      !aud.includes(
        config.audience
      )
    )
  ) {
    throw new Error(
      'The Auth0 access token is not valid for the Atlas backend audience.'
    );
  }

  let profileClaims =
    accessClaims;

  if (
    data.id_token
  ) {
    const idClaims =
      decodeJwtPayload(
        data.id_token
      );

    if (
      typeof idClaims.nonce ===
        'string' &&
      idClaims.nonce !==
        requestState.nonce
    ) {
      throw new Error(
        'Auth0 ID token nonce does not match. Please log in again.'
      );
    }

    profileClaims =
      idClaims;
  }

  const session: AuthSession = {
    accessToken,

    idToken:
      data.id_token,

    expiresAt:
      Date.now() +
      (
        data.expires_in ??
        3600
      ) *
        1000,

    user: {
      sub:
        String(
          profileClaims.sub ??
            accessClaims.sub ??
            'unknown-user'
        ),

      name:
        typeof profileClaims.name ===
        'string'
          ? profileClaims.name
          : undefined,

      email:
        typeof profileClaims.email ===
        'string'
          ? profileClaims.email
          : undefined,

      picture:
        typeof profileClaims.picture ===
        'string'
          ? profileClaims.picture
          : undefined,
    },
  };

  persistAuthSession(
    session
  );

  clearRequestState();

  window.history
    .replaceState(
      {},
      '',
      window.location
        .pathname
    );

  return session;
}

export function logoutFromAuth(): void {
  clearAuthSession();

  const {
    domain,
    clientId,
  } = getAuthConfig();

  if (
    !domain ||
    !clientId
  ) {
    window.location.assign(
      '/'
    );

    return;
  }

  const logoutUrl =
    new URL(
      `${domain}/v2/logout`
    );

  logoutUrl.searchParams
    .set(
      'client_id',
      clientId
    );

  logoutUrl.searchParams
    .set(
      'returnTo',
      window.location.origin
    );

  window.location.assign(
    logoutUrl.toString()
  );
}