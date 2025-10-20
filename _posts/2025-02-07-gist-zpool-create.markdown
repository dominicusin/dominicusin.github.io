---
layout: post
title: "zpool create"
date: 2025-02-07 19:29:56 +0300
categories: gist
tags: [gist, code]
gist_id: 64a2951303a20059006c99895f8a35d8
gist_url: https://gist.github.com/dominicusin/64a2951303a20059006c99895f8a35d8
---

zpool create

[View on GitHub Gist](https://gist.github.com/dominicusin/64a2951303a20059006c99895f8a35d8)

```bash
#!/bin/bash

set -e

# Define disk arrays
HDD_DISKS=(
    "/dev/disk/by-id/ata-WDC_WD4003FRYZ-01F0DB0_VBGGLSNF"
    "/dev/disk/by-id/ata-WDC_WD4003FRYZ-01F0DB0_VBGGL0RF"
    "/dev/disk/by-id/ata-TOSHIBA_HDWR11A_X1K0A036FB4G"
    "/dev/disk/by-id/ata-TOSHIBA_HDWR11A_X1K0A031FB4G"
)

NVME_DISKS=(
    "/dev/disk/by-id/nvme-Samsung_SSD_970_EVO_1TB_S467NX0K822865W"
    "/dev/disk/by-id/nvme-CT2000P3PSSD8_2305E6A607AC"
    "/dev/disk/by-id/nvme-WD_Blue_SN580_2TB_23306X800120"
    "/dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S6Z2NF0X200223V"
    "/dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221858P"
    "/dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221870V"
)

# Partition type GUIDs
GUID_BIOS_BOOT="ef02"
GUID_XBOOTLDR="bc13c2ff-59e6-4262-a352-b275fd6f7172"
GUID_APPLE_BOOT="426F6F74-0000-11AA-AA11-00306543ECAC"
GUID_MS_RESERVED="e3c9e316-0b5c-4db8-817d-f92df00215ae"
GUID_WINDOWS_RECOVERY="27d7f88a-c0e4-4640-9bd3-4cfc0e305e6c"
GUID_SWAP="8200"
GUID_ZFS="bf00"

# Install necessary packages
#pacman -Sy --noconfirm sgdisk zfs-utils mdadm

# Function to determine swap size based on disk size
get_swap_size() {
    local disk_size_gib=$1
    if (( $(echo "$disk_size_gib <= 1.5" | bc -l) )); then
        echo "32G"
    elif (( $(echo "$disk_size_gib <= 4" | bc -l) )); then
        echo "64G"
    elif (( $(echo "$disk_size_gib <= 10" | bc -l) )); then
        echo "128G"
    else
        echo "512G"
    fi
}

# Function to partition HDDs
partition_hdd() {
    local DISK=$1
    local SWAP_SIZE=$2
     partprobe  "$DISK"
     zpool labelclear -f  "$DISK"
     wipefs -af "$DISK"
     sgdisk --zap-all "$DISK"
     sgdisk  -og  "$DISK"
#     sgdisk --new=1:0:+2M --typecode=1:$GUID_BIOS_BOOT --change-name=1:"BIOS Boot" "$DISK"
     sgdisk -n 1:2048:4095 -c 1:"BIOS Boot Partition" -t 1:ef02  "$DISK"
     sgdisk --new=2:0:+4G --typecode=2:$GUID_XBOOTLDR --change-name=2:"XBOOTLDR" "$DISK"
     sgdisk --new=3:0:+200M --typecode=3:$GUID_APPLE_BOOT --change-name=3:"Apple Boot" "$DISK"
     sgdisk --new=4:0:+128M --typecode=4:$GUID_MS_RESERVED --change-name=4:"MS Reserved" "$DISK"
     sgdisk --new=5:0:+450M --typecode=5:$GUID_WINDOWS_RECOVERY --change-name=5:"Windows Recovery" "$DISK"
     sgdisk --new=6:0:+$SWAP_SIZE --typecode=6:$GUID_SWAP --change-name=6:"Linux Swap" "$DISK"
     ENDSECTOR=$(sgdisk -E  "$DISK")
     sgdisk --new=7:0:"$ENDSECTOR" --typecode=7:$GUID_ZFS --change-name=7:"ZFS Data" "$DISK"
#     sgdisk --new=7:0:0 --typecode=7:$GUID_ZFS --change-name=7:"ZFS Data" "$DISK"
     sgdisk  -p  "$DISK"
     partprobe  "$DISK"
}

# Function to partition NVMe
partition_nvme() {
    local DISK=$1

    # Get disk size in GiB
    local DISK_SIZE_BYTES=$(lsblk -b -dn -o SIZE "$DISK")
    local DISK_SIZE_GIB=$(echo "scale=2; $DISK_SIZE_BYTES / (1024^3)" | bc)

    # Calculate sizes
    local SLOG_SIZE=$(echo "scale=2; $DISK_SIZE_GIB * 0.02" | bc)     # 2%
    local L2ARC_SIZE=$(echo "scale=2; $DISK_SIZE_GIB * 0.30" | bc)   # 30%
    local SPECIAL_SIZE=$(echo "scale=2; $DISK_SIZE_GIB * 0.10" | bc)  # 10%

    # Convert to GiB with rounding
    SLOG_SIZE=$(printf "%.0f" "$SLOG_SIZE")
    L2ARC_SIZE=$(printf "%.0f" "$L2ARC_SIZE")
    SPECIAL_SIZE=$(printf "%.0f" "$SPECIAL_SIZE")

    # Remaining space after fixed partitions and ZFS components
    local FIXED_SIZE_MB=0
    FIXED_SIZE_MB=$((FIXED_SIZE_MB + 2))      # BIOS Boot
    FIXED_SIZE_MB=$((FIXED_SIZE_MB + 4096))  # XBOOTLDR
    FIXED_SIZE_MB=$((FIXED_SIZE_MB + 200))   # Apple Boot
    FIXED_SIZE_MB=$((FIXED_SIZE_MB + 128))   # MS Reserved
    FIXED_SIZE_MB=$((FIXED_SIZE_MB + 450))   # Windows Recovery

    local SWAP_SIZE_MB=$(echo "$SWAP_SIZE" | sed 's/G/*1024/' | bc)
    FIXED_SIZE_MB=$(echo "$FIXED_SIZE_MB + $SWAP_SIZE_MB" | bc)

    local TOTAL_SIZE_MB=$(echo "$DISK_SIZE_GIB * 1024" | bc)
    local REMAINING_MB=$(echo "$TOTAL_SIZE_MB - $FIXED_SIZE_MB - ($SLOG_SIZE * 1024) - ($L2ARC_SIZE * 1024) - ($SPECIAL_SIZE * 1024)" | bc)

    # Assign remaining to ZFS Data
    local ZFS_DATA_SIZE_MB=$(echo "$REMAINING_MB" | bc)

    # Create partitions
     partprobe  "$DISK"
     zpool labelclear -f  "$DISK"
     wipefs -af "$DISK"
     sgdisk --zap-all "$DISK"
     sgdisk  -o  "$DISK"
#     sgdisk --new=1:0:+2M --typecode=1:$GUID_BIOS_BOOT --change-name=1:"BIOS Boot" "$DISK"
     sgdisk -n 1:2048:4095 -c 1:"BIOS Boot Partition" -t 1:ef02  "$DISK"
     sgdisk --new=2:0:+4G --typecode=2:$GUID_XBOOTLDR --change-name=2:"XBOOTLDR" "$DISK"
     sgdisk --new=3:0:+200M --typecode=3:$GUID_APPLE_BOOT --change-name=3:"Apple Boot" "$DISK"
     sgdisk --new=4:0:+128M --typecode=4:$GUID_MS_RESERVED --change-name=4:"MS Reserved" "$DISK"
     sgdisk --new=5:0:+450M --typecode=5:$GUID_WINDOWS_RECOVERY --change-name=5:"Windows Recovery" "$DISK"
     sgdisk --new=6:0:+${SWAP_SIZE}G --typecode=6:$GUID_SWAP --change-name=6:"Linux Swap" "$DISK"
     sgdisk --new=7:0:+${SLOG_SIZE}G --typecode=7:$GUID_ZFS --change-name=7:"ZFS SLOG" "$DISK"
     sgdisk --new=8:0:+${L2ARC_SIZE}G --typecode=8:$GUID_ZFS --change-name=8:"ZFS L2ARC" "$DISK"
     sgdisk --new=9:0:+${SPECIAL_SIZE}G --typecode=9:$GUID_ZFS --change-name=9:"ZFS Special" "$DISK"
     ENDSECTOR=$(sgdisk -E  "$DISK")
     sgdisk --new=10:0:"$ENDSECTOR" --typecode=10:$GUID_ZFS --change-name=10:"ZFS Dedup" "$DISK"
#     sgdisk --new=10:0:0 --typecode=10:$GUID_ZFS --change-name=10:"ZFS Data" "$DISK"
     sgdisk  -p  "$DISK"
     partprobe  "$DISK"
}

# Partition HDDs
for DISK in "${HDD_DISKS[@]}"; do
    DISK_SIZE_BYTES=$(lsblk -b -dn -o SIZE "$DISK")
    DISK_SIZE_GIB=$(echo "scale=2; $DISK_SIZE_BYTES / (1024^3)" | bc)
    SWAP_SIZE=$(get_swap_size "$DISK_SIZE_GIB")
    partition_hdd "$DISK" "$SWAP_SIZE"
done

# Partition NVMe
for DISK in "${NVME_DISKS[@]}"; do
    partition_nvme "$DISK"
done

# Inform kernel of partition changes
#echo partprobe

# Format swap partitions and enable
for DISK in "${HDD_DISKS[@]}" "${NVME_DISKS[@]}"; do
    SWAP_PART="${DISK}-part6"
#echo     mkswap "$SWAP_PART"
#echo     swapon "$SWAP_PART"
done

# Create RAID0 arrays for log, cache, special on NVMe
#echo mdadm --create --verbose /dev/md0 --level=0 --raid-devices=3     "${NVME_DISKS[0]}-part7" "${NVME_DISKS[1]}-part7" "${NVME_DISKS[2]}-part7 ${NVME_DISKS[3]}-part7" "${NVME_DISKS[4]}-part7" "${NVME_DISKS[5]}-part7"
#echo mdadm --create --verbose /dev/md1 --level=0 --raid-devices=3     "${NVME_DISKS[0]}-part8" "${NVME_DISKS[1]}-part8" "${NVME_DISKS[2]}-part8 ${NVME_DISKS[3]}-part8" "${NVME_DISKS[4]}-part8" "${NVME_DISKS[5]}-part8"
#echo mdadm --create --verbose /dev/md2 --level=0 --raid-devices=3     "${NVME_DISKS[0]}-part9" "${NVME_DISKS[1]}-part9" "${NVME_DISKS[2]}-part9 ${NVME_DISKS[3]}-part9" "${NVME_DISKS[4]}-part9" "${NVME_DISKS[5]}-part9"

# Wait for RAID arrays to initialize
#sleep 10

# Create ZFS pool
#echo zpool create zfs_pool raidz0 "${HDD_DISKS[@]/%/-part7}"     log  "${NVME_DISKS[0]}-part7" "${NVME_DISKS[1]}-part7" "${NVME_DISKS[2]}-part7 ${NVME_DISKS[3]}-part7" "${NVME_DISKS[4]}-part7" "${NVME_DISKS[5]}-part7"     cache "${NVME_DISKS[0]}-part8" "${NVME_DISKS[1]}-part8" "${NVME_DISKS[2]}-part8 ${NVME_DISKS[3]}-part8" "${NVME_DISKS[4]}-part8" "${NVME_DISKS[5]}-part8"     special "${NVME_DISKS[0]}-part9" "${NVME_DISKS[1]}-part9" "${NVME_DISKS[2]}-part9 ${NVME_DISKS[3]}-part9" "${NVME_DISKS[4]}-part9" "${NVME_DISKS[5]}-part9"
#echo "ZFS pool 'zfs_pool' created successfully with log, cache, and special on RAID0 arrays."


#mkswap /dev/disk/by-id/ata-WDC_WD4003FRYZ-01F0DB0_VBGGLSNF-part6
#mkswap /dev/disk/by-id/ata-WDC_WD4003FRYZ-01F0DB0_VBGGL0RF-part6
#mkswap /dev/disk/by-id/ata-TOSHIBA_HDWR11A_X1K0A036FB4G-part6
#mkswap /dev/disk/by-id/ata-TOSHIBA_HDWR11A_X1K0A031FB4G-part6
#mkswap /dev/disk/by-id/nvme-Samsung_SSD_970_EVO_1TB_S467NX0K822865W-part6
#mkswap /dev/disk/by-id/nvme-CT2000P3PSSD8_2305E6A607AC-part6
#mkswap /dev/disk/by-id/nvme-WD_Blue_SN580_2TB_23306X800120-part6
#mkswap /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S6Z2NF0X200223V-part6
#mkswap /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221858P-part6
#mkswap /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221870V-part6

#zpool destroy -f mypool


zpool create \
 -f \
 -m none \
 -R /mnt \
 -t mypool \
 -o ashift=12 \
 -o autoexpand=on \
 -o autoreplace=on \
 -o autotrim=on \
 -o cachefile=/etc/zfs/zpool.cache \
 -o comment="My zfs pool" \
 -o delegation=on \
 -o failmode=continue \
 -o feature@allocation_classes=enabled \
 -o feature@async_destroy=enabled \
 -o feature@bookmarks=enabled \
 -o feature@bookmark_v2=enabled \
 -o feature@bookmark_written=enabled \
 -o feature@device_rebuild=enabled \
 -o feature@device_removal=enabled \
 -o feature@draid=enabled \
 -o feature@edonr=enabled \
 -o feature@embedded_data=enabled \
 -o feature@empty_bpobj=enabled \
 -o feature@enabled_txg=enabled \
 -o feature@encryption=enabled \
 -o feature@extensible_dataset=enabled \
 -o feature@filesystem_limits=enabled \
 -o feature@hole_birth=enabled \
 -o feature@large_blocks=enabled \
 -o feature@large_dnode=enabled \
 -o feature@livelist=enabled \
 -o feature@log_spacemap=enabled \
 -o feature@lz4_compress=enabled \
 -o feature@multi_vdev_crash_dump=enabled \
 -o feature@obsolete_counts=enabled \
 -o feature@project_quota=enabled \
 -o feature@redacted_datasets=enabled \
 -o feature@redaction_bookmarks=enabled \
 -o feature@resilver_defer=enabled \
 -o feature@sha512=enabled \
 -o feature@skein=enabled \
 -o feature@spacemap_histogram=enabled \
 -o feature@spacemap_v2=enabled \
 -o feature@userobj_accounting=enabled \
 -o feature@zpool_checkpoint=enabled \
 -o feature@zstd_compress=enabled \
 -o listsnapshots=on \
 -o multihost=on \
 -O aclinherit=restricted \
 -O aclmode=groupmask \
 -O acltype=posixacl \
 -O atime=on \
 -O canmount=noauto \
 -O casesensitivity=sensitive \
 -O checksum=sha256 \
 -O compression=lz4 \
 -O copies=1 \
 -O dedup=sha256,verify \
 -O devices=on \
 -O dnodesize=auto \
 -O encryption=off \
 -O exec=on \
 -O filesystem_limit=none \
 -O logbias=throughput \
 -O mountpoint=legacy \
 -O nbmand=on \
 -O normalization=formD \
 -O overlay=on \
 -O primarycache=all \
 -O quota=none \
 -O readonly=off \
 -O recordsize=1M \
 -O redundant_metadata=some \
 -O refquota=none \
 -O relatime=on \
 -O reservation=none \
 -O secondarycache=all \
 -O setuid=on \
 -O sharenfs=on \
 -O sharesmb=on \
 -O snapdev=visible \
 -O snapdir=visible \
 -O snapshot_limit=none \
 -O sync=disabled \
 -O version=current \
 -O volmode=full \
 -O vscan=on \
 -O xattr=sa \
 zfs_pool draid \
 /dev/disk/by-id/ata-WDC_WD4003FRYZ-01F0DB0_VBGGLSNF-part7 /dev/disk/by-id/ata-WDC_WD4003FRYZ-01F0DB0_VBGGL0RF-part7 /dev/disk/by-id/ata-TOSHIBA_HDWR11A_X1K0A036FB4G-part7 /dev/disk/by-id/ata-TOSHIBA_HDWR11A_X1K0A031FB4G-part7 \
 log /dev/disk/by-id/nvme-Samsung_SSD_970_EVO_1TB_S467NX0K822865W-part7 /dev/disk/by-id/nvme-CT2000P3PSSD8_2305E6A607AC-part7 /dev/disk/by-id/nvme-WD_Blue_SN580_2TB_23306X800120-part7 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S6Z2NF0X200223V-part7 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221858P-part7 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221870V-part7 \
 cache /dev/disk/by-id/nvme-Samsung_SSD_970_EVO_1TB_S467NX0K822865W-part8 /dev/disk/by-id/nvme-CT2000P3PSSD8_2305E6A607AC-part8 /dev/disk/by-id/nvme-WD_Blue_SN580_2TB_23306X800120-part8 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S6Z2NF0X200223V-part8 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221858P-part8 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221870V-part8 \
 special /dev/disk/by-id/nvme-Samsung_SSD_970_EVO_1TB_S467NX0K822865W-part9 /dev/disk/by-id/nvme-CT2000P3PSSD8_2305E6A607AC-part9 /dev/disk/by-id/nvme-WD_Blue_SN580_2TB_23306X800120-part9 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S6Z2NF0X200223V-part9 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221858P-part9 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221870V-part9 \
 dedup /dev/disk/by-id/nvme-Samsung_SSD_970_EVO_1TB_S467NX0K822865W-part10 /dev/disk/by-id/nvme-CT2000P3PSSD8_2305E6A607AC-part10 /dev/disk/by-id/nvme-WD_Blue_SN580_2TB_23306X800120-part10 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S6Z2NF0X200223V-part10 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221858P-part10 /dev/disk/by-id/nvme-Samsung_SSD_990_PRO_2TB_S7DNNJ0X221870V-part10 

#
#
#


```

