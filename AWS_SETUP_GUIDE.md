# AWS Amplify Setup Guide for Nexa Manager

## 🚀 Complete AWS Setup in 15 Minutes

### Step 1: Create IAM User for Deployment

1. **Go to AWS Console** → [IAM Users](https://console.aws.amazon.com/iam/home#/users)

2. **Create User**:
   - Click **"Add users"**
   - User name: `github-actions-nexa-manager`
   - Access type: ☑️ **"Programmatic access"**

3. **Attach Permissions**:
   - Choose **"Attach existing policies directly"**
   - Search and select:
     - ☑️ `AmplifyBackendDeployFullAccess`
     - ☑️ `AWSAmplifyConsoleFullAccess`

4. **Save Credentials**:
   ```
   Access Key ID: AKIA...
   Secret Access Key: ...
   ```
   ⚠️ **IMPORTANT**: Save these - you can't see the secret again!

### Step 2: Set Up GitHub Repository

1. **Initialize Git** (if not done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit with CI/CD setup"
   ```

2. **Create GitHub Repository**:
   - Go to [GitHub](https://github.com/new)
   - Repository name: `Nexa_Manager_whit_Task_Master`
   - Make it **Public** (for easier Amplify integration)
   - Click **"Create repository"**

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/Nexa_Manager_whit_Task_Master.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Configure GitHub Secrets

1. **Go to Repository Settings**:
   - Your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

2. **Add Required Secrets** (click "New repository secret"):

   **Supabase Secrets:**
   ```
   Name: VITE_SUPABASE_URL
   Value: https://your-project-ref.supabase.co

   Name: VITE_SUPABASE_ANON_KEY  
   Value: your-anon-key-from-supabase-dashboard
   ```

   **AWS Secrets:**
   ```
   Name: AWS_ACCESS_KEY_ID
   Value: AKIA... (from Step 1)

   Name: AWS_SECRET_ACCESS_KEY
   Value: ... (from Step 1)

   Name: AWS_REGION
   Value: us-east-1
   ```

### Step 4: Set Up AWS Amplify (Easy Option)

1. **Go to AWS Amplify** → [Amplify Console](https://console.aws.amazon.com/amplify/home)

2. **Get Started**:
   - Click **"Get Started"** under "Deploy"
   - Choose **"GitHub"**
   - Authorize AWS to access your GitHub

3. **Select Repository**:
   - Repository: `Nexa_Manager_whit_Task_Master`
   - Branch: `main` (or `master`)
   - Click **"Next"**

4. **Configure Build Settings**:
   - App name: `Nexa Manager`
   - Environment: `main`
   - Amplify will auto-detect `amplify.yml` ✅
   - **Add Environment Variables**:
     ```
     VITE_SUPABASE_URL = https://your-project-ref.supabase.co
     VITE_SUPABASE_ANON_KEY = your-anon-key
     VITE_APP_ENV = production
     ```

5. **Deploy**:
   - Click **"Save and deploy"**
   - Wait for build to complete (~5-10 minutes)

6. **Get App ID**:
   - Copy the App ID from URL (e.g., `d1234abcd567ef`)
   - Add to GitHub secrets:
     ```
     Name: AMPLIFY_APP_ID
     Value: d1234abcd567ef
     ```

### Step 5: Test the Setup

1. **Trigger Deployment**:
   - Make a small change to your code
   - Push to GitHub:
     ```bash
     git add .
     git commit -m "Test deployment"
     git push
     ```

2. **Watch the Magic**:
   - GitHub Actions: [Your Repo]/actions
   - AWS Amplify: Console will show build progress

3. **Access Your App**:
   - Your app will be live at: `https://main.d1234abcd567ef.amplifyapp.com`

## 🎯 Quick Verification Checklist

- ☑️ IAM user created with correct permissions
- ☑️ GitHub repository created and code pushed
- ☑️ GitHub secrets configured (5 secrets total)
- ☑️ AWS Amplify app created and connected
- ☑️ First deployment successful
- ☑️ App accessible via Amplify URL

## 🔧 What Happens Next

### Automatic Deployments
Every time you push to `main`:
1. **GitHub Actions CI** runs tests and builds
2. **If CI passes** → triggers AWS Amplify deployment
3. **Your app updates** automatically in 3-5 minutes

### Manual Deployments
- Go to **GitHub Actions** → **Deploy** workflow → **Run workflow**

## 💰 Cost Overview

**AWS Amplify Free Tier:**
- ✅ 1,000 build minutes/month (plenty for development)
- ✅ 15GB hosting storage
- ✅ 15GB data transfer
- ✅ Custom domain SSL certificates

**Estimated Monthly Cost**: $0 for development, ~$1-5 for production

## 🆘 Troubleshooting

### If GitHub Actions Fail:
1. Check **Actions** tab for error details
2. Verify all 5 secrets are set correctly
3. Make sure IAM user has the right permissions

### If Amplify Build Fails:
1. Check environment variables in Amplify console
2. Verify `amplify.yml` configuration
3. Check build logs in Amplify console

### If App Doesn't Load:
1. Check browser console for errors
2. Verify Supabase connection details
3. Test locally first: `npm run dev`

## 🎉 Success!

Once setup is complete, you'll have:
- ✅ Professional CI/CD pipeline
- ✅ Automatic deployments to AWS
- ✅ Global CDN with SSL
- ✅ Build caching and optimization
- ✅ Security headers and best practices

**Your Nexa Manager app will be production-ready!**

---

Need help? Feel free to ask! 🚀 