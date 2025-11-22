# Deployment Guide

This guide provides instructions for deploying the Ticket Tracker application to various hosting platforms.

## Deploying to Bolt.host

### Prerequisites

1. A bolt.host account
2. Supabase project with the database migrations applied
3. Your Supabase project URL and anon key

### Step 1: Configure Environment Variables

Before deploying, you need to set up environment variables in your bolt.host project settings:

1. Go to your project settings in bolt.host
2. Navigate to the "Environment Variables" section
3. Add the following variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_LOGGING=false
```

**Important:** Replace the placeholder values with your actual Supabase credentials.

### Step 2: Deploy

1. Push your changes to your repository
2. Bolt.host will automatically detect the changes and start building
3. The build process will:
   - Install dependencies using `npm install`
   - Build the application using `npm run build`
   - Deploy the contents of the `dist/` folder

### Step 3: Verify Deployment

1. Once deployment completes, visit your application URL: `https://your-project-name.bolt.host`
2. Test the login functionality
3. Verify that data loads correctly from Supabase

### Troubleshooting Common Issues

#### Deployment Failed Error

If you encounter a "Deployment failed" error:

1. **Check Environment Variables**: Ensure all required environment variables are set correctly in bolt.host
2. **Clear Build Cache**: Try clearing the build cache in bolt.host settings
3. **Check Build Logs**: Review the build logs in bolt.host for specific error messages
4. **Verify Node Version**: Ensure bolt.host is using Node.js 18 or higher

#### Application Shows Blank Page

1. **Check Browser Console**: Open browser developer tools and check for errors
2. **Verify Environment Variables**: Ensure Supabase credentials are correct
3. **Check Network Tab**: Look for failed API requests to Supabase

#### Data Not Loading

1. **Verify Supabase Connection**: Check that the Supabase URL and anon key are correct
2. **Check RLS Policies**: Ensure Row Level Security policies are set up correctly in Supabase
3. **Review Migrations**: Confirm all database migrations have been applied

## Deploying to Other Platforms

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Set environment variables in Vercel dashboard
4. Deploy with `vercel --prod`

Configuration (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run `netlify init` in the project directory
3. Set environment variables in Netlify dashboard
4. Deploy with `netlify deploy --prod`

Configuration (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Manual Deployment

1. Run `npm install` to install dependencies
2. Run `npm run build` to create production build
3. Upload the contents of the `dist/` folder to your web server
4. Configure your web server to serve `index.html` for all routes (SPA routing)

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_ENABLE_LOGGING` | No | Enable console logging | `true` or `false` (default: `false`) |
| `VITE_APP_MODE` | No | Force app mode | `database` or `demo` (default: auto-detect) |
| `VITE_AUTH_MODE` | No | Force auth mode | `database` or `mock` (default: auto-detect) |

## Build Configuration

The application uses Vite for building and bundling. Key configuration details:

- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Node Version**: 18.0.0 or higher
- **Build Time**: ~10-15 seconds
- **Bundle Size**: ~250KB (gzipped, split into chunks)

## Performance Optimization

The application is configured with:

- **Code Splitting**: Vendor libraries split into separate chunks
- **Tree Shaking**: Unused code automatically removed
- **Minification**: Production builds are minified
- **Compression**: Gzip compression recommended on server

## Security Considerations

1. **Environment Variables**: Never commit `.env` file to version control
2. **HTTPS Only**: Always use HTTPS in production
3. **RLS Policies**: Ensure proper Row Level Security policies in Supabase
4. **API Keys**: Use Supabase anon key (not service role key) in frontend
5. **CORS**: Configured automatically by Supabase

## Support

For issues specific to:
- **Bolt.host**: Check bolt.host documentation or support
- **Supabase**: Visit [Supabase documentation](https://supabase.com/docs)
- **Application**: Review the main README.md file

## Updating Deployed Application

To update your deployed application:

1. Make changes to your code
2. Test locally with `npm run dev`
3. Build and verify with `npm run build` and `npm run preview`
4. Push changes to your repository
5. Deployment platform will automatically rebuild and deploy

## Rollback Procedure

If you need to rollback to a previous version:

1. In bolt.host, go to deployment history
2. Select the previous successful deployment
3. Click "Redeploy" or "Rollback"
4. Verify the application is working correctly
