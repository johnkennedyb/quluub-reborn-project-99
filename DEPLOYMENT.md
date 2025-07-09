# 🚀 Deployment Guide

## Quick Deploy to Vercel

### Option 1: One-Click Deploy (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/johnkennedyb/quluub-reborn-project-99)

### Option 2: Manual Deployment

1. **Fork/Clone the repository**
   ```bash
   git clone https://github.com/johnkennedyb/quluub-reborn-project-99.git
   cd quluub-reborn-project-99
   ```

2. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   In your Vercel dashboard, go to Settings > Environment Variables and add:
   
   **Required:**
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string for JWT tokens
   
   **Optional (for full functionality):**
   - `SMTP_HOST` - Email server host
   - `SMTP_PORT` - Email server port  
   - `SMTP_USER` - Email username
   - `SMTP_PASS` - Email password
   - `STRIPE_SECRET_KEY` - Stripe payment key
   - `PAYSTACK_SECRET_KEY` - Paystack payment key
   - `GOOGLE_CLIENT_ID` - Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## 📋 Pre-Deployment Checklist

### Database Setup
1. **MongoDB Atlas** (Recommended):
   - Create account at [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a new cluster
   - Get connection string
   - Add to `MONGODB_URI` environment variable

### Domain Configuration
1. Update CORS origins in `backend/server.js` if using custom domain
2. Update `VITE_API_URL` in environment variables

## 🔧 Configuration Files

- `vercel.json` - Vercel deployment configuration
- `.env.example` - Environment variables template
- `package.json` - Contains `vercel-build` script

## 🌐 Live Demo

Once deployed, your application will be available at:
- **Vercel URL**: `https://quluub-reborn-project-99.vercel.app`

## 📱 Features Available

✅ **User Features:**
- Registration & Login
- Profile Management
- User Discovery & Matching
- Real-time Messaging
- Video Calling
- Payment Integration

✅ **Admin Features:**
- User Management
- Analytics Dashboard
- Email Management
- Push Notifications
- Content Moderation

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