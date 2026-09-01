import { apiFetch } from './client';

export interface AdminUserIdentity {
  connection?: string;
  provider?: string;
  user_id?: string;
  isSocial?: boolean;
}

export interface AdminUser {
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
  identities?: AdminUserIdentity[];
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}

export function getAdminUsers(
  search = ''
): Promise<AdminUsersResponse> {
  const params =
    new URLSearchParams();

  if (search.trim()) {
    params.set(
      'search',
      search.trim()
    );
  }

  const query =
    params.toString();

  return apiFetch<AdminUsersResponse>(
    `/admin/users${query ? `?${query}` : ''}`
  );
}

export function getAdminUser(
  userId: string
): Promise<AdminUser> {
  return apiFetch<AdminUser>(
    `/admin/users/${encodeURIComponent(userId)}`
  );
}
