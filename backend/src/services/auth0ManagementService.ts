import { config } from '../config/config.js';
import { AppError } from '../types/index.js';

interface ManagementTokenResponse {
  access_token?: string;
  expires_in?: number;
}

export interface Auth0ManagementUser {
  user_id: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  last_ip?: string;
  logins_count?: number;
  identities?: Array<{
    connection?: string;
    provider?: string;
    user_id?: string;
    isSocial?: boolean;
  }>;
}

let cachedToken = '';
let tokenExpiresAt = 0;

function auth0BaseUrl(): string {
  const domain = config.auth0Domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');

  if (!domain) {
    throw new AppError(
      'Auth0 domain is not configured.',
      500
    );
  }

  return `https://${domain}`;
}

async function getManagementToken(): Promise<string> {
  const now = Date.now();

  if (
    cachedToken &&
    tokenExpiresAt > now + 60_000
  ) {
    return cachedToken;
  }

  if (
    !config.auth0ManagementClientId ||
    !config.auth0ManagementClientSecret
  ) {
    throw new AppError(
      'Auth0 Management API credentials are not configured.',
      500
    );
  }

  const baseUrl = auth0BaseUrl();

  const response = await fetch(
    `${baseUrl}/oauth/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id:
          config.auth0ManagementClientId,
        client_secret:
          config.auth0ManagementClientSecret,
        audience:
          `${baseUrl}/api/v2/`,
        grant_type:
          'client_credentials',
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();

    console.error(
      'Auth0 Management token error:',
      response.status,
      text
    );

    throw new AppError(
      'Unable to authenticate with the Auth0 Management API.',
      502
    );
  }

  const body =
    (await response.json()) as
      ManagementTokenResponse;

  if (!body.access_token) {
    throw new AppError(
      'Auth0 did not return a Management API token.',
      502
    );
  }

  cachedToken =
    body.access_token;

  tokenExpiresAt =
    now +
    Math.max(
      (body.expires_in ?? 3600) - 60,
      60
    ) *
      1000;

  return cachedToken;
}

async function managementFetch<T>(
  path: string
): Promise<T> {
  const token =
    await getManagementToken();

  const response = await fetch(
    `${auth0BaseUrl()}/api/v2${path}`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
        Accept:
          'application/json',
      },
    }
  );

  if (!response.ok) {
    const text =
      await response.text();

    console.error(
      'Auth0 Management API error:',
      response.status,
      text
    );

    if (response.status === 403) {
      throw new AppError(
        'The Auth0 Management application does not have the required permissions.',
        502
      );
    }

    throw new AppError(
      'Unable to load users from Auth0.',
      502
    );
  }

  return (await response.json()) as T;
}

export async function listAuth0Users(
  page = 0,
  perPage = 50,
  search = ''
): Promise<{
  users: Auth0ManagementUser[];
  total: number;
}> {
  const params =
    new URLSearchParams();

  params.set(
    'page',
    String(page)
  );

  params.set(
    'per_page',
    String(
      Math.min(
        Math.max(perPage, 1),
        100
      )
    )
  );

  params.set(
    'include_totals',
    'true'
  );

  params.set(
    'fields',
    [
      'user_id',
      'email',
      'email_verified',
      'name',
      'nickname',
      'picture',
      'created_at',
      'updated_at',
      'last_login',
      'last_ip',
      'logins_count',
      'identities',
    ].join(',')
  );

  params.set(
    'include_fields',
    'true'
  );

  const trimmedSearch =
    search.trim();

  if (trimmedSearch) {
    const escaped =
      trimmedSearch.replace(
        /([\\+\-&|!(){}[\]^"~*?:/])/g,
        '\\$1'
      );

    params.set(
      'q',
      `email:*${escaped}* OR name:*${escaped}* OR nickname:*${escaped}*`
    );

    params.set(
      'search_engine',
      'v3'
    );
  }

  const result =
    await managementFetch<{
      users?: Auth0ManagementUser[];
      total?: number;
    }>(
      `/users?${params.toString()}`
    );

  return {
    users:
      result.users ?? [],
    total:
      result.total ?? 0,
  };
}

export async function getAuth0User(
  userId: string
): Promise<Auth0ManagementUser> {
  return managementFetch<Auth0ManagementUser>(
    `/users/${encodeURIComponent(userId)}`
  );
}
