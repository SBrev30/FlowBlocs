# Icon Placeholders

The extension currently references icon files that need to be created:

- `public/icons/icon-16.png` - 16x16 pixels
- `public/icons/icon-48.png` - 48x48 pixels
- `public/icons/icon-128.png` - 128x128 pixels

## Creating Icons

You can create these icons using:

1. **Design tools**: Figma, Adobe Illustrator, Sketch
2. **Online generators**: favicon.io, realfavicongenerator.net
3. **AI tools**: Use an AI image generator to create a logo

## Icon Guidelines

- Use a simple, recognizable design
- Make sure it works at small sizes (16x16)
- Use a transparent background
- Consider both light and dark mode visibility
- Common themes for this extension:
  - Infinite/canvas symbol (∞)
  - Grid or network pattern
  - Notion-style icon with spatial elements

## Temporary Workaround

If you want to test the extension without icons:

1. Create simple colored square PNG files:
   ```bash
   # Requires ImageMagick installed
   convert -size 16x16 xc:#4a9eff public/icons/icon-16.png
   convert -size 48x48 xc:#4a9eff public/icons/icon-48.png
   convert -size 128x128 xc:#4a9eff public/icons/icon-128.png
   ```

2. Or manually create simple PNG files in any image editor

The extension will still work without icons, but Chrome may show a placeholder.
