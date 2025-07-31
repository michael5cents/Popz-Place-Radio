# Deployment Guide - Popz Place Radio

## 🚀 Deployment Overview

This guide covers deploying Popz Place Radio to Azure App Service with automated CI/CD from GitHub.

## 📋 Prerequisites

### Required Accounts
- **Azure Account**: With active subscription
- **GitHub Account**: For source code management
- **Azure Storage Account**: For music file storage

### Required Tools
- **Git**: Version control
- **Node.js 18+**: Runtime environment
- **Azure CLI** (optional): Command-line management

## 🏗️ Azure Infrastructure Setup

### 1. Azure Storage Account

#### Create Storage Account
```bash
# Using Azure CLI
az storage account create \
  --name popzplaceradiostorage \
  --resource-group popz-place-radio-rg \
  --location eastus \
  --sku Standard_LRS
```

#### Create Blob Container
```bash
# Create container for music files
az storage container create \
  --name music \
  --account-name popzplaceradiostorage \
  --public-access off
```

#### Upload Music Files
```bash
# Upload music files to container
az storage blob upload-batch \
  --destination music \
  --source ./music-files \
  --account-name popzplaceradiostorage
```

### 2. Azure App Service

#### Create App Service Plan
```bash
az appservice plan create \
  --name popz-place-radio-plan \
  --resource-group popz-place-radio-rg \
  --sku B1 \
  --is-linux
```

#### Create Web App
```bash
az webapp create \
  --name popz-place-radio \
  --resource-group popz-place-radio-rg \
  --plan popz-place-radio-plan \
  --runtime "NODE|18-lts"
```

## ⚙️ Environment Configuration

### Application Settings
Configure these in Azure Portal → App Service → Configuration:

```env
VITE_AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
VITE_AZURE_STORAGE_ACCESS_KEY=your_access_key
VITE_AZURE_STORAGE_ACCOUNT=popzplaceradiostorage
VITE_AZURE_STORAGE_CONTAINER_NAME=music
NODE_ENV=production
WEBSITE_NODE_DEFAULT_VERSION=18.20.8
```

### Deployment Settings
```env
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
```

## 🔄 CI/CD Setup

### Method 1: Direct Azure Git Deployment (Currently Used)

This is the deployment method currently configured and working for this project.

#### 1. Azure Git Remote Setup
The Azure git remote is already configured in this repository:
```bash
git remote -v
# Should show:
# azure: https://$popz-place-radio:...@popz-place-radio.scm.azurewebsites.net/popz-place-radio.git
```

#### 2. Deploy to Azure
To deploy the latest changes directly to Azure:
```bash
# Deploy current branch to Azure master branch
git push azure clean-branch:master

# Or if on main branch:
git push azure main:master
```

#### 3. Deployment Process
Azure will automatically:
- Detect Node.js application
- Install dependencies with `npm install`
- Run build process with `npm run build`
- Deploy to production environment
- Restart the application service

### Method 2: GitHub Actions (Alternative)

#### 1. Workflow File Setup
The GitHub Actions workflow file is located at `.github/workflows/main_popz-place-radio.yml`:

```yaml
name: Build and deploy Node.js app to Azure Web App

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Node.js version
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: npm install, build
      run: |
        npm install
        npm run build --if-present
        
    - name: Upload artifact
      uses: actions/upload-artifact@v3
      with:
        name: node-app
        path: .

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}
      
    steps:
    - name: Download artifact
      uses: actions/download-artifact@v3
      with:
        name: node-app
        
    - name: 'Deploy to Azure Web App'
      id: deploy-to-webapp
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'popz-place-radio'
        slot-name: 'Production'
        publish-profile: ${{ secrets.AZUREAPPSERVICE_PUBLISHPROFILE }}
        package: .
```

#### 2. GitHub Actions Requirements
**Note**: GitHub Actions deployment requires additional setup:
- Azure publish profile must be added as a GitHub secret named `AZUREAPPSERVICE_PUBLISHPROFILE`
- This method is configured but not currently active due to missing secrets

#### 3. Workflow Triggers
The workflow automatically triggers on:
- Push to `main` branch
- Manual workflow dispatch

### Method 3: Azure CLI Deployment (Alternative)

#### 1. Get Deployment Credentials
```bash
# Get publish profile (if needed for troubleshooting)
az webapp deployment list-publishing-credentials \
  --name popz-place-radio \
  --resource-group popz-place-radio-rg
```

#### 2. Manual Azure Remote Setup (if needed)
```bash
# Add Azure git remote (already configured in this project)
git remote add azure https://$popz-place-radio@popz-place-radio.scm.azurewebsites.net/popz-place-radio.git

# Deploy to Azure
git push azure main:master
```

## 🔧 Build Configuration

### package.json Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "vite",
    "build": "vite build",
    "serve": "vite preview"
  }
}
```

### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000
  }
})
```

### Web.config for Azure
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <match url="/*" />
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
    <iisnode watchedFiles="web.config;*.js"/>
  </system.webServer>
</configuration>
```

## 🔍 Deployment Verification

### Health Checks
```bash
# Check app status
curl https://popz-place-radio.azurewebsites.net/api/version

# Test track listing
curl https://popz-place-radio.azurewebsites.net/api/tracks
```

### Monitoring
- **Application Insights**: Performance monitoring
- **Log Stream**: Real-time logging
- **Metrics**: CPU, memory, requests

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
az webapp log tail --name popz-place-radio --resource-group popz-place-radio-rg
```

#### 2. Environment Variables
- Verify all required variables are set
- Check for typos in variable names
- Ensure connection string format is correct

#### 3. Azure Storage Access
```bash
# Test storage connection
node test-connection.mjs
```

#### 4. CORS Issues
```javascript
// server.js - Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
```

### Performance Optimization

#### 1. Enable Compression
```javascript
// server.js
const compression = require('compression');
app.use(compression());
```

#### 2. Static File Caching
```javascript
app.use(express.static('dist', {
  maxAge: '1d',
  etag: true
}));
```

#### 3. CDN Integration
- Configure Azure CDN for static assets
- Enable compression and caching rules

## 📊 Monitoring & Maintenance

### Application Insights
```javascript
// Add to server.js
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
appInsights.start();
```

### Log Analysis
```bash
# View recent logs
az webapp log download --name popz-place-radio --resource-group popz-place-radio-rg
```

### Scaling
```bash
# Scale up app service plan
az appservice plan update --name popz-place-radio-plan --resource-group popz-place-radio-rg --sku P1V2

# Enable auto-scaling
az monitor autoscale create --resource-group popz-place-radio-rg --resource popz-place-radio
```
