# AWS Amplify CI/CD Setup for Nexa Manager

This document explains how to configure GitHub Actions workflows for continuous integration and deployment to **AWS Amplify**.

## Overview

We have two main workflows:
- **CI Workflow** (`ci.yml`): Runs tests, linting, type checking, and builds on every push/PR
- **Deploy Workflow** (`deploy.yml`): Deploys the application to AWS Amplify on successful pushes to main/master

## AWS Setup Requirements

### 1. AWS Account Setup

1. **AWS Account**: Ensure you have an active AWS account
2. **IAM User**: Create an IAM user with programmatic access
3. **Required AWS Services**:
   - AWS Amplify (for hosting)
   - AWS IAM (for permissions)

### 2. Create IAM User for GitHub Actions

1. Go to **AWS Console > IAM > Users**
2. Click **"Create User"**
3. User name: `github-actions-nexa-manager`
4. Select **"Programmatic access"**
5. Attach these policies:
   ```
   - AmplifyBackendDeployFullAccess
   - AWSAmplifyConsoleFullAccess
   ```

6. **Save the Access Key ID and Secret Access Key** (you'll need these for GitHub secrets)

## Required GitHub Secrets

Go to: `Repository Settings > Secrets and Variables > Actions`

### 1. Supabase Secrets (REQUIRED)

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
```

### 2. AWS Secrets (REQUIRED)

```
AWS_ACCESS_KEY_ID=your-iam-user-access-key-id
AWS_SECRET_ACCESS_KEY=your-iam-user-secret-access-key
AWS_REGION=us-east-1  # or your preferred region
```

### 3. AWS Amplify App ID (OPTIONAL but RECOMMENDED)

If you want automated deployments, create an Amplify app first:

```
AMPLIFY_APP_ID=your-amplify-app-id
```

## AWS Amplify Setup Options

### Option 1: Manual Setup (Recommended for First Time)

1. **Go to AWS Amplify Console**
2. Click **"Get Started"** under "Deploy"
3. Choose **"GitHub"** as your repository service
4. Select your repository: `YourUsername/Nexa_Manager_whit_Task_Master`
5. Choose branch: `master` or `main`
6. **Build Settings**: 
   - Amplify will auto-detect the `amplify.yml` file
   - Add environment variables:
     ```
     VITE_SUPABASE_URL=https://your-project-ref.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
7. Click **"Save and Deploy"**
8. **Copy the App ID** from the URL (e.g., `d1234abcd567ef`)
9. Add `AMPLIFY_APP_ID=d1234abcd567ef` to your GitHub secrets

### Option 2: Automated Setup via GitHub Actions

1. **Set up GitHub secrets** (steps 1-2 above)
2. **Push your code** to trigger the workflow
3. The workflow will automatically:
   - Build your application
   - Deploy to Amplify
   - Set up the hosting configuration

## Project Structure for AWS Amplify

Your project is already configured with:

```
web-app/
├── amplify.yml          # Amplify build configuration
├── dist/               # Build output (auto-generated)
├── src/                # React application source
├── package.json        # Dependencies and scripts
└── vite.config.ts     # Vite build configuration
```

## Deployment Process

### Automatic Deployments

1. **Code Push**: Push code to `main` or `master` branch
2. **CI Pipeline**: GitHub Actions runs tests and builds
3. **Deploy Pipeline**: If CI passes, deploys to AWS Amplify
4. **Live URL**: Your app is available at `https://main.d1234abcd567ef.amplifyapp.com`

### Manual Deployments

You can also trigger deployments manually:

1. Go to **GitHub Actions** tab in your repository
2. Select **"Deploy"** workflow
3. Click **"Run workflow"**
4. Choose the branch and click **"Run workflow"**

## Environment Variables in AWS Amplify

Configure these in **AWS Amplify Console > App Settings > Environment Variables**:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
VITE_APP_ENV=production
```

## Custom Domain Setup (Optional)

1. Go to **AWS Amplify Console > Domain Management**
2. Click **"Add domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. SSL certificate is automatically managed by AWS

## Monitoring and Logs

- **Build Logs**: Available in Amplify Console
- **GitHub Actions Logs**: Available in your repository's Actions tab
- **Application Logs**: Use AWS CloudWatch for runtime logs

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check environment variables are correctly set
   - Verify `amplify.yml` configuration
   - Check GitHub Actions logs

2. **Permission Errors**:
   - Verify IAM user has correct permissions
   - Check AWS credentials in GitHub secrets

3. **Supabase Connection Issues**:
   - Verify Supabase URL and keys
   - Check network policies in Supabase dashboard

### Getting Help:

- **AWS Amplify Docs**: https://docs.amplify.aws/
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Supabase Docs**: https://supabase.com/docs

## Next Steps

After setup:

1. **Test the deployment** by pushing a small change
2. **Set up custom domain** if needed
3. **Configure monitoring** and alerts
4. **Set up staging environment** for testing

## Cost Estimation

AWS Amplify costs:
- **Build minutes**: First 1,000 minutes free per month
- **Hosting**: First 15GB free per month
- **Data transfer**: First 15GB free per month

Perfect for development and small to medium production apps! 