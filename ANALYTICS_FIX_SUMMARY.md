# Analytics API 400 Error - Bug Fix Summary

## Problem
The analytics dashboard was receiving HTTP 400 Bad Request errors when trying to fetch data from:
- `/hospital_4/api/analytics/analytics.php?resource=dashboard`
- `/hospital_4/api/analytics/analytics.php?resource=statistics`
- `/hospital_4/api/analytics/analytics.php?resource=payroll-summary`

Error message:
```
Error loading dashboard data from API, falling back to static data: Error: HTTP error while loading analytics (400, 400, 400)
```

## Root Cause
The issue was caused by improper routing and .htaccess configuration:

1. The main API `.htaccess` at `/api/` was rewriting all requests through `index.php`
2. The `api/index.php` router did not have any routes for `analytics/analytics.php`
3. This caused requests to return a 404 error instead of being routed to the analytics API

## Fixes Applied

### 1. Updated `/api/.htaccess`
Added a specific exception for the analytics directory to allow direct access:

```htaccess
# Allow analytics directory and its files to be accessed directly
RewriteRule ^analytics/ - [L]
```

This rule prevents the analytics directory from being rewritten, allowing the analytics.php file to be served directly.

### 2. Updated `/api/index.php`
- Added code to strip `.php` extension from parsed paths to ensure proper route matching
- Added routes for analytics endpoints to the routes array:
  - `analytics` → `analytics/analytics.php`
  - `analytics/analytics` → `analytics/analytics.php`
  - `v1/analytics/dashboard` → `analytics/analytics.php`
  - `v1/analytics/metrics` → `analytics/analytics.php`
  - `v1/analytics/statistics` → `analytics/analytics.php`
  - `v1/analytics/payroll-summary` → `analytics/analytics.php`
  - `v1/analytics/reports` → `analytics/analytics.php`

### 3. Fixed `/api/analytics/analytics.php`
- Changed from using `require` to instantiating a new mysqli connection to avoid double-loading the database.php file

## Testing
To verify the fixes work:

1. Navigate to the analytics dashboard
2. Check browser console - you should no longer see 400 errors
3. Analytics data should load successfully instead of falling back to static data
4. The fetch requests to `/hospital_4/api/analytics/analytics.php?resource=*` should now return 200 OK with valid JSON responses

## Files Modified
1. `/api/.htaccess` - Added analytics directory bypass rule
2. `/api/index.php` - Added analytics routes and improved path parsing
3. `/api/analytics/analytics.php` - Fixed double database require issue

## Technical Notes
- The .htaccess rewrite rule `RewriteRule ^analytics/ - [L]` with `-` means "don't rewrite" and `[L]` means "last rule"
- This allows the existing RewriteCond conditions (!-f, !-d) to properly handle file existence checking
- The analytics.php file has its own .htaccess that allows direct access, which now works correctly with the parent directory rule
