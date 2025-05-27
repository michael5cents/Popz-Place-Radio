# Backup Strategy - Popz Place Radio

## 🛡️ Backup Overview

This document outlines comprehensive backup and disaster recovery strategies for Popz Place Radio to ensure data safety and business continuity.

## 📊 Backup Components

### 1. Source Code
- **Primary**: GitHub repository
- **Secondary**: Local development machines
- **Tertiary**: Azure DevOps (optional)

### 2. Music Files
- **Primary**: Azure Blob Storage
- **Secondary**: Azure Blob Storage (different region)
- **Tertiary**: Local backup drives

### 3. Configuration
- **Environment Variables**: Azure Key Vault
- **Application Settings**: Azure Resource Manager templates
- **Deployment Scripts**: Version controlled in Git

### 4. Application Data
- **User Preferences**: Browser localStorage (client-side)
- **Favorites**: Browser localStorage (client-side)
- **Analytics**: Application Insights

## 🔄 Automated Backup Systems

### GitHub Repository Backup

#### Current Status
✅ **Active**: Repository hosted on GitHub  
✅ **Redundancy**: GitHub's built-in redundancy  
✅ **Version Control**: Complete history preserved  

#### Additional Protection
```bash
# Create mirror repository
git clone --mirror https://github.com/michael5cents/Popz-Place-Radio.git
cd Popz-Place-Radio.git
git remote set-url --push origin https://backup-location.git
git push --mirror
```

#### Automated Daily Backup Script
```bash
#!/bin/bash
# backup-repo.sh
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/popz-place-radio"

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Clone latest repository
git clone https://github.com/michael5cents/Popz-Place-Radio.git "$BACKUP_DIR/$DATE/repo"

# Create archive
tar -czf "$BACKUP_DIR/popz-place-radio-$DATE.tar.gz" -C "$BACKUP_DIR/$DATE" repo

# Clean up old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Azure Blob Storage Backup

#### Cross-Region Replication
```bash
# Create secondary storage account in different region
az storage account create \
  --name popzplaceradiobackup \
  --resource-group popz-place-radio-backup-rg \
  --location westus2 \
  --sku Standard_GRS \
  --kind StorageV2
```

#### Automated Sync Script
```bash
#!/bin/bash
# sync-music-files.sh

SOURCE_ACCOUNT="popzplaceradiostorage"
DEST_ACCOUNT="popzplaceradiobackup"
CONTAINER="music"

# Sync files using AzCopy
azcopy sync \
  "https://$SOURCE_ACCOUNT.blob.core.windows.net/$CONTAINER" \
  "https://$DEST_ACCOUNT.blob.core.windows.net/$CONTAINER" \
  --recursive=true \
  --delete-destination=false

echo "Music files sync completed: $(date)"
```

#### Azure Backup Service
```bash
# Enable backup for storage account
az backup vault create \
  --resource-group popz-place-radio-rg \
  --name popz-place-radio-vault \
  --location eastus

# Configure backup policy
az backup policy create \
  --vault-name popz-place-radio-vault \
  --resource-group popz-place-radio-rg \
  --name daily-backup-policy \
  --backup-management-type AzureStorage
```

## 💾 Local Backup Procedures

### Development Environment Backup

#### Essential Files Checklist
- [ ] Source code (Git repository)
- [ ] Environment configuration (.env files)
- [ ] Documentation files
- [ ] Test files and data
- [ ] Build scripts and configurations

#### Local Backup Script
```bash
#!/bin/bash
# local-backup.sh

PROJECT_DIR="/path/to/popz-place-radio"
BACKUP_DIR="/backups/local"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
tar -czf "$BACKUP_DIR/popz-place-radio-local-$DATE.tar.gz" \
  --exclude="node_modules" \
  --exclude="dist" \
  --exclude=".git" \
  -C "$(dirname $PROJECT_DIR)" \
  "$(basename $PROJECT_DIR)"

echo "Local backup created: popz-place-radio-local-$DATE.tar.gz"
```

### Music Collection Backup

#### Local Storage Strategy
```bash
# Create local backup of music files
mkdir -p /backups/music
azcopy copy \
  "https://popzplaceradiostorage.blob.core.windows.net/music/*" \
  "/backups/music/" \
  --recursive=true
```

#### External Drive Backup
```bash
# Backup to external drive
EXTERNAL_DRIVE="/media/backup-drive"
rsync -av --progress /backups/music/ "$EXTERNAL_DRIVE/popz-place-radio-music/"
```

## 🔧 Configuration Backup

### Azure Key Vault Setup
```bash
# Create Key Vault for sensitive configuration
az keyvault create \
  --name popz-place-radio-vault \
  --resource-group popz-place-radio-rg \
  --location eastus

# Store connection string
az keyvault secret set \
  --vault-name popz-place-radio-vault \
  --name "azure-storage-connection-string" \
  --value "$CONNECTION_STRING"
```

### ARM Template Export
```bash
# Export current Azure resources as template
az group export \
  --name popz-place-radio-rg \
  --output-format json > azure-resources-backup.json
```

### Environment Variables Backup
```bash
# backup-env.sh
#!/bin/bash
DATE=$(date +%Y%m%d)

# Export app settings
az webapp config appsettings list \
  --name popz-place-radio \
  --resource-group popz-place-radio-rg \
  --output json > "app-settings-backup-$DATE.json"

echo "App settings backed up: app-settings-backup-$DATE.json"
```

## 🚨 Disaster Recovery Plan

### Recovery Time Objectives (RTO)
- **Code Repository**: < 1 hour
- **Application Deployment**: < 2 hours
- **Music Files**: < 4 hours
- **Full Service**: < 6 hours

### Recovery Point Objectives (RPO)
- **Code Changes**: < 1 hour (Git commits)
- **Music Files**: < 24 hours (daily sync)
- **Configuration**: < 24 hours (daily backup)

### Recovery Procedures

#### 1. Code Repository Recovery
```bash
# Restore from backup
git clone /backups/popz-place-radio/latest/repo
cd repo
git remote add origin https://github.com/michael5cents/Popz-Place-Radio.git
git push --all origin
```

#### 2. Azure Resources Recovery
```bash
# Deploy from ARM template
az deployment group create \
  --resource-group popz-place-radio-rg \
  --template-file azure-resources-backup.json
```

#### 3. Music Files Recovery
```bash
# Restore from backup storage
azcopy copy \
  "https://popzplaceradiobackup.blob.core.windows.net/music/*" \
  "https://popzplaceradiostorage.blob.core.windows.net/music/" \
  --recursive=true
```

#### 4. Application Settings Recovery
```bash
# Restore app settings
az webapp config appsettings set \
  --name popz-place-radio \
  --resource-group popz-place-radio-rg \
  --settings @app-settings-backup.json
```

## 📅 Backup Schedule

### Daily Backups
- **Source Code**: Automatic (Git commits)
- **Music Files**: 2:00 AM UTC (Azure sync)
- **Configuration**: 3:00 AM UTC (settings export)

### Weekly Backups
- **Full System**: Sunday 1:00 AM UTC
- **Local Backup**: Sunday 2:00 AM local time
- **External Drive**: Sunday (manual)

### Monthly Backups
- **Archive Creation**: First Sunday of month
- **Backup Verification**: Second Sunday of month
- **Documentation Update**: Third Sunday of month

## 🔍 Backup Verification

### Automated Testing
```bash
#!/bin/bash
# verify-backup.sh

# Test repository backup
git clone /backups/latest/repo test-restore
cd test-restore
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Repository backup verified"
else
    echo "❌ Repository backup failed verification"
fi

# Test music files backup
SAMPLE_FILE="sample-track.mp3"
if azcopy copy "https://popzplaceradiobackup.blob.core.windows.net/music/$SAMPLE_FILE" "./test-$SAMPLE_FILE"; then
    echo "✅ Music files backup verified"
else
    echo "❌ Music files backup failed verification"
fi
```

### Manual Verification Checklist
- [ ] Repository clone and build successful
- [ ] Music files accessible and playable
- [ ] Configuration settings complete
- [ ] Application deployment successful
- [ ] All features functional

## 📋 Backup Monitoring

### Alerts Setup
```bash
# Create backup failure alert
az monitor action-group create \
  --name backup-alerts \
  --resource-group popz-place-radio-rg \
  --short-name backup

# Add email notification
az monitor action-group update \
  --name backup-alerts \
  --resource-group popz-place-radio-rg \
  --add-action email admin admin@example.com
```

### Backup Status Dashboard
- **GitHub Actions**: Build status badges
- **Azure Monitor**: Storage sync status
- **Custom Script**: Daily backup reports

## 🔐 Security Considerations

### Backup Encryption
- **At Rest**: Azure Storage encryption enabled
- **In Transit**: HTTPS/TLS for all transfers
- **Local**: GPG encryption for sensitive backups

### Access Control
- **Azure RBAC**: Backup operator role
- **Key Vault**: Managed identities
- **GitHub**: Protected branches and required reviews

### Retention Policies
- **Daily Backups**: 30 days
- **Weekly Backups**: 12 weeks
- **Monthly Backups**: 12 months
- **Yearly Archives**: 7 years
