# Security issue #4 — avatar storage ownership enforcement

## Production outcome

Applied `20261010063931_avatar_owner_enforcement.sql`. Only ownership policies on the `avatars` bucket changed. Issue #5 onward is not included.

- Avatar inserts require an authenticated identity, matching stored owner metadata and an owner-specific object path.
- Avatar updates validate both the existing object and replacement state. Changing the name/owner cannot redirect a write to another account.
- Supports the current uploader's `avatars/{user UUID}-{timestamp}.{extension}` path and the `{user UUID}/...` owner-directory format.
- Uses `owner_id` as the current Storage ownership field, with legacy `owner` UUID fallback.
- Restrictive insert/update/delete guards prevent broader permissive policies from reopening cross-user avatar access.
- No administrator-role exception grants browser clients ownership of another account's avatar.
- Public avatar viewing remains unchanged. Existing policy behavior for other buckets and trusted service access remains unchanged.
- No new permissive deletion policy was added. The restrictive deletion guard prevents future broader policies from allowing deletion of another owner's avatar.

## Verification

- Disposable PostgreSQL metadata fixture: **23 assertions passed**.
- Tests include cross-user inserts/overwrites/deletes, owner/path replacement attacks, missing ownership, anonymous access, current/legacy upload paths and owner fields, public viewing and trusted service access.
- Deliberately broad permissive fixture policy verifies that the restrictive ownership guards cannot be OR-bypassed.
- Prior security regression fixtures passed: issue #1 **70**, issue #2 **93**, issue #3 **46** assertions.
- Production read-only ownership checks: **8/8 passed**.
- Production avatar object metadata, bucket configuration and all unrelated storage policies were unchanged.
- The production avatar bucket contained no objects at inspection. No existing objects were moved, deleted or reassigned.
- No real file was uploaded or overwritten during verification; upload compatibility was tested using disposable database metadata, not a production Storage API upload.

## Scope

This database-only fix required no frontend deployment because the existing avatar-upload helper path is supported.

The current admin Settings profile-photo handler uploads through `question-images`, not the `avatars` bucket. Those images were not migrated, and that bucket's existing admin permissions were not changed here. This fix does not claim universal ownership enforcement for every image bucket.

MIME allowlists, size limits and SVG handling are separate issue #9 and remain untouched.