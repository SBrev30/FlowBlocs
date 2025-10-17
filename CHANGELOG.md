# Changelog

All notable changes to FlowBlocs will be documented in this file.

## [1.0.0] - 2025-10-17

### Changed
- **Rebranded**: Changed project name from "Notion Infinite Canvas" to "FlowBlocs"
- **Collapsible Sidebar**: Added sidebar collapse/expand functionality
  - Click the sidebar toggle button to collapse/expand
  - Icon flips direction based on state (using react-icons/go)
  - Sidebar state persists across sessions via localStorage
  - Smooth animation transitions
  - Collapsed sidebar shows only the toggle button (48px width)

### Added
- `react-icons` package for better icon support
- Sidebar collapse button with `GoSidebarCollapse` icon
- localStorage persistence for sidebar collapsed state
- CSS transitions for smooth sidebar animations

### Technical Details
- Updated `manifest.json` name field
- Updated `package.json` name field
- Updated `Sidebar.tsx` component structure
- Added new CSS classes for collapsed state
- Modified `App.tsx` to manage sidebar state
- Updated README.md with new branding

### Files Modified
- `/manifest.json` - Updated extension name
- `/package.json` - Updated package name and added react-icons
- `/src/App.tsx` - Added sidebar state management
- `/src/components/Sidebar/Sidebar.tsx` - Restructured for collapse functionality
- `/src/components/Sidebar/Sidebar.css` - Added collapsed state styles
- `/README.md` - Updated branding
