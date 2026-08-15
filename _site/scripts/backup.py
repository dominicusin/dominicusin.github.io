#!/usr/bin/env python3
"""
Automated Backup and Recovery System for Jekyll Site
Creates automated backups of critical files and provides recovery mechanisms
"""

import os
import sys
import json
import shutil
import tarfile
import zipfile
import datetime
import argparse
import subprocess
from pathlib import Path


class BackupManager:
    def __init__(self, site_path=".", backup_dir="backups"):
        self.site_path = Path(site_path)
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)

        # Configuration
        self.config = {
            "exclude_patterns": [
                "*.pyc",
                "__pycache__",
                ".git",
                "node_modules",
                ".bundle",
                "_site",
                ".sass-cache",
                "*.log",
                ".DS_Store",
            ],
            "include_patterns": [
                "*.md",
                "*.html",
                "*.xml",
                "*.json",
                "*.yml",
                "*.yaml",
                "Gemfile*",
                "package*.json",
                "_layouts/",
                "_includes/",
                "_posts/",
                "_data/",
                "js/",
                "css/",
                "assets/",
            ],
        }

    def create_backup(self, backup_type="full"):
        """Create backup of the site"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{backup_type}_backup_{timestamp}"

        if backup_type == "full":
            backup_path = self.backup_dir / f"{backup_name}.tar.gz"
            self._create_full_backup(backup_path)
        elif backup_type == "content":
            backup_path = self.backup_dir / f"{backup_name}.zip"
            self._create_content_backup(backup_path)
        elif backup_type == "config":
            backup_path = self.backup_dir / f"{backup_name}.json"
            self._create_config_backup(backup_path)
        else:
            raise ValueError(f"Unknown backup type: {backup_type}")

        # Create backup metadata
        metadata = {
            "type": backup_type,
            "timestamp": timestamp,
            "path": str(backup_path),
            "size": backup_path.stat().st_size if backup_path.exists() else 0,
            "checksum": self._calculate_checksum(backup_path)
            if backup_path.exists()
            else None,
        }

        self._save_backup_metadata(metadata)

        print(f"✅ Backup created: {backup_path}")
        print(f"📊 Size: {metadata['size']:,} bytes")

        return metadata

    def _create_full_backup(self, backup_path):
        """Create full site backup as tar.gz"""
        with tarfile.open(backup_path, "w:gz") as tar:
            for item in self.site_path.rglob("*"):
                if self._should_include_file(item):
                    arcname = str(item.relative_to(self.site_path))
                    tar.add(item, arcname=arcname)

    def _create_content_backup(self, backup_path):
        """Create content-only backup (posts, pages, layouts, includes)"""
        with zipfile.ZipFile(backup_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            content_dirs = ["_posts", "_layouts", "_includes", "_data", "assets"]

            for dir_name in content_dirs:
                dir_path = self.site_path / dir_name
                if dir_path.exists():
                    for file_path in dir_path.rglob("*"):
                        if file_path.is_file() and self._should_include_file(file_path):
                            arcname = str(file_path.relative_to(self.site_path))
                            zipf.write(file_path, arcname)

            # Include config files
            config_files = ["_config.yml", "Gemfile", "package.json", "manifest.json"]
            for config_file in config_files:
                file_path = self.site_path / config_file
                if file_path.exists() and self._should_include_file(file_path):
                    arcname = str(file_path.relative_to(self.site_path))
                    zipf.write(file_path, arcname)

    def _create_config_backup(self, backup_path):
        """Create configuration backup"""
        config_data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "config": {},
            "package": {},
            "manifest": {},
            "git_config": {},
        }

        # Read Jekyll config
        config_file = self.site_path / "_config.yml"
        if config_file.exists():
            with open(config_file, "r", encoding="utf-8") as f:
                config_data["config"] = f.read()

        # Read package.json
        package_file = self.site_path / "package.json"
        if package_file.exists():
            with open(package_file, "r", encoding="utf-8") as f:
                config_data["package"] = json.load(f)

        # Read manifest.json
        manifest_file = self.site_path / "manifest.json"
        if manifest_file.exists():
            with open(manifest_file, "r", encoding="utf-8") as f:
                config_data["manifest"] = json.load(f)

        # Get Git info if available
        try:
            git_commit = subprocess.check_output(
                ["git", "rev-parse", "HEAD"], cwd=self.site_path, text=True
            ).strip()
            config_data["git_config"]["current_commit"] = git_commit
        except subprocess.CalledProcessError:
            pass

        with open(backup_path, "w", encoding="utf-8") as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)

    def restore_backup(self, backup_path, restore_type="full"):
        """Restore from backup"""
        backup_path = Path(backup_path)

        if not backup_path.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_path}")

        if restore_type == "full":
            self._restore_full_backup(backup_path)
        elif restore_type == "content":
            self._restore_content_backup(backup_path)
        elif restore_type == "config":
            self._restore_config_backup(backup_path)
        else:
            raise ValueError(f"Unknown restore type: {restore_type}")

        print(f"✅ Backup restored from: {backup_path}")

    def _restore_full_backup(self, backup_path):
        """Restore from full backup"""
        with tarfile.open(backup_path, "r:gz") as tar:
            tar.extractall(path=self.site_path)

    def _restore_content_backup(self, backup_path):
        """Restore from content backup"""
        with zipfile.ZipFile(backup_path, "r") as zipf:
            zipf.extractall(path=self.site_path)

    def _restore_config_backup(self, backup_path):
        """Restore from config backup"""
        with open(backup_path, "r", encoding="utf-8") as f:
            config_data = json.load(f)

        # Restore _config.yml
        if "config" in config_data:
            config_file = self.site_path / "_config.yml"
            with open(config_file, "w", encoding="utf-8") as f:
                f.write(config_data["config"])

        # Restore package.json
        if "package" in config_data:
            package_file = self.site_path / "package.json"
            with open(package_file, "w", encoding="utf-8") as f:
                json.dump(config_data["package"], f, indent=2, ensure_ascii=False)

        # Restore manifest.json
        if "manifest" in config_data:
            manifest_file = self.site_path / "manifest.json"
            with open(manifest_file, "w", encoding="utf-8") as f:
                json.dump(config_data["manifest"], f, indent=2, ensure_ascii=False)

    def list_backups(self):
        """List all available backups"""
        backups = []

        for backup_file in self.backup_dir.rglob("*"):
            if backup_file.is_file():
                backup_type = "unknown"
                if backup_file.suffix == ".gz":
                    backup_type = "full"
                elif backup_file.suffix == ".zip":
                    backup_type = "content"
                elif backup_file.suffix == ".json" and "backup" in backup_file.name:
                    backup_type = "config"

                backups.append(
                    {
                        "type": backup_type,
                        "name": backup_file.name,
                        "path": str(backup_file),
                        "size": backup_file.stat().st_size,
                        "modified": datetime.datetime.fromtimestamp(
                            backup_file.stat().st_mtime
                        ),
                    }
                )

        return sorted(backups, key=lambda x: x["modified"], reverse=True)

    def cleanup_old_backups(self, keep_count=10):
        """Remove old backups, keeping only the most recent ones"""
        backups = self.list_backups()

        if len(backups) <= keep_count:
            return

        backups_to_remove = backups[keep_count:]

        for backup in backups_to_remove:
            backup_path = Path(backup["path"])
            backup_path.unlink()
            print(f"🗑️  Removed old backup: {backup_path}")

    def _should_include_file(self, file_path):
        """Check if file should be included in backup"""
        file_path_str = str(file_path)

        # Check exclude patterns
        for pattern in self.config["exclude_patterns"]:
            if pattern in file_path_str or file_path.name.startswith(
                pattern.rstrip("*")
            ):
                return False

        # Check include patterns
        for pattern in self.config["include_patterns"]:
            if pattern in file_path_str or file_path.name == pattern:
                return True

        # Default include for files not excluded
        return True

    def _calculate_checksum(self, file_path):
        """Calculate checksum for file verification"""
        import hashlib

        hash_sha256 = hashlib.sha256()

        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)

        return hash_sha256.hexdigest()

    def _save_backup_metadata(self, metadata):
        """Save backup metadata"""
        metadata_file = self.backup_dir / "metadata.json"

        # Load existing metadata
        if metadata_file.exists():
            with open(metadata_file, "r") as f:
                existing_data = json.load(f)
        else:
            existing_data = {"backups": []}

        # Add new backup
        existing_data["backups"].append(metadata)

        # Keep only last 50 backup records
        if len(existing_data["backups"]) > 50:
            existing_data["backups"] = existing_data["backups"][-50:]

        # Save updated metadata
        with open(metadata_file, "w") as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(description="Backup and Recovery System")
    parser.add_argument(
        "action",
        choices=["backup", "restore", "list", "cleanup"],
        help="Action to perform",
    )
    parser.add_argument(
        "--type",
        choices=["full", "content", "config"],
        default="full",
        help="Backup/restore type",
    )
    parser.add_argument("--path", help="Backup file path (for restore)")
    parser.add_argument(
        "--keep", type=int, default=10, help="Number of backups to keep (for cleanup)"
    )
    parser.add_argument("--site-path", default=".", help="Site path")
    parser.add_argument("--backup-dir", default="backups", help="Backup directory")

    args = parser.parse_args()

    manager = BackupManager(args.site_path, args.backup_dir)

    if args.action == "backup":
        metadata = manager.create_backup(args.type)
        print(f"✅ {args.type.capitalize()} backup completed")

    elif args.action == "restore":
        if not args.path:
            print("❌ --path is required for restore action")
            sys.exit(1)

        manager.restore_backup(args.path, args.type)
        print(f"✅ {args.type.capitalize()} restore completed")

    elif args.action == "list":
        backups = manager.list_backups()

        if not backups:
            print("📦 No backups found")
            return

        print("📦 Available backups:")
        for backup in backups:
            print(
                f"  {backup['type']:8} {backup['modified']:19} {backup['size']:8,}B  {backup['name']}"
            )

    elif args.action == "cleanup":
        manager.cleanup_old_backups(args.keep)
        print(f"✅ Cleanup completed (kept {args.keep} most recent backups)")


if __name__ == "__main__":
    main()
