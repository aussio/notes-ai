# Deployment Guide

## 🚀 Phase 7: Deployment Setup

This guide will walk you through deploying your notes-ai application to production.

## Prerequisites

- GitHub repository with your code
- Vercel account ([vercel.com](https://vercel.com))
- Supabase account ([supabase.com](https://supabase.com))
- Custom domain access (teal.so)

## Step 1: Supabase Setup

### 1.1 Create New Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a name: `notes-ai-production`
3. Generate a strong database password
4. Select a region close to your users

### 1.2 Run Database Migrations

1. Go to SQL Editor in Supabase dashboard
2. Run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_row_level_security.sql`

### 1.3 Configure Authentication

1. Go to Authentication → Settings
2. Enable Email authentication
3. Add your domain to Site URL: `https://teal.so`
4. Add redirect URLs:
   - `https://teal.so/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 1.4 Get Connection Details

From Settings → Database:

- Database URL (for connection pooling)
- Direct connection URL
- Service role key (from Settings → API)
- Anon/public key

## Step 2: Vercel Deployment

### 2.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### 2.2 Configure Environment Variables

Add these in Vercel dashboard (Settings → Environment Variables):

```
DATABASE_URL=your_supabase_connection_pooling_url
DIRECT_URL=your_supabase_direct_connection_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://teal.so
NODE_ENV=production
```

### 2.3 Deploy

1. Click "Deploy" - first deployment will take a few minutes
2. Vercel will provide a deployment URL
3. Test the deployment URL to ensure everything works

## Step 3: Custom Domain Setup

### 3.1 Configure Domain in Vercel

1. Go to your project → Settings → Domains
2. Add `teal.so` as a custom domain
3. Add `www.teal.so` and set it to redirect to `teal.so`

### 3.2 Update DNS Records

In your domain registrar (where teal.so is managed):

1. Add CNAME record: `www` → `cname.vercel-dns.com`
2. Add A record: `@` → `76.76.19.61` (Vercel's IP)
3. Add AAAA record: `@` → `2606:4700:1::1` (Vercel's IPv6)

### 3.3 Update Supabase Settings

1. Go back to Supabase → Authentication → Settings
2. Update Site URL to: `https://teal.so`
3. Update redirect URLs to use your custom domain

## Step 4: GitHub Actions Setup

### 4.1 Add Repository Secrets

In GitHub repository → Settings → Secrets and variables → Actions:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

To get these values:

1. **VERCEL_TOKEN**: Vercel → Account Settings → Tokens → Create
2. **VERCEL_ORG_ID**: Run `vercel link` locally, then check `.vercel/project.json`
3. **VERCEL_PROJECT_ID**: Same file as above

### 4.2 Test Automated Deployment

1. Push to main branch
2. Check GitHub Actions tab for deployment status
3. Verify deployment on teal.so

## Step 5: Post-Deployment Verification

### 5.1 Functionality Checklist

- [ ] Homepage loads correctly
- [ ] Can create new notes
- [ ] Rich text editor works
- [ ] Search functionality works
- [ ] Notecards feature works
- [ ] Dark/light mode toggle works
- [ ] Responsive design on mobile

### 5.2 Performance Checklist

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals are green
- [ ] Images are optimized
- [ ] First load time < 3 seconds

### 5.3 Security Checklist

- [ ] HTTPS is enforced
- [ ] Security headers are present
- [ ] Database connections are secure
- [ ] Environment variables are properly set

## Step 6: Monitoring Setup

### 6.1 Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Monitor performance and usage metrics

### 6.2 Error Tracking

Consider adding error tracking service like:

- Sentry
- LogRocket
- Bugsnag

## Troubleshooting

### Common Issues

**Build Failures:**

- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify TypeScript compilation

**Database Connection Issues:**

- Verify Supabase URLs and keys
- Check RLS policies are correctly applied
- Ensure database migrations ran successfully

**Domain Issues:**

- DNS propagation can take up to 48 hours
- Use DNS checker tools to verify records
- Clear browser cache and try incognito mode

### Getting Help

1. Check Vercel deployment logs
2. Check Supabase logs and metrics
3. Test locally with production environment variables
4. Review this deployment guide step by step

## Phase 8 Preparation

Once deployment is successful, you'll be ready for:

- **User Authentication**: ✅ Implemented with Supabase
- **Cloud Sync**: Real-time data synchronization
- **Production Optimizations**: Performance monitoring and improvements

---

**Status**: Phase 7 Complete ✅ - Ready for Production Use
