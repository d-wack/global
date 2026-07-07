"use client";

import { useUser } from "@auth0/nextjs-auth0";

import { cn } from "@/lib/utils";

/** The user's initial for the avatar: first letter of name, else email, else "?". */
function initial(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  return source ? source[0]!.toUpperCase() : "?";
}

/**
 * Signed-in account chip for the master widget footer: a mono initial avatar,
 * the user's name/email, and a logout link.
 *
 * Open mode: with Auth0 unconfigured there is no session, so {@link useUser}
 * returns no user and this renders nothing — the shell looks exactly as before.
 * Login is implicit (anonymous users never reach the app when Auth0 is on), so
 * there is no login affordance here. Per the v4 SDK, logout is a plain `<a>`.
 */
export function AccountChip() {
  const { user } = useUser();

  if (!user) return null;

  const label = user.name ?? user.email ?? "Signed in";

  return (
    <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
      <span
        aria-hidden
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded",
          "bg-emerald-400/15 font-mono text-[11px] font-medium text-emerald-300",
          "ring-1 ring-emerald-400/30",
        )}
      >
        {initial(user.name, user.email)}
      </span>
      <span
        className="min-w-0 flex-1 truncate text-xs text-white/70"
        title={label}
      >
        {label}
      </span>
      <a
        href="/auth/logout"
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] tracking-[0.15em]",
          "text-white/40 transition-colors hover:bg-white/5 hover:text-red-300",
        )}
      >
        LOGOUT
      </a>
    </div>
  );
}
