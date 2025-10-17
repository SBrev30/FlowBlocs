# Deployment Checklist

Use this checklist to deploy the Notion Infinite Canvas extension from development to production.

## Pre-Deployment

### 1. Backend Setup
- [ ] Deploy backend server (Vercel/Railway/Heroku recommended)
- [ ] Set environment variables:
  - [ ] `NOTION_CLIENT_ID`
  - [ ] `NOTION_CLIENT_SECRET`
  - [ ] `PORT` (if needed)
- [ ] Test token exchange endpoint
- [ ] Verify CORS is configured correctly
- [ ] Set up error logging/monitoring
- [ ] Note backend URL: `____________________`

### 2. Notion Integration
- [ ] Create Notion integration at https://www.notion.so/my-integrations
- [ ] Set integration name: "Notion Infinite Canvas"
- [ ] Choose integration type:
  - [ ] Internal (for testing/private use)
  - [ ] Public (for Chrome Web Store distribution)
- [ ] Enable capabilities:
  - [ ] Read content
  - [ ] Update content
  - [ ] Insert content
  - [ ] Read user information
- [ ] Copy Client ID: `____________________`
- [ ] Copy Client Secret: `____________________`

### 3. Extension Icons
- [ ] Create icon-16.png (16x16 pixels)
- [ ] Create icon-48.png (48x48 pixels)
- [ ] Create icon-128.png (128x128 pixels)
- [ ] Place icons in `public/icons/` folder
- [ ] Verify icons look good on both light and dark backgrounds

### 4. Initial Build
- [ ] Clone/download the repository
- [ ] Run `npm install`
- [ ] Create `.env` file from `.env.example`
- [ ] Fill in temporary values:
  ```env
  VITE_NOTION_CLIENT_ID=your_client_id
  VITE_NOTION_REDIRECT_URI=chrome-extension://TEMP/index.html
  VITE_BACKEND_TOKEN_ENDPOINT=https://your-backend.com/api/notion/token
  ```
- [ ] Run `npm run build`
- [ ] Verify `dist/` folder is created
- [ ] Verify `dist/manifest.json` exists

## Chrome Extension Setup

### 5. Load Extension in Chrome
- [ ] Open Chrome: `chrome://extensions/`
- [ ] Enable "Developer mode" toggle
- [ ] Click "Load unpacked"
- [ ] Select `dist/` folder
- [ ] Extension appears in list
- [ ] Copy Extension ID: `____________________`

### 6. Update Configuration
- [ ] Update `.env` with real Extension ID:
  ```env
  VITE_NOTION_REDIRECT_URI=chrome-extension://YOUR_EXTENSION_ID/index.html
  ```
- [ ] Rebuild: `npm run build`
- [ ] Reload extension in Chrome (click refresh icon)

### 7. Update Notion Integration
- [ ] Go to Notion integration settings
- [ ] Add redirect URI: `chrome-extension://YOUR_EXTENSION_ID/index.html`
- [ ] Save integration
- [ ] Verify it appears in redirect URIs list

## Testing

### 8. Authentication Test
- [ ] Open new tab in Chrome
- [ ] Extension loads without errors
- [ ] Click "Sign in with Notion"
- [ ] Redirects to Notion authorization page
- [ ] Shows correct integration name
- [ ] Shows correct capabilities
- [ ] Click "Select pages"
- [ ] Choose at least one database
- [ ] Click "Allow access"
- [ ] Redirects back to extension
- [ ] Shows user profile in sidebar
- [ ] No errors in browser console

### 9. Database Access Test
- [ ] At least one database appears in sidebar
- [ ] Click to expand database
- [ ] Pages load successfully
- [ ] Database icon/emoji displays correctly
- [ ] Page titles display correctly

### 10. Canvas Test
- [ ] Drag a page from sidebar
- [ ] Drop onto canvas
- [ ] Node appears at drop location
- [ ] Node shows page title
- [ ] Node shows page icon (if any)
- [ ] Click "Expand" button
- [ ] Node expands to show more
- [ ] Click external link icon
- [ ] Opens page in Notion (new tab)
- [ ] Click collapse button
- [ ] Node returns to small size

### 11. Canvas Controls Test
- [ ] Zoom in/out works
- [ ] Pan with mouse works
- [ ] Minimap shows nodes
- [ ] "Fit view" button works
- [ ] Theme toggle works
- [ ] Dark mode looks correct
- [ ] Light mode looks correct

### 12. Persistence Test
- [ ] Create several nodes on canvas
- [ ] Arrange them in a pattern
- [ ] Close the tab
- [ ] Open new tab
- [ ] Nodes appear in same positions
- [ ] Canvas state is restored

### 13. Multi-Database Test
- [ ] Share 3+ databases with integration
- [ ] All databases appear in sidebar
- [ ] Can expand all databases
- [ ] Can drag from any database
- [ ] Mixed nodes work together on canvas

### 14. Error Handling Test
- [ ] Sign out and sign in again (works correctly)
- [ ] Try with no databases shared (shows empty state)
- [ ] Disable internet (shows appropriate error)
- [ ] Re-enable internet (recovers gracefully)
- [ ] All errors show user-friendly messages

## Documentation

### 15. Required Documents
- [ ] Privacy Policy created (URL: `____________________`)
- [ ] Support email set up: `____________________`
- [ ] README.md is up to date
- [ ] SETUP.md covers all steps
- [ ] Screenshots taken for documentation
- [ ] Demo video created (optional but recommended)

## Chrome Web Store Preparation

### 16. Developer Account
- [ ] Create Chrome Web Store developer account
- [ ] Pay $5 one-time registration fee
- [ ] Account verified and active

### 17. Store Assets
- [ ] Extension icons (already created in step 3)
- [ ] Small promotional tile: 440x280px
- [ ] Marquee promotional image: 1400x560px (optional)
- [ ] Screenshots: 1280x800px or 640x400px (at least 1 required)
  - [ ] Screenshot 1: Main canvas view
  - [ ] Screenshot 2: Sidebar with databases
  - [ ] Screenshot 3: Expanded node view
  - [ ] Screenshot 4: Dark mode
  - [ ] Screenshot 5: Theme toggle/settings
- [ ] Promotional video: YouTube link (optional)

### 18. Store Listing
- [ ] Write compelling title (max 45 characters)
  - Suggestion: "Notion Infinite Canvas - Visual Organization"
- [ ] Write short description (132 characters)
  - Suggestion: "Transform Notion databases into visual canvases. Drag, arrange, and organize your pages spatially."
- [ ] Write detailed description (max 16,000 characters)
  - [ ] Include features list
  - [ ] Include setup instructions
  - [ ] Include use cases
  - [ ] Include screenshots references
- [ ] Select category: "Productivity"
- [ ] Add relevant tags/keywords
- [ ] Set language: English (and others if translated)

### 19. Package for Upload
- [ ] Ensure production build is current: `npm run build`
- [ ] Create zip file:
  ```bash
  cd dist
  zip -r ../notion-canvas-v1.0.0.zip .
  cd ..
  ```
- [ ] Verify zip contents:
  ```bash
  unzip -l notion-canvas-v1.0.0.zip
  ```
- [ ] Should contain:
  - [ ] index.html
  - [ ] manifest.json
  - [ ] assets/ folder
  - [ ] icons/ folder

## Submission

### 20. Chrome Web Store Submission
- [ ] Go to Chrome Web Store Developer Dashboard
- [ ] Click "New Item"
- [ ] Upload zip file
- [ ] Complete all required fields
- [ ] Upload all assets
- [ ] Add privacy policy URL
- [ ] Add support URL/email
- [ ] Review all information
- [ ] Submit for review
- [ ] Note submission date: `____________________`

### 21. Review Process
- [ ] Wait for review (typically 1-3 business days)
- [ ] Check email for review updates
- [ ] Address any feedback from Chrome team
- [ ] Resubmit if needed
- [ ] Wait for approval

### 22. Post-Approval
- [ ] Publish extension (if not auto-published)
- [ ] Verify extension appears in Chrome Web Store
- [ ] Test installation from Chrome Web Store
- [ ] Verify all features work in published version
- [ ] Note Chrome Web Store URL: `____________________`

## Launch

### 23. Marketing & Announcement
- [ ] Prepare launch announcement
- [ ] Share on social media platforms:
  - [ ] Twitter/X
  - [ ] LinkedIn
  - [ ] Reddit (r/Notion, r/chrome)
  - [ ] Facebook
- [ ] Submit to Product Hunt
- [ ] Post in Notion communities:
  - [ ] Notion Discord
  - [ ] Notion Facebook groups
  - [ ] Notion subreddit
- [ ] Reach out to tech bloggers/reviewers
- [ ] Send to personal network
- [ ] Add to extension directories

### 24. Monitoring Setup
- [ ] Set up analytics tracking (if implemented)
- [ ] Monitor Chrome Web Store reviews
- [ ] Set up email notifications for reviews
- [ ] Monitor error logs in backend
- [ ] Track installation numbers
- [ ] Set up user feedback collection

## Post-Launch

### 25. First Week
- [ ] Respond to all reviews
- [ ] Monitor for critical bugs
- [ ] Check backend performance
- [ ] Verify API rate limits aren't exceeded
- [ ] Collect user feedback
- [ ] Note installation count: `____________________`

### 26. Ongoing Maintenance
- [ ] Check reviews weekly
- [ ] Respond to user feedback
- [ ] Track feature requests
- [ ] Plan updates and improvements
- [ ] Keep dependencies updated
- [ ] Monitor Notion API for changes

## Version Control

### 27. Git Repository
- [ ] Create GitHub repository
- [ ] Push all code
- [ ] Create release tag: v1.0.0
- [ ] Write release notes
- [ ] Add README with screenshots
- [ ] Add LICENSE file (MIT recommended)
- [ ] Add CONTRIBUTING.md (if open source)

## Compliance

### 28. Legal Requirements
- [ ] Privacy policy published
- [ ] Terms of service (if needed)
- [ ] Compliance with Chrome Web Store policies
- [ ] Compliance with Notion API terms
- [ ] No trademark violations
- [ ] All assets properly licensed

## Success Metrics

### 29. Track These Metrics
- [ ] Total installations
- [ ] Daily active users (DAU)
- [ ] Weekly active users (WAU)
- [ ] Average rating
- [ ] Number of reviews
- [ ] User retention rate
- [ ] Average session length
- [ ] Nodes created per user
- [ ] Most popular features

## Rollback Plan

### 30. Emergency Procedures
- [ ] Document how to unpublish extension
- [ ] Keep previous version zip file
- [ ] Have backend rollback procedure
- [ ] Communication plan for critical bugs
- [ ] Contact information for support

---

## Completion Status

- [ ] All checklist items completed
- [ ] Extension published to Chrome Web Store
- [ ] Launch announcement made
- [ ] Monitoring active
- [ ] Ready for users!

**Launch Date**: `____________________`

**Chrome Web Store URL**: `____________________`

**Extension ID (Production)**: `____________________`

---

## Notes

Use this space to track additional notes, issues, or reminders:

```
[Your notes here]
```

## Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
- [Chrome Extension Publishing Guide](https://developer.chrome.com/docs/webstore/publish/)
- [Notion API Terms](https://developers.notion.com/docs/terms-of-service)
- [Project Documentation](./README.md)
