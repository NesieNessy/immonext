# How to Share Your ImmoNext Application

Your application has been exported as static HTML files in the `out` folder!

## 📁 What Was Created

The `out` folder contains:
- `index.html` - Your main application page
- `_next/` - JavaScript, CSS, and other assets
- All necessary static files

## 🌐 Ways to Share Your Application

### Option 1: Share via GitHub Pages (Recommended)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Add ImmoNext real estate app"
   git push origin main
   ```

2. Go to your GitHub repository settings
3. Navigate to "Pages" section
4. Set source to: Deploy from branch → `main` → `/out` folder
5. Your site will be live at: `https://nesienessy.github.io/immonext/`

### Option 2: Deploy to Vercel (Easiest)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts - your site will be live in seconds!

### Option 3: Deploy to Netlify

1. Create account at https://netlify.com
2. Drag and drop the `out` folder to Netlify
3. Your site is live!

### Option 4: Share via Local Network

Start a simple HTTP server:
```bash
cd out
npx serve
```

Share the network URL with others on your network.

### Option 5: Deploy to Azure Static Web Apps

1. Install Azure CLI
2. Run:
   ```bash
   az staticwebapp create --name immonext --resource-group myResourceGroup --source ./out
   ```

## 📝 Current Export Location

Your static files are in: `C:\Users\Q420150\immonext\out`

The main file is: `out/index.html`

## 🔄 Updating the Export

Whenever you make changes:
1. Update your code
2. Run: `npm run build`
3. Redeploy the `out` folder

## 🎯 Quick Test Locally

To test the exported site locally:
```bash
cd out
npx serve
```

Then open http://localhost:3000 in your browser.
