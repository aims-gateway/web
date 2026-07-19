// Admin API key for `x-admin-key`-gated backend endpoints.
// Production sets NEXT_PUBLIC_ADMIN_KEY at build time; without it the dev
// fallback only works locally (backend accepts aims_admin_dev_* when
// AIMS_ADMIN_KEY_HASH is unset). In production, unset => admin calls 403.
export const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || "aims_admin_dev_test";
