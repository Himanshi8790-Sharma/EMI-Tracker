# Signup Shows the Previous User

## Problem

After a new person signs up, the dashboard can show the first or previous person who logged in instead of the newly registered person.

## Root Cause

The signup flow creates the new account but does not create a login session for that account.

The frontend signup success handler currently navigates directly to the dashboard after calling the register endpoint. It does not replace these values in browser storage:

- `kist_token`
- `kist_user`

If an older session exists, the old JWT token remains in `kist_token`. The API client sends that token with protected requests, so the backend correctly identifies the old user. The dashboard also reads the old profile from `kist_user`.

This is an authentication session problem, not a Prisma user-creation problem.

## Current Flow

```text
Signup form
  -> POST /api/auth/register
  -> New user is created
  -> Frontend navigates directly to /dashboard
  -> Old token and old profile remain in localStorage
  -> Protected APIs identify the old user
  -> Dashboard displays the old user
```

## Affected Files

### `frontend/src/pages/AuthPage.tsx`

The signup success handler navigates directly to `/dashboard`:

```ts
onSuccess: () => {
  // account created message
  navigate("/dashboard");
}
```

The signup response only contains the created user ID. It does not contain a JWT token or complete user session.

### `frontend/src/utils/api.ts`

The Axios interceptor reads the token from local storage and sends it with every request:

```ts
const token = localStorage.getItem("kist_token");

if (token) {
  req.headers.Authorization = `Bearer ${token}`;
}
```

Therefore, an old token is still used after signup.

### `backend/controller/authController.js`

The register controller creates the user but does not log the user in. The login controller creates the JWT token and returns the user data.

## Recommended Fix

Use this flow:

```text
Signup succeeds
  -> Show account-created message
  -> Switch to the login form or navigate to the login page
  -> User logs in with the new account
  -> Save the new JWT in `kist_token`
  -> Save the new profile in `kist_user`
  -> Navigate to `/dashboard`
```

This is the smallest fix because the existing login flow already stores the correct token and user profile.

## Alternative Fix

The backend can automatically log in the new user after registration by returning a JWT and user data from the register endpoint. The frontend would then need to save both values exactly as it does after login.

That approach is also valid, but it changes the registration API contract and should be implemented deliberately.

## Expected Result After Fix

When a new person registers and logs in:

- Protected API requests contain the new person’s JWT.
- `req.user.id` identifies the new person.
- The dashboard loads loans and payments for the new person.
- The dashboard displays the new person’s name and email.
- No previous user data is reused.

## Verification Checklist

1. Log in as User A.
2. Log out or clear the session if logout is available.
3. Register User B.
4. Log in as User B.
5. Confirm that `kist_token` changes.
6. Confirm that `kist_user` contains User B.
7. Confirm that dashboard and protected API data belong to User B.
8. Repeat with User C to ensure the application does not keep User B’s identity.
