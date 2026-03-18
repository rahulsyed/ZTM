# ⚠️ IMPORTANT: IAG Logo File Placement

## For the Logo to Display Correctly:

### The logo file **IAG-Logo-Bakgrnd-1.png** MUST be placed in the SAME directory as your index.html file.

## File Structure Should Look Like:

```
your-website-folder/
├── index.html (or index_final_complete.html renamed)
└── IAG-Logo-Bakgrnd-1.png
```

## ✅ If Logo is Not Showing:

### 1. Check File Location
- Ensure `IAG-Logo-Bakgrnd-1.png` is in the same folder as your HTML file
- File names are case-sensitive! Make sure it's exactly: `IAG-Logo-Bakgrnd-1.png`

### 2. For Web Hosting
When uploading to a web server:
- Upload BOTH files to the same directory
- Example:
  - `public_html/index.html`
  - `public_html/IAG-Logo-Bakgrnd-1.png`

### 3. For Testing Locally
- Open the HTML file from your computer
- Make sure the logo PNG file is in the same folder
- Clear your browser cache (Ctrl+Shift+Delete)
- Refresh the page (Ctrl+F5)

### 4. Mobile Testing
- The logo should now display correctly on mobile
- Logo sizes:
  - Desktop: 80px (header), 100px (footer)
  - Tablet (768px): 60px (header), 80px (footer)
  - Mobile (480px): 50px (header), 70px (footer)

## 🔧 If Still Not Working:

### Option A: Use Full Path (if you know your website URL)
Replace:
```html
<img src="IAG-Logo-Bakgrnd-1.png" ...>
```

With:
```html
<img src="https://yourwebsite.com/IAG-Logo-Bakgrnd-1.png" ...>
```

### Option B: Upload to Image Hosting
1. Upload logo to image hosting (e.g., Imgur, Google Drive, Cloudinary)
2. Get the direct image URL
3. Replace `IAG-Logo-Bakgrnd-1.png` with the full URL

Example:
```html
<img src="https://i.imgur.com/yourimage.png" ...>
```

## 📱 Mobile-Specific Improvements Made:

✅ Added `display: block` to ensure visibility
✅ Added `max-width: 100%` to prevent overflow
✅ Added `object-fit: contain` to maintain aspect ratio
✅ Added explicit height and width properties
✅ Improved responsive sizing with media queries
✅ Added padding adjustments so title doesn't overlap logo

## 🧪 How to Test:

### Desktop:
1. Open index.html in browser
2. Logo should appear in top-right corner (80px)
3. Logo should appear in footer (100px)

### Mobile:
1. Open on phone OR resize browser window to < 768px
2. Logo should appear in top-right (60px on tablet, 50px on phone)
3. Logo should appear in footer (80px on tablet, 70px on phone)
4. Title should not overlap logo

## 📞 Need Help?

Contact tournament organizers:
- PJ: 832-436-3286
- Vanith: 864-525-2695
- Anish: 864-906-0604

---

**Remember**: Both files (HTML and PNG) must be in the same directory!
