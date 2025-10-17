# Troubleshooting Guide

Common issues and solutions for the Notion Infinite Canvas extension.

## Authentication Issues

### "Authentication failed" Error

**Symptoms**: After clicking "Sign in with Notion", you get an error message.

**Possible causes**:
1. Incorrect Client ID or Secret
2. Backend endpoint not accessible
3. Redirect URI mismatch

**Solutions**:

1. **Verify your .env file**:
   ```env
   VITE_NOTION_CLIENT_ID=your_actual_client_id
   VITE_NOTION_REDIRECT_URI=chrome-extension://YOUR_EXTENSION_ID/index.html
   VITE_BACKEND_TOKEN_ENDPOINT=https://your-backend.com/api/notion/token
   ```

2. **Test your backend endpoint**:
   ```bash
   curl -X POST https://your-backend.com/api/notion/token \
     -H "Content-Type: application/json" \
     -d '{"code":"test","redirect_uri":"test"}'
   ```
   You should get a response (even if it's an error) - not a 404.

3. **Check Notion integration settings**:
   - Go to https://www.notion.so/my-integrations
   - Verify redirect URI matches exactly: `chrome-extension://YOUR_EXTENSION_ID/index.html`
   - Ensure Client ID matches your .env file

4. **Rebuild and reload**:
   ```bash
   npm run build
   ```
   Then reload the extension in Chrome.

### OAuth Loop (Keeps Redirecting)

**Symptoms**: After authorizing, the page keeps redirecting back to Notion.

**Solution**:
1. Check browser console for errors (F12)
2. Verify your backend is returning the access token correctly
3. Check that Chrome storage permissions are enabled in manifest.json
4. Clear Chrome storage:
   ```javascript
   // In browser console
   chrome.storage.sync.clear()
   chrome.storage.local.clear()
   ```

### "Invalid Client" Error from Notion

**Symptoms**: Notion shows "Invalid Client" during OAuth.

**Solutions**:
1. Verify Client ID is correct in .env
2. Check that the integration type is set correctly (Internal/Public)
3. Ensure you've saved the integration in Notion
4. Try creating a new integration from scratch

## Database Issues

### No Databases Appearing

**Symptoms**: After authentication, the sidebar shows "No databases found".

**This is expected!** Notion's security model requires explicit sharing.

**Solution**:
1. Open a database in Notion
2. Click the "..." menu (three dots) in top right
3. Select "Add connections"
4. Find "Notion Infinite Canvas"
5. Click "Confirm"
6. Refresh the extension (reload the new tab)

### Database Won't Expand

**Symptoms**: Clicking on a database does nothing.

**Solutions**:
1. Check browser console for errors
2. Verify the database has pages in it
3. Check Notion API rate limits (3 requests/second)
4. Try refreshing the page

### Pages Not Loading

**Symptoms**: Database expands but shows loading spinner forever.

**Solutions**:
1. Check browser console for API errors
2. Verify you have internet connection
3. Check Notion service status: https://status.notion.so
4. Try signing out and back in

## Canvas Issues

### Can't Drop Pages on Canvas

**Symptoms**: Dragging pages from sidebar doesn't work.

**Solutions**:
1. Make sure you're dragging over the canvas area (not sidebar)
2. Check that JavaScript is enabled
3. Try refreshing the page
4. Check browser console for errors

### Nodes Don't Appear After Drop

**Symptoms**: Drop seems to work but no node appears.

**Solutions**:
1. Try zooming out (might be off-screen)
2. Check browser console for errors
3. Click "Fit View" button in toolbar
4. Try dropping again in center of viewport

### Canvas Not Saving

**Symptoms**: Nodes disappear after closing/reopening tab.

**Solutions**:
1. Check Chrome storage permissions in manifest.json
2. Verify storage isn't full:
   ```javascript
   // In browser console
   chrome.storage.sync.getBytesInUse(null, (bytes) => {
     console.log(`Used: ${bytes} / ${chrome.storage.sync.QUOTA_BYTES}`);
   });
   ```
3. Try clearing old data:
   ```javascript
   chrome.storage.local.clear();
   ```
4. Check browser console for storage errors

### Canvas Performance Issues

**Symptoms**: Canvas is slow or laggy with many nodes.

**Solutions**:
1. Reduce number of nodes (ReactFlow optimizes up to ~100 nodes)
2. Close other Chrome tabs
3. Disable browser extensions temporarily
4. Check memory usage in Task Manager
5. Try restarting Chrome

## Extension Loading Issues

### Extension Won't Load

**Symptoms**: "Load unpacked" fails or extension doesn't appear.

**Solutions**:
1. Make sure you built the extension:
   ```bash
   npm run build
   ```
2. Select the `dist` folder (not the root project folder)
3. Check that manifest.json exists in dist folder
4. Look for errors in the Extensions page
5. Try removing and re-adding the extension

### Extension ID Keeps Changing

**Symptoms**: Extension ID changes every time you reload.

**This is normal for unpacked extensions in development.**

**Solutions**:
1. After each ID change, update .env:
   ```env
   VITE_NOTION_REDIRECT_URI=chrome-extension://NEW_ID/index.html
   ```
2. Rebuild: `npm run build`
3. Update Notion integration redirect URI
4. For production, published extensions have stable IDs

### Icons Not Showing

**Symptoms**: Extension shows default Chrome icon.

**This is expected - icons are placeholders.**

**Solution**:
See [ICONS_PLACEHOLDER.md](./ICONS_PLACEHOLDER.md) for creating real icons.

Quick fix:
```bash
# Create simple colored squares (requires ImageMagick)
convert -size 16x16 xc:#4a9eff public/icons/icon-16.png
convert -size 48x48 xc:#4a9eff public/icons/icon-48.png
convert -size 128x128 xc:#4a9eff public/icons/icon-128.png
npm run build
```

## Build Issues

### Build Fails

**Symptoms**: `npm run build` fails with errors.

**Solutions**:

1. **Clear node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check Node version**:
   ```bash
   node --version  # Should be 16+
   ```

3. **TypeScript errors**:
   - Check for syntax errors in .tsx files
   - Run: `npm run typecheck`

4. **Out of memory**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

### Vite Config Issues

**Symptoms**: Build succeeds but extension doesn't work.

**Solutions**:
1. Verify vite.config.ts matches the repository version
2. Check that manifest.json is being copied to dist
3. Ensure public folder exists and is configured

## Backend Issues

### Backend Not Responding

**Symptoms**: Authentication fails immediately.

**Solutions**:

1. **Test backend health**:
   ```bash
   curl https://your-backend.com/health
   ```

2. **Check backend logs** (depends on hosting provider):
   - Vercel: Check Function Logs in dashboard
   - Railway: Check Deployments → Logs
   - Heroku: `heroku logs --tail`

3. **Verify CORS is enabled**:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
   ```

4. **Test token exchange**:
   ```bash
   curl -X POST https://your-backend.com/api/notion/token \
     -H "Content-Type: application/json" \
     -d '{"code":"test_code","redirect_uri":"test_uri"}'
   ```

### Environment Variables Not Set

**Symptoms**: Backend returns 401 or authentication errors.

**Solutions**:
1. Check environment variables in hosting dashboard
2. Verify they match your Notion integration
3. Redeploy after adding variables:
   ```bash
   vercel --prod  # for Vercel
   ```

## Theme Issues

### Dark Mode Not Working

**Symptoms**: Theme toggle doesn't change appearance.

**Solutions**:
1. Check that variables.css is imported in index.css
2. Verify data-theme attribute is being set:
   ```javascript
   // In browser console
   document.documentElement.getAttribute('data-theme')
   ```
3. Clear browser cache and hard reload (Ctrl+Shift+R)

### Colors Look Wrong

**Symptoms**: Colors don't match expected theme.

**Solutions**:
1. Check CSS variable definitions in src/styles/variables.css
2. Verify variable names match in component CSS files
3. Clear browser cache
4. Check for CSS conflicts with other extensions

## General Debugging

### Enable Detailed Logging

Add this to see more information:

```javascript
// In src/lib/notion-api.ts, add to makeNotionRequest:
console.log('Notion API Request:', endpoint);
console.log('Response:', response);
```

### Check Chrome Storage

```javascript
// In browser console (F12)
chrome.storage.sync.get(null, (data) => {
  console.log('Sync storage:', data);
});

chrome.storage.local.get(null, (data) => {
  console.log('Local storage:', data);
});
```

### Clear All Data

```javascript
// In browser console
chrome.storage.sync.clear();
chrome.storage.local.clear();
localStorage.clear();
location.reload();
```

### Network Debugging

1. Open DevTools (F12)
2. Go to Network tab
3. Try the failing action
4. Look for failed requests (red)
5. Click on the request to see details

## Getting Help

If none of these solutions work:

1. **Check browser console** (F12) for error messages
2. **Check backend logs** for server errors
3. **Verify all setup steps** in SETUP.md were followed
4. **Try with a fresh Notion integration**
5. **Test in an incognito window** (disables other extensions)

### Creating a Bug Report

Include:
- Chrome version
- Extension version
- Steps to reproduce
- Browser console errors
- Network tab screenshot
- Backend logs (if applicable)

## Known Limitations

1. **Extension ID changes** in development (normal behavior)
2. **Icons are placeholders** (need to be created)
3. **Content editing not yet implemented** (Phase 4 feature)
4. **No real-time updates** (Phase 5 feature)
5. **Backend required** (can't use OAuth without server)

## Quick Fixes Checklist

When something isn't working, try these in order:

- [ ] Hard refresh the page (Ctrl+Shift+R)
- [ ] Check browser console for errors
- [ ] Verify .env file has correct values
- [ ] Rebuild the extension (`npm run build`)
- [ ] Reload extension in chrome://extensions/
- [ ] Clear Chrome storage (see code above)
- [ ] Sign out and sign back in
- [ ] Restart Chrome
- [ ] Check internet connection
- [ ] Verify Notion service status

## Still Having Issues?

1. Review the complete [SETUP.md](./SETUP.md) guide
2. Check [QUICKSTART.md](./QUICKSTART.md) for simplified setup
3. Read the [README.md](./README.md) for general information
4. Check [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) for known issues

---

**Remember**: Most issues are due to configuration mismatches (Extension ID, Client ID, redirect URI). Double-check these first!
