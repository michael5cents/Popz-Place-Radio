# Complete Setup Guide - Popz Place Radio

## 🎯 Overview

This guide will walk you through setting up Popz Place Radio from scratch, including Azure infrastructure, development environment, and deployment.

## 📋 Prerequisites

### Required Software
- **Node.js 18+**: [Download from nodejs.org](https://nodejs.org/)
- **Git**: [Download from git-scm.com](https://git-scm.com/)
- **Code Editor**: VS Code recommended
- **Azure CLI** (optional): [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)

### Required Accounts
- **Azure Account**: [Create free account](https://azure.microsoft.com/free/)
- **GitHub Account**: [Sign up at github.com](https://github.com/)

## 🏗️ Step 1: Azure Infrastructure Setup

### 1.1 Create Azure Storage Account

#### Using Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Storage account"**
4. Click **"Create"**
5. Fill in details:
   - **Subscription**: Your subscription
   - **Resource Group**: Create new "popz-place-radio-rg"
   - **Storage Account Name**: "popzplaceradiostorage" (must be unique)
   - **Region**: Choose closest to your users
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally Redundant Storage)
6. Click **"Review + Create"** → **"Create"**

#### Using Azure CLI
```bash
# Login to Azure
az login

# Create resource group
az group create --name popz-place-radio-rg --location eastus

# Create storage account
az storage account create \
  --name popzplaceradiostorage \
  --resource-group popz-place-radio-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2
```

### 1.2 Create Blob Container

#### Using Azure Portal
1. Go to your Storage Account
2. Click **"Containers"** in the left menu
3. Click **"+ Container"**
4. Name: **"music"**
5. Public access level: **"Private"**
6. Click **"Create"**

#### Using Azure CLI
```bash
az storage container create \
  --name music \
  --account-name popzplaceradiostorage \
  --public-access off
```

### 1.3 Get Storage Credentials

#### Using Azure Portal
1. Go to Storage Account → **"Access keys"**
2. Copy **"Connection string"** from key1 or key2
3. Copy **"Key"** value
4. Note your **"Storage account name"**

#### Using Azure CLI
```bash
# Get connection string
az storage account show-connection-string \
  --name popzplaceradiostorage \
  --resource-group popz-place-radio-rg

# Get access key
az storage account keys list \
  --account-name popzplaceradiostorage \
  --resource-group popz-place-radio-rg
```

### 1.4 Upload Music Files

#### Using Azure Portal
1. Go to Storage Account → **"Containers"** → **"music"**
2. Click **"Upload"**
3. Select your music files (.mp3, .wav, .flac)
4. Click **"Upload"**

#### Using Azure CLI
```bash
# Upload single file
az storage blob upload \
  --file "path/to/your/song.mp3" \
  --container-name music \
  --name "song.mp3" \
  --account-name popzplaceradiostorage

# Upload multiple files
az storage blob upload-batch \
  --destination music \
  --source "path/to/music/folder" \
  --account-name popzplaceradiostorage
```

## 💻 Step 2: Development Environment Setup

### 2.1 Clone Repository

```bash
# Clone the repository
git clone https://github.com/michael5cents/Popz-Place-Radio.git
cd Popz-Place-Radio

# Install dependencies
npm install
```

### 2.2 Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your Azure credentials
nano .env  # or use your preferred editor
```

Fill in your `.env` file:
```env
# Azure Storage Configuration
VITE_AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=popzplaceradiostorage;AccountKey=YOUR_KEY_HERE;EndpointSuffix=core.windows.net
VITE_AZURE_STORAGE_ACCESS_KEY=your_access_key_here
VITE_AZURE_STORAGE_ACCOUNT=popzplaceradiostorage
VITE_AZURE_STORAGE_CONTAINER_NAME=music

# Application Configuration
PORT=3000
NODE_ENV=development
```

### 2.3 Test Connection

```bash
# Test Azure storage connection
node test-connection.mjs

# Test metadata extraction
node test-metadata.mjs
```

Expected output:
```
✅ Azure Storage connection successful
✅ Container 'music' exists
✅ Found X music files
✅ Metadata extraction working
```

### 2.4 Start Development Server

```bash
# Start the application
npm start
```

Visit `http://localhost:3000` to see your app running!

## 🚀 Step 3: Azure App Service Setup

### 3.1 Create App Service

#### Using Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Web App"**
4. Fill in details:
   - **App name**: "popz-place-radio" (must be unique)
   - **Resource Group**: "popz-place-radio-rg"
   - **Runtime stack**: "Node 18 LTS"
   - **Operating System**: Linux
   - **Region**: Same as storage account
   - **App Service Plan**: Create new (B1 Basic)
5. Click **"Review + Create"** → **"Create"**

#### Using Azure CLI
```bash
# Create App Service Plan
az appservice plan create \
  --name popz-place-radio-plan \
  --resource-group popz-place-radio-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name popz-place-radio \
  --resource-group popz-place-radio-rg \
  --plan popz-place-radio-plan \
  --runtime "NODE|18-lts"
```

### 3.2 Configure App Settings

#### Using Azure Portal
1. Go to App Service → **"Configuration"**
2. Click **"+ New application setting"** for each:

```
VITE_AZURE_STORAGE_CONNECTION_STRING = [Your connection string]
VITE_AZURE_STORAGE_ACCESS_KEY = [Your access key]
VITE_AZURE_STORAGE_ACCOUNT = popzplaceradiostorage
VITE_AZURE_STORAGE_CONTAINER_NAME = music
NODE_ENV = production
WEBSITE_NODE_DEFAULT_VERSION = 18.20.8
SCM_DO_BUILD_DURING_DEPLOYMENT = true
ENABLE_ORYX_BUILD = true
```

3. Click **"Save"**

#### Using Azure CLI
```bash
az webapp config appsettings set \
  --name popz-place-radio \
  --resource-group popz-place-radio-rg \
  --settings \
    VITE_AZURE_STORAGE_CONNECTION_STRING="[Your connection string]" \
    VITE_AZURE_STORAGE_ACCESS_KEY="[Your access key]" \
    VITE_AZURE_STORAGE_ACCOUNT="popzplaceradiostorage" \
    VITE_AZURE_STORAGE_CONTAINER_NAME="music" \
    NODE_ENV="production" \
    WEBSITE_NODE_DEFAULT_VERSION="18.20.8" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    ENABLE_ORYX_BUILD="true"
```

## 🔄 Step 4: Deployment Setup

### 4.1 GitHub Actions Deployment (Recommended)

#### Setup in Azure Portal
1. Go to App Service → **"Deployment Center"**
2. Select **"GitHub"** as source
3. Authorize GitHub access
4. Select your repository
5. Select **"main"** branch
6. Choose **"GitHub Actions"** as build provider
7. Click **"Save"**

This automatically creates a workflow file in your repository.

#### Manual GitHub Actions Setup
Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'popz-place-radio'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
```

### 4.2 Git Deployment (Alternative)

```bash
# Get deployment credentials
az webapp deployment list-publishing-credentials \
  --name popz-place-radio \
  --resource-group popz-place-radio-rg

# Add Azure remote
git remote add azure https://[username]@popz-place-radio.scm.azurewebsites.net/popz-place-radio.git

# Deploy
git push azure main:master
```

## ✅ Step 5: Verification

### 5.1 Test Deployment

```bash
# Check if app is running
curl https://popz-place-radio.azurewebsites.net/api/version

# Test track listing
curl https://popz-place-radio.azurewebsites.net/api/tracks
```

### 5.2 Browser Testing

1. Visit `https://popz-place-radio.azurewebsites.net`
2. Check that tracks load
3. Test play/pause functionality
4. Test mobile responsiveness
5. Test Samsung Z Fold3 layout (if available)

## 🔧 Step 6: Customization

### 6.1 Add Your Music

```bash
# Upload more music files
az storage blob upload-batch \
  --destination music \
  --source "path/to/new/music" \
  --account-name popzplaceradiostorage
```

### 6.2 Customize Appearance

Edit `index.html` to change:
- App title and branding
- Color scheme (CSS custom properties)
- Button layouts
- Mobile optimizations

### 6.3 Configure Domain (Optional)

1. Purchase domain from registrar
2. In Azure Portal → App Service → **"Custom domains"**
3. Add your domain
4. Configure DNS records
5. Add SSL certificate

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Cannot connect to Azure Storage"
- Check connection string format
- Verify access key is correct
- Ensure container exists and is accessible

#### 2. "No tracks found"
- Verify music files are uploaded to correct container
- Check file formats (mp3, wav, flac supported)
- Ensure container name matches environment variable

#### 3. "App won't start on Azure"
- Check application logs in Azure Portal
- Verify all environment variables are set
- Ensure Node.js version is correct

#### 4. "Build fails during deployment"
- Check package.json scripts
- Verify all dependencies are listed
- Check build logs in deployment center

### Debug Commands

```bash
# Check Azure app logs
az webapp log tail --name popz-place-radio --resource-group popz-place-radio-rg

# Test local connection
node test-connection.mjs

# Check environment variables
az webapp config appsettings list --name popz-place-radio --resource-group popz-place-radio-rg
```

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting section](#troubleshooting)
2. Review Azure Portal logs
3. Test locally first
4. Check GitHub Issues
5. Verify all prerequisites are met

## 🎉 Success!

You now have a fully functional Popz Place Radio installation! Your music streaming app is:

- ✅ Running on Azure App Service
- ✅ Streaming from Azure Blob Storage
- ✅ Optimized for Samsung Z Fold3
- ✅ Automatically deployed from GitHub
- ✅ Secured with environment variables
- ✅ Ready for your music collection

Enjoy your personalized music streaming experience! 🎵
