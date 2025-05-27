#!/bin/bash

# =============================================================================
# Popz Place Radio - Comprehensive Backup Script
# =============================================================================
# This script creates complete backups of the Popz Place Radio application
# including source code, configuration, and Azure resources.
#
# Usage: ./backup-script.sh [options]
# Options:
#   --full        Full backup including music files
#   --code-only   Source code and config only
#   --help        Show this help message
#
# Requirements:
#   - Git installed
#   - Azure CLI installed and logged in
#   - AzCopy installed (for music files)
#   - Sufficient disk space for backups
# =============================================================================

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="/backups/popz-place-radio"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"
LOG_FILE="$BACKUP_DIR/backup.log"

# Azure Configuration (update these values)
AZURE_RESOURCE_GROUP="popz-place-radio-rg"
AZURE_STORAGE_ACCOUNT="popzplaceradiostorage"
AZURE_WEBAPP_NAME="popz-place-radio"
AZURE_CONTAINER_NAME="music"

# GitHub Configuration
GITHUB_REPO="https://github.com/michael5cents/Popz-Place-Radio.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        error "Git is not installed. Please install Git first."
    fi
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        error "Azure CLI is not installed. Please install Azure CLI first."
    fi
    
    # Check if logged into Azure
    if ! az account show &> /dev/null; then
        error "Not logged into Azure. Please run 'az login' first."
    fi
    
    # Check if AzCopy is installed (for full backup)
    if [[ "$BACKUP_TYPE" == "full" ]] && ! command -v azcopy &> /dev/null; then
        warning "AzCopy not found. Music files backup will be skipped."
        SKIP_MUSIC=true
    fi
    
    log "Prerequisites check completed ✓"
}

create_backup_structure() {
    log "Creating backup directory structure..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/source-code"
    mkdir -p "$BACKUP_DIR/azure-config"
    mkdir -p "$BACKUP_DIR/music-files"
    mkdir -p "$BACKUP_DIR/documentation"
    
    # Initialize log file
    touch "$LOG_FILE"
    
    log "Backup directory created: $BACKUP_DIR"
}

backup_source_code() {
    log "Backing up source code..."
    
    # Clone the repository
    git clone "$GITHUB_REPO" "$BACKUP_DIR/source-code/repo" 2>&1 | tee -a "$LOG_FILE"
    
    # Create archive of source code
    tar -czf "$BACKUP_DIR/source-code/popz-place-radio-source-$DATE.tar.gz" \
        -C "$BACKUP_DIR/source-code" repo 2>&1 | tee -a "$LOG_FILE"
    
    # Get commit information
    cd "$BACKUP_DIR/source-code/repo"
    git log --oneline -10 > "$BACKUP_DIR/source-code/recent-commits.txt"
    git status > "$BACKUP_DIR/source-code/git-status.txt"
    git remote -v > "$BACKUP_DIR/source-code/git-remotes.txt"
    
    log "Source code backup completed ✓"
}

backup_azure_configuration() {
    log "Backing up Azure configuration..."
    
    # Export resource group as ARM template
    info "Exporting ARM template..."
    az group export \
        --name "$AZURE_RESOURCE_GROUP" \
        --output json > "$BACKUP_DIR/azure-config/arm-template.json" 2>&1 | tee -a "$LOG_FILE"
    
    # Backup app service configuration
    info "Backing up App Service settings..."
    az webapp config appsettings list \
        --name "$AZURE_WEBAPP_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --output json > "$BACKUP_DIR/azure-config/app-settings.json" 2>&1 | tee -a "$LOG_FILE"
    
    # Backup storage account information
    info "Backing up Storage Account info..."
    az storage account show \
        --name "$AZURE_STORAGE_ACCOUNT" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --output json > "$BACKUP_DIR/azure-config/storage-account.json" 2>&1 | tee -a "$LOG_FILE"
    
    # List containers
    az storage container list \
        --account-name "$AZURE_STORAGE_ACCOUNT" \
        --output json > "$BACKUP_DIR/azure-config/storage-containers.json" 2>&1 | tee -a "$LOG_FILE"
    
    # Backup deployment configuration
    info "Backing up deployment configuration..."
    az webapp deployment source show \
        --name "$AZURE_WEBAPP_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --output json > "$BACKUP_DIR/azure-config/deployment-source.json" 2>&1 | tee -a "$LOG_FILE" || true
    
    log "Azure configuration backup completed ✓"
}

backup_music_files() {
    if [[ "$SKIP_MUSIC" == "true" ]]; then
        warning "Skipping music files backup (AzCopy not available)"
        return
    fi
    
    log "Backing up music files..."
    
    # Get storage account key
    STORAGE_KEY=$(az storage account keys list \
        --account-name "$AZURE_STORAGE_ACCOUNT" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --query '[0].value' -o tsv)
    
    # Create list of files
    info "Creating file inventory..."
    az storage blob list \
        --container-name "$AZURE_CONTAINER_NAME" \
        --account-name "$AZURE_STORAGE_ACCOUNT" \
        --account-key "$STORAGE_KEY" \
        --output json > "$BACKUP_DIR/music-files/file-inventory.json" 2>&1 | tee -a "$LOG_FILE"
    
    # Download music files using AzCopy
    info "Downloading music files..."
    azcopy copy \
        "https://$AZURE_STORAGE_ACCOUNT.blob.core.windows.net/$AZURE_CONTAINER_NAME/*" \
        "$BACKUP_DIR/music-files/" \
        --recursive=true \
        --log-level=INFO 2>&1 | tee -a "$LOG_FILE"
    
    # Create archive of music files
    info "Creating music files archive..."
    tar -czf "$BACKUP_DIR/music-files/music-archive-$DATE.tar.gz" \
        -C "$BACKUP_DIR/music-files" . \
        --exclude="*.tar.gz" 2>&1 | tee -a "$LOG_FILE"
    
    log "Music files backup completed ✓"
}

backup_documentation() {
    log "Backing up documentation..."
    
    # Copy documentation files from source
    if [[ -d "$BACKUP_DIR/source-code/repo" ]]; then
        cp "$BACKUP_DIR/source-code/repo"/*.md "$BACKUP_DIR/documentation/" 2>/dev/null || true
        cp "$BACKUP_DIR/source-code/repo"/.env.example "$BACKUP_DIR/documentation/" 2>/dev/null || true
        cp "$BACKUP_DIR/source-code/repo"/package.json "$BACKUP_DIR/documentation/" 2>/dev/null || true
    fi
    
    # Create backup manifest
    cat > "$BACKUP_DIR/documentation/backup-manifest.txt" << EOF
Popz Place Radio - Backup Manifest
==================================
Backup Date: $(date)
Backup Type: $BACKUP_TYPE
Backup Location: $BACKUP_DIR

Contents:
- Source Code: ✓
- Azure Configuration: ✓
- Music Files: $([ "$SKIP_MUSIC" == "true" ] && echo "✗ (Skipped)" || echo "✓")
- Documentation: ✓

Azure Resources:
- Resource Group: $AZURE_RESOURCE_GROUP
- Storage Account: $AZURE_STORAGE_ACCOUNT
- Web App: $AZURE_WEBAPP_NAME
- Container: $AZURE_CONTAINER_NAME

GitHub Repository: $GITHUB_REPO

Restore Instructions:
1. Restore source code: git clone from backup or GitHub
2. Restore Azure resources: az deployment group create --template-file arm-template.json
3. Restore app settings: az webapp config appsettings set --settings @app-settings.json
4. Restore music files: azcopy copy from backup to Azure Storage

For detailed instructions, see BACKUP_STRATEGY.md
EOF
    
    log "Documentation backup completed ✓"
}

create_backup_summary() {
    log "Creating backup summary..."
    
    # Calculate sizes
    SOURCE_SIZE=$(du -sh "$BACKUP_DIR/source-code" | cut -f1)
    CONFIG_SIZE=$(du -sh "$BACKUP_DIR/azure-config" | cut -f1)
    MUSIC_SIZE=$(du -sh "$BACKUP_DIR/music-files" | cut -f1)
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    
    # Count files
    SOURCE_FILES=$(find "$BACKUP_DIR/source-code" -type f | wc -l)
    CONFIG_FILES=$(find "$BACKUP_DIR/azure-config" -type f | wc -l)
    MUSIC_FILES=$(find "$BACKUP_DIR/music-files" -type f | wc -l)
    
    cat > "$BACKUP_DIR/backup-summary.txt" << EOF
Popz Place Radio - Backup Summary
=================================
Backup completed: $(date)
Backup directory: $BACKUP_DIR
Total backup size: $TOTAL_SIZE

Component Breakdown:
- Source Code: $SOURCE_SIZE ($SOURCE_FILES files)
- Azure Config: $CONFIG_SIZE ($CONFIG_FILES files)
- Music Files: $MUSIC_SIZE ($MUSIC_FILES files)

Backup Status: SUCCESS ✓
EOF
    
    log "Backup summary created ✓"
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Keep last 7 daily backups
    find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
    
    # Keep last 4 weekly backups (older than 7 days but newer than 28 days)
    find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" -mtime +28 -exec rm -rf {} \; 2>/dev/null || true
    
    log "Old backups cleaned up ✓"
}

show_help() {
    cat << EOF
Popz Place Radio - Backup Script

Usage: $0 [options]

Options:
    --full        Full backup including music files (default)
    --code-only   Source code and configuration only
    --help        Show this help message

Examples:
    $0                    # Full backup
    $0 --full            # Full backup (explicit)
    $0 --code-only       # Code and config only

The script will create a timestamped backup in:
$BACKUP_ROOT/YYYYMMDD_HHMMSS/

Requirements:
- Git installed
- Azure CLI installed and logged in
- AzCopy installed (for music files)
- Sufficient disk space

For more information, see BACKUP_STRATEGY.md
EOF
}

# =============================================================================
# Main Script
# =============================================================================

main() {
    # Parse command line arguments
    BACKUP_TYPE="full"
    SKIP_MUSIC=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --full)
                BACKUP_TYPE="full"
                shift
                ;;
            --code-only)
                BACKUP_TYPE="code-only"
                SKIP_MUSIC=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1. Use --help for usage information."
                ;;
        esac
    done
    
    # Start backup process
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Popz Place Radio - Backup Script${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    log "Starting backup process (Type: $BACKUP_TYPE)"
    
    # Execute backup steps
    check_prerequisites
    create_backup_structure
    backup_source_code
    backup_azure_configuration
    
    if [[ "$BACKUP_TYPE" == "full" ]]; then
        backup_music_files
    fi
    
    backup_documentation
    create_backup_summary
    cleanup_old_backups
    
    # Final summary
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Backup Completed Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Backup location: ${BLUE}$BACKUP_DIR${NC}"
    echo -e "Backup size: ${BLUE}$(du -sh "$BACKUP_DIR" | cut -f1)${NC}"
    echo -e "Log file: ${BLUE}$LOG_FILE${NC}"
    echo ""
    echo "To restore from this backup, see the backup-manifest.txt file"
    echo "or refer to BACKUP_STRATEGY.md for detailed instructions."
}

# Run main function
main "$@"
