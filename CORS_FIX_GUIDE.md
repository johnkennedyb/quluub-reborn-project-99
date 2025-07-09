# 🔧 CORS Fix Guide

## Issue
Your frontend (`https://quluub-reborn-project-99.vercel.app`) cannot connect to your backend because the backend CORS is only configured for `quluub-reborn-project-33.vercel.app`.

## ✅ Quick Fix Solution

### Step 1: Update Your Backend Environment Variables

Add your new frontend domain to your existing backend's `CLIENT_URL` environment variable:

**Current:**
```
CLIENT_URL=https://quluub-reborn-project-33.vercel.app,http://localhost:8080
```

**Updated:**
```
CLIENT_URL=https://quluub-reborn-project-33.vercel.app,https://quluub-reborn-project-99.vercel.app,http://localhost:8080
```

### Step 2: Update Frontend Configuration

I've already updated your frontend to connect to your existing backend:
- Frontend will now connect to: `https://quluub-reborn-project-33-8lca.onrender.com/api`
- This uses your existing database and all configurations

### Step 3: Deploy Changes

```bash
# Push the updated CORS configuration
git add .
git commit -m "Update CORS to support new frontend domain"
git push

# If you have the backend repository separately, update it there too
```

### Step 4: Redeploy

1. **Redeploy your backend** (Render) with the updated `CLIENT_URL`
2. **Redeploy your frontend** (Vercel) to get the updated API client

## 🎯 Expected Result

After these changes:
- ✅ No CORS errors
- ✅ Frontend connects to your existing backend
- ✅ Uses your existing MongoDB database
- ✅ All payment and email configurations work
- ✅ Admin panel accessible

## 🚀 Your Live URLs

- **Frontend**: `https://quluub-reborn-project-99.vercel.app`
- **Backend**: `https://quluub-reborn-project-33-8lca.onrender.com`
- **Database**: Your existing MongoDB Atlas cluster

## 🔄 Alternative: Environment Variable Approach

Instead of hardcoding, you can also set in Vercel:
- **Environment Variable**: `VITE_API_URL`
- **Value**: `https://quluub-reborn-project-33-8lca.onrender.com/api`

## 🆘 If You Still Get CORS Errors

1. **Wait 2-3 minutes** after backend deployment for changes to take effect
2. **Clear browser cache** (Ctrl+F5 or Cmd+Shift+R)
3. **Check Network tab** in browser dev tools to see which URL is being called
4. **Verify backend logs** to ensure CORS configuration is loaded correctly

## 📱 Test Your Site

Once deployed, you should be able to:
- ✅ Register new accounts
- ✅ Login with existing accounts
- ✅ Browse profiles
- ✅ Send messages
- ✅ Use admin panel
- ✅ Process payments

Your site should be fully functional!