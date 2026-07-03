/**
 * Set while useLogout runs so the axios 401 interceptor doesn't fight the
 * logout navigation with its own signOut + redirect to /login.
 */
let active = false;

export function setLoggingOut(value: boolean): void {
  active = value;
}

export function isLoggingOut(): boolean {
  return active;
}
