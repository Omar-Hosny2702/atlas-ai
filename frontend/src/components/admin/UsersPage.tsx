import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowLeft,
  CheckCircle2,
  Search,
  Shield,
  UserRound,
  XCircle,
} from 'lucide-react';

import {
  getAdminUsers,
  type AdminUser,
} from '@/api/adminApi';

interface UsersPageProps {
  onBack: () => void;
}

function formatDate(
  value?: string
): string {
  if (!value) return 'Never';

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  ).format(date);
}

function providerLabel(
  user: AdminUser
): string {
  const provider =
    user.identities?.[0]
      ?.provider;

  if (!provider) {
    return 'Unknown';
  }

  const names:
    Record<string, string> = {
      'google-oauth2':
        'Google',
      auth0:
        'Auth0',
      apple:
        'Apple',
      windowslive:
        'Microsoft',
      facebook:
        'Facebook',
      github:
        'GitHub',
    };

  return (
    names[provider] ??
    provider
  );
}

export function UsersPage({
  onBack,
}: UsersPageProps) {
  const [
    users,
    setUsers,
  ] =
    useState<
      AdminUser[]
    >([]);

  const [
    total,
    setTotal,
  ] =
    useState(0);

  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    selected,
    setSelected,
  ] =
    useState<
      AdminUser | null
    >(null);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          let cancelled =
            false;

          setLoading(true);
          setError(null);

          void getAdminUsers(
            search
          )
            .then(
              (result) => {
                if (
                  cancelled
                ) {
                  return;
                }

                setUsers(
                  result.users
                );

                setTotal(
                  result.total
                );
              }
            )
            .catch(
              (err) => {
                if (
                  cancelled
                ) {
                  return;
                }

                setError(
                  err instanceof
                    Error
                    ? err.message
                    : 'Unable to load users.'
                );
              }
            )
            .finally(
              () => {
                if (
                  !cancelled
                ) {
                  setLoading(
                    false
                  );
                }
              }
            );

          return () => {
            cancelled =
              true;
          };
        },
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [search]);

  const visibleUsers =
    useMemo(
      () => users,
      [users]
    );

  return (
    <div
      className="
        flex h-full min-h-0
        bg-[#f7f7f8]
        text-[#17181c]
        dark:bg-[#090b10]
        dark:text-white
      "
    >
      <section
        className="
          flex min-w-0 flex-1
          flex-col overflow-hidden
        "
      >
        <header
          className="
            flex min-h-[72px]
            items-center gap-4
            border-b
            border-black/10
            bg-white/80
            px-6
            backdrop-blur
            dark:border-white/10
            dark:bg-[#0d1016]/90
          "
        >
          <button
            type="button"
            onClick={
              onBack
            }
            className="
              inline-flex h-10 w-10
              items-center
              justify-center
              rounded-lg
              border
              border-black/10
              transition
              hover:bg-black/[0.04]
              dark:border-white/10
              dark:hover:bg-white/[0.06]
            "
            aria-label="Back to Atlas"
          >
            <ArrowLeft
              size={18}
            />
          </button>

          <div>
            <div
              className="
                flex items-center
                gap-2
              "
            >
              <Shield
                size={18}
              />

              <h1
                className="
                  text-xl
                  font-semibold
                "
              >
                User Management
              </h1>
            </div>

            <p
              className="
                mt-0.5 text-xs
                text-black/50
                dark:text-white/45
              "
            >
              Auth0 users connected
              to Atlas AI
            </p>
          </div>
        </header>

        <div
          className="
            flex min-h-0 flex-1
            flex-col p-6
          "
        >
          <div
            className="
              mb-5 flex
              flex-col gap-4
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-2xl
                  font-semibold
                "
              >
                Users
              </h2>

              <p
                className="
                  mt-1 text-sm
                  text-black/50
                  dark:text-white/45
                "
              >
                {total}{' '}
                {total === 1
                  ? 'user'
                  : 'users'}
              </p>
            </div>

            <div
              className="
                relative w-full
                sm:w-[340px]
              "
            >
              <Search
                size={17}
                className="
                  pointer-events-none
                  absolute left-3.5
                  top-1/2
                  -translate-y-1/2
                  text-black/35
                  dark:text-white/35
                "
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search users..."
                className="
                  h-11 w-full
                  rounded-lg border
                  border-black/10
                  bg-white pl-10 pr-4
                  text-sm outline-none
                  transition
                  focus:border-black/25
                  dark:border-white/10
                  dark:bg-white/[0.04]
                  dark:focus:border-white/25
                "
              />
            </div>
          </div>

          <div
            className="
              min-h-0 flex-1
              overflow-auto
              rounded-xl border
              border-black/10
              bg-white
              dark:border-white/10
              dark:bg-[#0d1016]
            "
          >
            {error ? (
              <div
                className="
                  p-8 text-sm
                  text-red-500
                "
              >
                {error}
              </div>
            ) : loading ? (
              <div
                className="
                  p-8 text-sm
                  text-black/50
                  dark:text-white/45
                "
              >
                Loading Auth0
                users…
              </div>
            ) : (
              <table
                className="
                  w-full
                  min-w-[850px]
                  border-collapse
                  text-left
                "
              >
                <thead>
                  <tr
                    className="
                      border-b
                      border-black/10
                      bg-black/[0.02]
                      text-xs
                      uppercase
                      tracking-wide
                      text-black/45
                      dark:border-white/10
                      dark:bg-white/[0.025]
                      dark:text-white/40
                    "
                  >
                    <th
                      className="
                        px-5 py-3
                        font-medium
                      "
                    >
                      User
                    </th>

                    <th
                      className="
                        px-5 py-3
                        font-medium
                      "
                    >
                      Provider
                    </th>

                    <th
                      className="
                        px-5 py-3
                        font-medium
                      "
                    >
                      Verified
                    </th>

                    <th
                      className="
                        px-5 py-3
                        font-medium
                      "
                    >
                      Logins
                    </th>

                    <th
                      className="
                        px-5 py-3
                        font-medium
                      "
                    >
                      Last Login
                    </th>

                    <th
                      className="
                        px-5 py-3
                        font-medium
                      "
                    >
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleUsers.map(
                    (user) => (
                      <tr
                        key={
                          user.user_id
                        }
                        onClick={() =>
                          setSelected(
                            user
                          )
                        }
                        className="
                          cursor-pointer
                          border-b
                          border-black/[0.06]
                          transition
                          last:border-b-0
                          hover:bg-black/[0.025]
                          dark:border-white/[0.06]
                          dark:hover:bg-white/[0.035]
                        "
                      >
                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-3
                            "
                          >
                            {user.picture ? (
                              <img
                                src={
                                  user.picture
                                }
                                alt=""
                                className="
                                  h-9 w-9
                                  rounded-full
                                  object-cover
                                "
                              />
                            ) : (
                              <div
                                className="
                                  flex h-9 w-9
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-black/[0.05]
                                  dark:bg-white/[0.07]
                                "
                              >
                                <UserRound
                                  size={17}
                                />
                              </div>
                            )}

                            <div
                              className="
                                min-w-0
                              "
                            >
                              <p
                                className="
                                  truncate
                                  text-sm
                                  font-medium
                                "
                              >
                                {user.name ??
                                  user.nickname ??
                                  'Unnamed user'}
                              </p>

                              <p
                                className="
                                  truncate
                                  text-xs
                                  text-black/45
                                  dark:text-white/40
                                "
                              >
                                {user.email ??
                                  user.user_id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td
                          className="
                            px-5 py-4
                            text-sm
                          "
                        >
                          {providerLabel(
                            user
                          )}
                        </td>

                        <td
                          className="
                            px-5 py-4
                          "
                        >
                          {user.email_verified ? (
                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-xs
                                text-emerald-600
                                dark:text-emerald-400
                              "
                            >
                              <CheckCircle2
                                size={15}
                              />
                              Verified
                            </span>
                          ) : (
                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-xs
                                text-black/45
                                dark:text-white/40
                              "
                            >
                              <XCircle
                                size={15}
                              />
                              No
                            </span>
                          )}
                        </td>

                        <td
                          className="
                            px-5 py-4
                            text-sm
                          "
                        >
                          {user.logins_count ??
                            0}
                        </td>

                        <td
                          className="
                            px-5 py-4
                            text-sm
                            text-black/60
                            dark:text-white/55
                          "
                        >
                          {formatDate(
                            user.last_login
                          )}
                        </td>

                        <td
                          className="
                            px-5 py-4
                            text-sm
                            text-black/60
                            dark:text-white/55
                          "
                        >
                          {formatDate(
                            user.created_at
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}

            {!loading &&
              !error &&
              visibleUsers.length ===
                0 && (
                <div
                  className="
                    p-10 text-center
                    text-sm
                    text-black/45
                    dark:text-white/40
                  "
                >
                  No users found.
                </div>
              )}
          </div>
        </div>
      </section>

      {selected && (
        <>
          <button
            type="button"
            aria-label="Close user details"
            onClick={() =>
              setSelected(
                null
              )
            }
            className="
              fixed inset-0
              z-40
              bg-black/30
              backdrop-blur-[1px]
            "
          />

          <aside
            className="
              fixed bottom-0
              right-0 top-0
              z-50
              w-full
              max-w-[430px]
              overflow-y-auto
              border-l
              border-black/10
              bg-white
              p-6
              shadow-2xl
              dark:border-white/10
              dark:bg-[#0d1016]
            "
          >
            <div
              className="
                flex
                justify-end
              "
            >
              <button
                type="button"
                onClick={() =>
                  setSelected(
                    null
                  )
                }
                className="
                  rounded-lg
                  px-3 py-2
                  text-sm
                  text-black/55
                  transition
                  hover:bg-black/[0.05]
                  dark:text-white/50
                  dark:hover:bg-white/[0.06]
                "
              >
                Close
              </button>
            </div>

            <div
              className="
                mt-4 flex
                flex-col
                items-center
                text-center
              "
            >
              {selected.picture ? (
                <img
                  src={
                    selected.picture
                  }
                  alt=""
                  className="
                    h-20 w-20
                    rounded-full
                    object-cover
                  "
                />
              ) : (
                <div
                  className="
                    flex h-20 w-20
                    items-center
                    justify-center
                    rounded-full
                    bg-black/[0.05]
                    dark:bg-white/[0.07]
                  "
                >
                  <UserRound
                    size={30}
                  />
                </div>
              )}

              <h3
                className="
                  mt-4 text-xl
                  font-semibold
                "
              >
                {selected.name ??
                  selected.nickname ??
                  'Unnamed user'}
              </h3>

              <p
                className="
                  mt-1 text-sm
                  text-black/50
                  dark:text-white/45
                "
              >
                {selected.email ??
                  'No email'}
              </p>
            </div>

            <div
              className="
                mt-8 space-y-5
              "
            >
              {[
                [
                  'User ID',
                  selected.user_id,
                ],
                [
                  'Provider',
                  providerLabel(
                    selected
                  ),
                ],
                [
                  'Email verified',
                  selected.email_verified
                    ? 'Yes'
                    : 'No',
                ],
                [
                  'Login count',
                  String(
                    selected.logins_count ??
                      0
                  ),
                ],
                [
                  'Last login',
                  formatDate(
                    selected.last_login
                  ),
                ],
                [
                  'Created',
                  formatDate(
                    selected.created_at
                  ),
                ],
                [
                  'Last IP',
                  selected.last_ip ??
                    'Unknown',
                ],
              ].map(
                ([
                  label,
                  value,
                ]) => (
                  <div
                    key={
                      label
                    }
                  >
                    <p
                      className="
                        text-xs
                        font-medium
                        uppercase
                        tracking-wide
                        text-black/40
                        dark:text-white/35
                      "
                    >
                      {label}
                    </p>

                    <p
                      className="
                        mt-1
                        break-all
                        text-sm
                      "
                    >
                      {value}
                    </p>
                  </div>
                )
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
