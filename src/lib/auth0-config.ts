/**
 * Whether Auth0 is wired up, decided purely from env vars.
 *
 * Deliberately free of any `@auth0/nextjs-auth0` import so that OPEN MODE code
 * paths can ask "is auth on?" without loading (and warning from) the SDK client.
 * When this returns false the whole app runs in open mode: the proxy is a no-op
 * and session lookups resolve to an anonymous (undefined) user.
 */
export function isAuth0Configured(): boolean {
  return Boolean(
    process.env.AUTH0_DOMAIN &&
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_SECRET,
  );
}
