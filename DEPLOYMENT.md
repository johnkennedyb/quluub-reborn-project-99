# 🚀 Full-Stack Deployment Guide

## 🌟 Full-Stack Vercel Deployment (Recommended)

This will deploy both your React frontend and Node.js backend to the same domain, eliminating CORS issues completely.

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/johnkennedyb/quluub-reborn-project-99)

### Option 2: Manual Full-Stack Deployment

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"

2. **Import Your Repository**
   - Click "Import Git Repository"
   - Select `johnkennedyb/quluub-reborn-project-99`
   - Vercel will auto-detect it's a full-stack app

3. **Configure Deployment**
   - Framework Preset: **Vite** (auto-detected)
   - Root Directory: **/** (leave default)
   - Build Command: **npm run vercel-build** (auto-detected)
   - Output Directory: **dist** (auto-detected)

4. **Set Environment Variables**
   Click "Environment Variables" and add:
   
   **Required for Backend:**
   - `MONGODB_URI` = `mongodb+srv://johnkennedy3313:johnkennedy@cluster0.kqk80xr.mongodb.net/quluub?retryWrites=true&w=majority`
   - `JWT_SECRET` = `quluub_secret_key_123456789`
   - `NODE_ENV` = `production`
   
   **Payment Integration:**
   - `STRIPE_SECRET_API_KEY` = `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`
   - `PAYSTACK_SECRET_API_KEY` = `sk_live_92f26ac052547db6826c7f7a471c5ea72e4004b6`
   
   **Email Configuration:**
   - `MAIL_USER` = `admin@quluub.com`
   - `MAIL_PASSWORD` = `Q!mok@JX1?1GProd`
   
   **Optional:**
   - `ADMIN_SIGNUP_KEY` = `admin123`

5. **Deploy**
   - Click "Deploy" button
   - Wait 3-5 minutes for deployment to complete
   - Your full-stack app will be live!

## 🎯 **What You Get with Full-Stack Deployment**

✅ **Same Domain**: Frontend and backend on `https://your-app.vercel.app`  
✅ **No CORS Issues**: Frontend calls `/api` endpoints directly  
✅ **Serverless Backend**: Auto-scaling Node.js functions  
✅ **File Uploads**: Handled by backend functions  
✅ **Real-time Features**: Socket.IO support  
✅ **Database**: MongoDB Atlas connection  
✅ **Payments**: Stripe & Paystack integration  
✅ **Email**: Automated sending capabilities  

## 🌐 **Your Live URLs**

After deployment:
- **Main App**: `https://quluub-reborn-project-99.vercel.app`
- **API Endpoints**: `https://quluub-reborn-project-99.vercel.app/api/*`
- **Admin Panel**: `https://quluub-reborn-project-99.vercel.app/admin`
- **File Uploads**: `https://quluub-reborn-project-99.vercel.app/uploads/*`

## 📱 **Features Ready to Test**

✅ **User Features:**
- Registration & Login
- Profile Management  
- User Discovery & Matching
- Real-time Messaging
- Video Calling
- Payment Integration (Stripe & Paystack)

✅ **Admin Features:**
- User Management
- Analytics Dashboard
- Email Management with attachments
- Push Notifications
- Content Moderation
- VIP Matching

## 🔧 **Configuration Files**

- `vercel.json` - Full-stack deployment configuration
- `backend/server.js` - Serverless-ready Express app
- `package.json` - Contains `vercel-build` script

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check `MONGODB_URI` environment variable
   - Ensure IP whitelist includes Vercel IPs or use 0.0.0.0/0

2. **API Routes Not Working**
   - Verify `vercel.json` configuration
   - Check function logs in Vercel dashboard

3. **Frontend Build Errors**
   - Run `npm run build` locally to test
   - Check for TypeScript errors

### Support
- Create an issue in the GitHub repository
- Check Vercel function logs for backend errors
- Use browser developer tools for frontend debugging

## 📊 Performance Notes

- Frontend is statically served from CDN
- Backend functions have 30-second timeout
- Database connection pooling is handled automatically
- Consider upgrading to Vercel Pro for higher limits

## 🔄 Updates

To update the live site:
1. Push changes to GitHub
2. Vercel will automatically redeploy
3. Check deployment status in Vercel dashboard