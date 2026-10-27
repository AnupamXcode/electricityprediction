# 🚀 Deploying Smart Energy AI to Vercel

The application has been built with **React 19 + Vite**, optimized with client-side ML polynomial inference, and configured with `vercel.json` for seamless deployment.

---

## Method 1: Deploy via GitHub (Recommended & Free)

1. Push your repository to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Smart Energy AI React platform"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. Go to [https://vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** ➔ **"Project"**.
4. Import your GitHub repository.
5. In **Framework Preset**, select **Vite** (Vercel will auto-detect it).
6. Set **Root Directory** to `frontend` (or leave default root — `vercel.json` handles both).
7. Click **Deploy**! 
8. In ~30 seconds, your application will be live at `https://<your-project>.vercel.app` with an official SSL certificate, global CDN, and automatic updates on every push.

---

## Method 2: Deploy via Vercel CLI

Run the following command from your terminal:
```bash
cd frontend
npx vercel
```
- Log in to your Vercel account when prompted in the browser.
- Accept the default options by pressing **Enter**.
- To deploy to production:
  ```bash
  npx vercel --prod
  ```
