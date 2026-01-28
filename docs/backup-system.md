# 🔄 Backup and Recovery System

This repository includes a comprehensive backup and recovery system for your Jekyll site, providing automated backups with different retention policies and easy recovery mechanisms.

## 📦 Backup Types

### 🌟 Full Backups
- **Frequency**: Monthly (1st day of month)
- **Content**: Complete site including all files
- **Format**: `tar.gz` (compressed archive)
- **Retention**: 12 months

### 📄 Content Backups
- **Frequency**: Weekly (Sundays)
- **Content**: Posts, layouts, includes, assets, and config files
- **Format**: `zip` (compressed archive)
- **Retention**: 4 weeks

### ⚙️ Configuration Backups
- **Frequency**: Daily
- **Content**: Configuration files and metadata
- **Format**: `json` (structured data)
- **Retention**: 7 days

## 🚀 Quick Start

### Automated Backups
```bash
# Run scheduled backup (determines type automatically)
./scripts/backup.sh

# Create specific backup type
./scripts/backup.sh daily
./scripts/backup.sh weekly
./scripts/backup.sh monthly
```

### Manual Operations
```bash
# List all available backups
./scripts/backup.sh list

# Restore from backup
./scripts/backup.sh restore backups/full_backup_20240127_120000.tar.gz

# Clean up old backups
./scripts/backup.sh cleanup

# Verify backup integrity
./scripts/backup.sh verify
```

### Python Script Usage
```bash
# Create different backup types
python3 scripts/backup.py backup --type full
python3 scripts/backup.py backup --type content
python3 scripts/backup.py backup --type config

# Restore backups
python3 scripts/backup.py restore --path backup_file.tar.gz --type full

# List and manage backups
python3 scripts/backup.py list
python3 scripts/backup.py cleanup --keep 10
```

## 📁 Backup Structure

```
backups/
├── full_backup_20240127_120000.tar.gz     # Monthly full backup
├── content_backup_20240121_120000.zip     # Weekly content backup
├── config_backup_20240127_120000.json     # Daily config backup
├── metadata.json                           # Backup metadata
└── backup.log                              # Backup logs
```

## ⚙️ Configuration

### Environment Variables
```bash
# Site path (default: current directory)
export SITE_PATH="/path/to/your/site"

# Backup directory (default: backups)
export BACKUP_DIR="/path/to/backups"

# Retention policies
export MAX_DAILY_BACKUPS=7
export MAX_WEEKLY_BACKUPS=4
export MAX_MONTHLY_BACKUPS=12
```

### Backup Configuration
The backup system includes intelligent filtering:

**Included Files**:
- `*.md`, `*.html`, `*.xml`, `*.json`, `*.yml`, `*.yaml`
- `Gemfile*`, `package*.json`
- `_layouts/`, `_includes/`, `_posts/`, `_data/`
- `js/`, `css/`, `assets/`

**Excluded Files**:
- `*.pyc`, `__pycache__`, `.git`
- `node_modules`, `.bundle`, `_site`
- `.sass-cache`, `*.log`, `.DS_Store`

## 🔄 Automated Scheduling

### Cron Job Setup
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/your/site/scripts/backup.sh

# Add weekly backup on Sunday at 3 AM
0 3 * * 0 /path/to/your/site/scripts/backup.sh weekly

# Add monthly backup on 1st at 4 AM
0 4 1 * * /path/to/your/site/scripts/backup.sh monthly
```

### GitHub Actions Integration
```yaml
# .github/workflows/backup.yml
name: 🔄 Automated Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: 🔄 Create Backup
        run: ./scripts/backup.sh
      - name: 📤 Upload Backup
        uses: actions/upload-artifact@v3
        with:
          name: site-backup
          path: backups/
```

## 🛠️ Recovery Procedures

### Full Site Recovery
```bash
# Stop any running services
bundle exec jekyll stop || true

# Restore from full backup
./scripts/backup.sh restore backups/full_backup_20240127_120000.tar.gz

# Reinstall dependencies
bundle install
npm install

# Rebuild site
bundle exec jekyll build

# Start development server
bundle exec jekyll serve
```

### Content Recovery
```bash
# Restore content (posts, layouts, includes)
./scripts/backup.sh restore backups/content_backup_20240121_120000.zip

# Rebuild site
bundle exec jekyll build
```

### Configuration Recovery
```bash
# Restore configuration files
./scripts/backup.sh restore backups/config_backup_20240127_120000.json

# Reinstall dependencies
bundle install
npm install
```

## 📊 Backup Monitoring

### Check Backup Status
```bash
# List all backups with details
./scripts/backup.sh list

# Verify backup integrity
./scripts/backup.sh verify

# Check backup logs
tail -f backups/backup.log
```

### Backup Health Metrics
- **File Size**: Verify backups are not empty
- **Checksum**: Verify file integrity
- **Timestamp**: Verify backup creation time
- **Retention**: Verify cleanup policies

## 🔧 Advanced Usage

### Custom Backup Types
```python
# Create custom backup with specific files
python3 scripts/backup.py backup --type custom --include "_posts/,_layouts/" --exclude "*.tmp"

# Create backup with custom path
python3 scripts/backup.py backup --type full --site-path /path/to/site --backup-dir /custom/backup/path
```

### Backup Verification
```bash
# Verify specific backup
python3 scripts/backup.py verify --path backups/full_backup_20240127_120000.tar.gz

# Check backup metadata
cat backups/metadata.json | jq '.backups[-1]'
```

### Emergency Recovery
```bash
# In case of complete site loss:
git clone <your-repo-url> site-temp
cd site-temp
./scripts/backup.sh restore /path/to/latest/full/backup.tar.gz
bundle install
npm install
bundle exec jekyll build
```

## 🚨 Troubleshooting

### Common Issues

**Backup Creation Failed**
```bash
# Check permissions
ls -la scripts/backup.sh
chmod +x scripts/backup.sh

# Check Python installation
python3 --version
pip3 install --upgrade setuptools
```

**Restore Failed**
```bash
# Verify backup file exists
ls -la backups/
python3 scripts/backup.py list

# Check file integrity
python3 scripts/backup.py verify
```

**Space Issues**
```bash
# Clean up old backups
./scripts/backup.sh cleanup

# Check disk usage
du -sh backups/
```

### Log Analysis
```bash
# View recent backup logs
tail -n 50 backups/backup.log

# Search for errors
grep -i error backups/backup.log

# Monitor backup process
tail -f backups/backup.log &
./scripts/backup.sh
```

## 📈 Best Practices

1. **Regular Testing**: Test restore procedures monthly
2. **Multiple Locations**: Store backups in different locations
3. **Version Control**: Keep backup scripts in version control
4. **Monitoring**: Set up alerts for backup failures
5. **Documentation**: Document recovery procedures
6. **Security**: Encrypt sensitive backup data
7. **Retention**: Follow data retention policies
8. **Verification**: Regularly verify backup integrity

## 🔐 Security Considerations

- **Encryption**: Consider encrypting sensitive backups
- **Access Control**: Limit backup file permissions
- **Audit Trail**: Maintain backup operation logs
- **Secure Storage**: Store backups in secure locations
- **Data Privacy**: Ensure compliance with data protection regulations

This backup system provides enterprise-grade reliability for your Jekyll site with automated scheduling, multiple backup types, and comprehensive recovery options.