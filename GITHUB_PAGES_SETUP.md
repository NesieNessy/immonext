# GitHub Pages Deployment Setup

Your ImmoNext app is now configured for automatic deployment to GitHub Pages! 🚀

## What Was Done

✅ Created GitHub Actions workflow (`.github/workflows/deploy.yml`)
✅ Configured Next.js for GitHub Pages with correct base path
✅ Set up automatic deployment on every push to `main` branch

## Setup Steps

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### 2. Enable GitHub Pages

1. Go to your repository: https://github.com/NesieNessy/immonext
2. Click on **Settings** tab
3. In the left sidebar, click **Pages**
4. Under **Source**, select: **GitHub Actions**
5. Save the settings

### 3. Wait for Deployment

- The GitHub Action will automatically run when you push
- Check the **Actions** tab to see the deployment progress
- First deployment takes ~2-3 minutes

### 4. Access Your Live Site

Your site will be available at:
**https://nesienessy.github.io/immonext/**

## How It Works

- Every time you push to the `main` branch, GitHub Actions will:
  1. Install dependencies
  2. Build your Next.js app (`npm run build`)
  3. Deploy the `out` folder to GitHub Pages

## Making Updates

To update your live site:

1. Make changes to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. GitHub will automatically rebuild and deploy!

## Monitoring Deployments

- Go to the **Actions** tab in your GitHub repository
- You'll see each deployment's status
- Click on any workflow run to see detailed logs

## Local Testing

Before pushing, test locally:
```bash
npm run build
```

Then manually check the `out` folder or run a local server.

## Troubleshooting

If the deployment fails:
1. Check the **Actions** tab for error logs
2. Ensure all dependencies are in `package.json`
3. Make sure the build completes successfully locally first

---

**Ready to deploy?** Just commit and push your changes! 🎉
