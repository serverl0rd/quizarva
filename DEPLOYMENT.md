# Vercel Deployment Guide

## Environment Variables

Ensure these environment variables are set in your Vercel project settings:

### Required Variables

1. **Authentication**
   - `NEXTAUTH_URL` - Set to your production URL (e.g., https://quizarva.vercel.app)
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

2. **Database (Vercel Postgres)**
   - `POSTGRES_URL` - Automatically added when you connect Vercel Postgres
   - `POSTGRES_PRISMA_URL` - Automatically added (optimized for Prisma)
   - `POSTGRES_URL_NON_POOLING` - Automatically added
   - `POSTGRES_USER` - Automatically added
   - `POSTGRES_HOST` - Automatically added
   - `POSTGRES_PASSWORD` - Automatically added
   - `POSTGRES_DATABASE` - Automatically added

3. **Vercel KV (Redis)**
   - `KV_URL` - Automatically added when you connect Vercel KV
   - `KV_REST_API_URL` - Automatically added
   - `KV_REST_API_TOKEN` - Automatically added
   - `KV_REST_API_READ_ONLY_TOKEN` - Automatically added

4. **Vercel Blob Storage**
   - `BLOB_READ_WRITE_TOKEN` - From Vercel Blob dashboard

### Optional Variables
   - `DIRECT_URL` - Set to `POSTGRES_URL_NON_POOLING` value for migrations

## Pre-deployment Checklist

1. **Ensure all environment variables are set in Vercel dashboard**
2. **Database is properly connected**
   - Go to Vercel Dashboard > Storage
   - Connect Postgres database to your project
3. **Update OAuth redirect URLs**
   - Add `https://your-domain.vercel.app/api/auth/callback/google` to Google OAuth

## Post-deployment Steps

1. **Run database migrations**
   - Option A: Automatic (via build command in vercel.json)
   - Option B: Manual via Vercel CLI:
     ```bash
     vercel env pull .env.local
     npx prisma migrate deploy
     ```

2. **Verify deployment**
   - Visit `/profile` - Should show profile page (even without DB)
   - Sign in with Google
   - Check Vercel Functions logs for any errors

## Troubleshooting

### Profile shows "Profile not found"
- Check Vercel Functions logs
- Verify environment variables are set
- Ensure database is connected in Vercel Storage

### Database connection errors
- Verify Postgres is connected in Vercel dashboard
- Check that `POSTGRES_PRISMA_URL` is being used
- Look for connection errors in Function logs

### Google OAuth not working
- Verify redirect URLs include your Vercel domain
- Check `NEXTAUTH_URL` matches your deployment URL
- Ensure `NEXTAUTH_SECRET` is set

## Monitoring

- **Function Logs**: Vercel Dashboard > Functions tab
- **Database**: Vercel Dashboard > Storage > Your database
- **Environment Variables**: Vercel Dashboard > Settings > Environment Variables