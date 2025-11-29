# WorkDrive Fix - Deployment Instructions

## Issues Fixed

### 1. Folder Navigation ✅
- **Before:** Required double-click to open folders
- **After:** Single click now opens folders
- Files: `app/dashboard/workdrive/workdrive-client.tsx`

### 2. File Access Authorization Error ✅
- **Before:** Files showed XML error: `<Error><Code>InvalidArgument</Code><Message>Authorization</Message></Error>`
- **After:** Files now accessible through worker URL with proper public access
- Files: `worker.js`

### 3. File Click Behavior ✅
- **Before:** Required double-click to preview files
- **After:** Single click opens files in new tab
- Files: `app/dashboard/workdrive/workdrive-client.tsx`

## Deployment Steps

### Step 1: Deploy Updated Worker to Cloudflare

The worker code has been updated to return the worker URL instead of the R2 internal URL. You need to deploy this update:

```bash
# Make sure you're in the project root
cd /Users/welfbenbury/Documents/01-labs/fleet/ddd-flee-manage

# Deploy the updated worker to Cloudflare
npx wrangler deploy
```

**Or if wrangler is installed globally:**
```bash
wrangler deploy
```

### Step 2: Test the Fix

1. **Test Folder Navigation:**
   - Go to WorkDrive page
   - Create a test folder
   - **Single click** on the folder - it should open immediately

2. **Test File Upload and Access:**
   - Upload a PDF file
   - **Single click** on the file - it should open in a new tab
   - The file should display correctly (no XML error)

3. **Test File Download:**
   - Right-click on any file
   - Select "Download" from the menu
   - File should download successfully

## Technical Changes

### Worker.js Changes (Lines 81-93)

**Before:**
```javascript
// Returned R2 internal URL (not publicly accessible)
const publicUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`
```

**After:**
```javascript
// Returns worker URL (publicly accessible via worker GET endpoint)
const workerUrl = `${url.origin}/${key}`
```

### WorkDrive Client Changes

**Folder Navigation (Line 362):**
```javascript
// Before: onDoubleClick={() => navigateToFolder(folder.id)}
// After:  onClick={() => navigateToFolder(folder.id)}
```

**File Click (Line 412):**
```javascript
// Before: onDoubleClick={() => setPreviewDocument(doc)}
// After:  onClick={() => window.open(doc.file_url, '_blank')}
```

## How It Works

### File Access Flow

1. **Upload:**
   - File is uploaded to Cloudflare R2 via worker
   - Worker returns: `https://fleet-r2-upload.mrolabola.workers.dev/workdrive/filename.pdf`

2. **Download/View:**
   - User clicks on file
   - Browser requests: `https://fleet-r2-upload.mrolabola.workers.dev/workdrive/filename.pdf`
   - Worker handles GET request (no auth required - line 20-32 in worker.js)
   - Worker fetches file from R2 and returns it to browser

3. **Why This Works:**
   - Worker acts as a proxy between browser and R2
   - GET requests don't require authentication
   - PUT/POST requests require `X-Auth-Key` header
   - This allows public read access while keeping write access secure

## Verification

After deployment, check:
- [ ] Worker deployed successfully to Cloudflare
- [ ] Folders open with single click
- [ ] Files open in new tab with single click
- [ ] PDFs display correctly (no XML error)
- [ ] Downloads work properly
- [ ] File URLs start with worker URL (not R2 URL)

## Environment Variables

Make sure these are set in Cloudflare Worker:
- `AUTH_KEY` - Secret key for upload authentication
- `BUCKET` - R2 bucket binding (already configured in wrangler.toml)

## Troubleshooting

### Files still show authorization error:
- Make sure you deployed the updated worker: `wrangler deploy`
- Check worker logs in Cloudflare dashboard
- Verify worker URL in environment variables matches deployed worker

### New uploads still use old URL format:
- Clear browser cache
- Upload a new file to test
- Old files will keep old URLs (you may need to re-upload)

### Worker deployment fails:
- Make sure you're logged in: `wrangler login`
- Check wrangler.toml configuration
- Verify bucket name matches your R2 bucket
