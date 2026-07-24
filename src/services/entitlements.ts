const BACKEND_URL = 'https://lcm-backend-production-efd1.up.railway.app';

export const linkAccount = async (email: string, supabaseUserId: string) => {
  const response = await fetch(`${BACKEND_URL}/api/link-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, supabaseUserId }),
  });
  return response.json();
};

export const checkEntitlementStatus = async (supabaseUserId: string) => {
  const response = await fetch(`${BACKEND_URL}/api/entitlement-status/${supabaseUserId}`);
  return response.json();
};