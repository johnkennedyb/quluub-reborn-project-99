# 🚀 Full-Stack Deployment Steps

## 🎯 **Goal: Deploy Complete App to Single Domain**

Deploy both your React frontend AND Node.js backend to the same Vercel domain:

**Your app will be available at:** `https://quluub-reborn-project-99.vercel.app`
- **Frontend**: React app served from root `/`
- **Backend**: Node.js API endpoints at `/api/*` (serverless functions)
- **Uploads**: File access at `/uploads/*`
- **Database**: MongoDB Atlas connection
- **No CORS issues**: Same domain = no cross-origin problems

## 📋 **Step-by-Step Deployment**

### Step 1: Go to Vercel
1. Visit: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "**Add New Project**"

### Step 2: Import Repository
1. Click "**Import Git Repository**"
2. Search for: `quluub-reborn-project-99`
3. Click "**Import**" next to your repository

### Step 3: Configure Project
Vercel will auto-detect settings, but verify:
- **Framework Preset**: Vite ✅
- **Root Directory**: / ✅  
- **Build Command**: `npm run vercel-build` ✅
- **Output Directory**: dist ✅

### Step 4: Add Environment Variables

Click "**Environment Variables**" and add these **exactly**:

```
MONGODB_URI = mongodb+srv://johnkennedy3313:johnkennedy@cluster0.kqk80xr.mongodb.net/quluub?retryWrites=true&w=majority

JWT_SECRET = quluub_secret_key_123456789

NODE_ENV = production

STRIPE_SECRET_API_KEY = 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

PAYSTACK_SECRET_API_KEY = sk_live_92f26ac052547db6826c7f7a471c5ea72e4004b6

MAIL_USER = admin@quluub.com

MAIL_PASSWORD = Q!mok@JX1?1GProd

ADMIN_SIGNUP_KEY = admin123
```

### Step 5: Deploy
1. Click "**Deploy**" button
2. Wait 3-5 minutes for deployment
3. You'll see "**Deployment Completed**" ✅

## 🎉 **Testing Your Live App**

### Test User Features:
1. Visit: `https://quluub-reborn-project-99.vercel.app`
2. Click "**Register**" - create new account
3. Complete signup process
4. Login and browse profiles
5. Test messaging
6. Try admin login: `/admin`

### Test API Endpoints:
- Health check: `https://quluub-reborn-project-99.vercel.app/api/health`
- Should return: `{"status": "OK", ...}`

## 🔧 **What's Deployed**

✅ **Frontend (React)**:
- Landing page
- User registration/login
- Profile browsing
- Messaging interface
- Admin dashboard

✅ **Backend (Node.js)**:
- Authentication APIs
- User management
- Chat system
- Payment processing
- Email system
- File uploads

✅ **Database**:
- MongoDB Atlas connection
- All existing data preserved

## 🆘 **If Something Goes Wrong**

### Deployment Fails:
1. Check "**Function**" logs in Vercel dashboard
2. Look for error messages
3. Common fix: Redeploy with corrected environment variables

### API Not Working:
1. Test: `https://your-app.vercel.app/api/health`
2. Check browser console for errors
3. Verify environment variables are set correctly

### Need to Update:
1. Push changes to GitHub
2. Vercel auto-redeploys
3. No manual intervention needed

## 🎯 **Expected Result**

After successful deployment:
- ✅ Complete matrimonial app live
- ✅ User registration/login working
- ✅ Profile browsing functional
- ✅ Admin panel accessible
- ✅ Payment system ready
- ✅ Email notifications working
- ✅ No CORS errors
- ✅ Fast global CDN delivery

**Your full-stack app will be production-ready!** 🚀