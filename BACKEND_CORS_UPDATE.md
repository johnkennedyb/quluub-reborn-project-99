# 🔧 Backend CORS Update Instructions

## Problem
Your new frontend at `https://quluub-reborn-project-99.vercel.app` can't connect to your existing backend at `https://quluub-reborn-project-33-8lca.onrender.com` due to CORS restrictions.

## ✅ Solution: Update Backend Environment Variable

### Step 1: Update Your Render Backend
1. Go to your Render dashboard
2. Find your backend service: `quluub-reborn-project-33-8lca`
3. Go to Environment Variables
4. Find `CLIENT_URL` variable

### Step 2: Update CLIENT_URL Value

**Current Value:**
```
CLIENT_URL=https://quluub-reborn-project-33.vercel.app,http://localhost:8080
```

**New Value (add your new domain):**
```
CLIENT_URL=https://quluub-reborn-project-33.vercel.app,https://quluub-reborn-project-99.vercel.app,http://localhost:8080
```

### Step 3: Redeploy Backend
1. After updating the environment variable
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait 2-3 minutes for deployment to complete

## 🎯 Expected Result

After the backend redeploys:
- ✅ Your new frontend can connect to existing backend
- ✅ CORS errors will disappear
- ✅ Login/signup will work
- ✅ All features functional

## 🚀 Alternative: Quick Frontend Fix

If you can't access the backend, I've already updated the frontend code to connect to your existing backend. Just redeploy your Vercel frontend and it should work.

## 📱 Test After Fix

1. Visit: `https://quluub-reborn-project-99.vercel.app`
2. Try to login/register
3. Should work without CORS errors!

## 🔄 For Full-Stack Deployment

If you want to use the full-stack deployment instead:
1. Uncomment the appropriate line in `src/lib/api-client.ts`
2. Deploy both frontend and backend to same Vercel domain
3. Add all environment variables to Vercel