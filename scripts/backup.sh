#!/bin/bash
# Automated Backup Script for Jekyll Site
# Creates daily, weekly, and monthly backups

set -e

# Configuration
SITE_PATH="${SITE_PATH:-.}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
LOG_FILE="${BACKUP_DIR}/backup.log"
MAX_DAILY_BACKUPS=7
MAX_WEEKLY_BACKUPS=4
MAX_MONTHLY_BACKUPS=12

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
	echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Get backup type based on day of week
get_backup_type() {
	local day_of_week=$(date +%u) # 1-7 (Monday-Sunday)
	local day_of_month=$(date +%d)

	# Monthly backup on 1st day of month
	if [ "$day_of_month" = "01" ]; then
		echo "monthly"
	# Weekly backup on Sunday (day 7)
	elif [ "$day_of_week" = "7" ]; then
		echo "weekly"
	# Daily backup otherwise
	else
		echo "daily"
	fi
}

# Create backup
create_backup() {
	local backup_type=$1
	local timestamp=$(date +%Y%m%d_%H%M%S)
	local backup_name="${backup_type}_backup_${timestamp}"

	log "Starting ${backup_type} backup..."

	case $backup_type in
	"monthly")
		python3 scripts/backup.py backup --type full --site-path "$SITE_PATH" --backup-dir "$BACKUP_DIR"
		;;
	"weekly")
		python3 scripts/backup.py backup --type content --site-path "$SITE_PATH" --backup-dir "$BACKUP_DIR"
		;;
	"daily")
		python3 scripts/backup.py backup --type config --site-path "$SITE_PATH" --backup-dir "$BACKUP_DIR"
		;;
	esac

	log "✅ ${backup_type} backup completed: ${backup_name}"
}

# Cleanup old backups
cleanup_backups() {
	log "Cleaning up old backups..."

	# Clean up daily backups (keep last 7 days)
	python3 scripts/backup.py list --site-path "$SITE_PATH" --backup-dir "$BACKUP_DIR" |
		grep "daily" | tail -n +$((MAX_DAILY_BACKUPS + 1)) |
		awk '{print $NF}' | xargs -I {} rm -f "$BACKUP_DIR/{}" 2>/dev/null || true

	# Clean up weekly backups (keep last 4 weeks)
	python3 scripts/backup.py list --site-path "$SITE_PATH" --backup-dir "$BACKUP_DIR" |
		grep "weekly" | tail -n +$((MAX_WEEKLY_BACKUPS + 1)) |
		awk '{print $NF}' | xargs -I {} rm -f "$BACKUP_DIR/{}" 2>/dev/null || true

	# Clean up monthly backups (keep last 12 months)
	python3 scripts/backup.py list --site-path "$SITE_PATH" --backup-dir "$BACKUP_DIR" |
		grep "monthly" | tail -n +$((MAX_MONTHLY_BACKUPS + 1)) |
		awk '{print $NF}' | xargs -I {} rm -f "$BACKUP_DIR/{}" 2>/dev/null || true

	log "✅ Backup cleanup completed"
}

# Verify backup integrity
verify_backups() {
	log "Verifying backup integrity..."

	# Check if backup directory exists and has files
	if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
		log "⚠️  No backups found"
		return 1
	fi

	# Verify latest backup
	local latest_backup=$(ls -t "$BACKUP_DIR"/*backup* 2>/dev/null | head -1)
	if [ -n "$latest_backup" ]; then
		local file_size=$(stat -f%z "$latest_backup" 2>/dev/null || stat -c%s "$latest_backup" 2>/dev/null)
		if [ "$file_size" -gt 0 ]; then
			log "✅ Latest backup verified: $(basename "$latest_backup") ($file_size bytes)"
		else
			log "❌ Latest backup is empty: $(basename "$latest_backup")"
			return 1
		fi
	fi

	return 0
}

# Main execution
main() {
	log "🚀 Starting automated backup process..."

	# Get backup type
	backup_type=$(get_backup_type)
	log "📅 Backup type: $backup_type"

	# Create backup
	create_backup "$backup_type"

	# Cleanup old backups
	cleanup_backups

	# Verify backups
	if verify_backups; then
		log "✅ All backup operations completed successfully"
	else
		log "❌ Backup verification failed"
		exit 1
	fi

	# Show backup summary
	log "📊 Backup Summary:"
	python3 scripts/backup.py list --site-path "$SITE_PATH" --backup-dir "$BACKUP_DIR" |
		head -10 | while read line; do
		log "   $line"
	done
}

# Handle command line arguments
case "${1:-}" in
"daily" | "weekly" | "monthly")
	create_backup "$1"
	;;
"cleanup")
	cleanup_backups
	;;
"verify")
	verify_backups
	;;
"list")
	python3 scripts/backup.py list --site-path "$SITE_PATH" --backup-dir "$BACKUP_DIR"
	;;
"restore")
	if [ -z "$2" ]; then
		echo "Usage: $0 restore <backup_file>"
		exit 1
	fi
	python3 scripts/backup.py restore --path "$2" --site-path "$SITE_PATH" --backup-dir "$BACKUP_DIR"
	;;
"help" | "-h" | "--help")
	echo "Usage: $0 [command]"
	echo "Commands:"
	echo "  (no args)    Run scheduled backup (daily/weekly/monthly)"
	echo "  daily        Create daily backup"
	echo "  weekly       Create weekly backup"
	echo "  monthly      Create monthly backup"
	echo "  cleanup      Clean up old backups"
	echo "  verify       Verify backup integrity"
	echo "  list         List all backups"
	echo "  restore <file>  Restore from backup"
	echo "  help         Show this help"
	exit 0
	;;
"")
	main
	;;
*)
	echo "Unknown command: $1"
	echo "Use '$0 help' for usage information"
	exit 1
	;;
esac
