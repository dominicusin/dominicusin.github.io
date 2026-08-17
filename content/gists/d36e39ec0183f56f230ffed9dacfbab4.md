---
title: "raid_bootloader_install"
type: gist
gist_id: "d36e39ec0183f56f230ffed9dacfbab4"
gist_url: https://gist.github.com/dominicusin/d36e39ec0183f56f230ffed9dacfbab4
updated_at: "2024-06-19T07:43:53Z"
files: ["raid_bootloader_install.sh"]
---
_raid_bootloader_install_

## raid_bootloader_install.sh

```Shell
#!/bin/bash

# Переменные для разделов и RAID массива
raid_device="/dev/md0"
efi_partitions=("/dev/sdd2" "/dev/sdb2" "/dev/nvme2n1p2" "/dev/sdc2" "/dev/nvme1n1p2" "/dev/sda2")
mount_point="/mnt/efi"
backup_dir="/tmp/efi_backup"
log_file="/var/log/raid_bootloader_install.log"

# Функция для логирования сообщений
log() {
    local message=$1
    echo "$(date '+%Y-%m-%d %H:%M:%S') : $message" | tee -a $log_file
}

# Функция для проверки и размонтирования mount_point
ensure_unmounted() {
    if mountpoint -q $mount_point; then
        sudo umount $mount_point
        if [ $? -ne 0 ]; then
            log "Ошибка: не удалось размонтировать $mount_point"
            exit 1
        fi
    fi
}

# Функция для установки GRUB на диск
install_grub() {
    local disk=$1
    sudo mount $disk $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось смонтировать $disk на $mount_point"
        exit 1
    fi
    sudo grub-install --target=x86_64-efi --efi-directory=$mount_point --bootloader-id=GRUB --recheck
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось установить GRUB на $disk"
        exit 1
    fi
    sudo umount $mount_point
    log "GRUB успешно установлен на $disk"
}

# Функция для установки systemd-boot на диск
install_systemd_boot() {
    local disk=$1
    sudo mount $disk $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось смонтировать $disk на $mount_point"
        exit 1
    fi
    sudo bootctl --path=$mount_point install
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось установить systemd-boot на $disk"
        exit 1
    fi
    sudo umount $mount_point
    log "systemd-boot успешно установлен на $disk"
}

# Функция для установки rEFInd на диск
install_refind() {
    local disk=$1
    sudo mount $disk $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось смонтировать $disk на $mount_point"
        exit 1
    fi
    sudo refind-install --root $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось установить rEFInd на $disk"
        exit 1
    fi
    sudo umount $mount_point
    log "rEFInd успешно установлен на $disk"
}

# Функция для установки Limine на диск
install_limine() {
    local disk=$1
    sudo mount $disk $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось смонтировать $disk на $mount_point"
        exit 1
    fi
    sudo limine-install $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось установить Limine на $disk"
        exit 1
    fi
    sudo umount $mount_point
    log "Limine успешно установлен на $disk"
}

# Функция для установки LILO на диск
install_lilo() {
    local disk=$1
    sudo mount $disk $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось смонтировать $disk на $mount_point"
        exit 1
    fi
    sudo lilo -M $disk
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось установить LILO на $disk"
        exit 1
    fi
    sudo umount $mount_point
    log "LILO успешно установлен на $disk"
}

# Функция для копирования содержимого /boot/efi на диск
copy_boot_contents() {
    local disk=$1
    sudo mount $disk $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось смонтировать $disk на $mount_point"
        exit 1
    fi
    sudo cp -r /boot/efi/* $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось скопировать содержимое /boot/efi на $disk"
        exit 1
    fi
    sudo umount $mount_point
    log "Содержимое /boot/efi успешно скопировано на $disk"
}

# Сохранение содержимого EFI раздела
backup_efi() {
    sudo mkdir -p $backup_dir
    sudo mount $1 $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось смонтировать $1 на $mount_point для сохранения"
        exit 1
    fi
    sudo cp -r $mount_point/* $backup_dir/
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось сохранить содержимое $1"
        exit 1
    fi
    sudo umount $mount_point
    log "Содержимое EFI раздела успешно сохранено из $1"
}

# Восстановление содержимого EFI раздела
restore_efi() {
    sudo mount $raid_device $mount_point
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось смонтировать $raid_device на $mount_point для восстановления"
        exit 1
    fi
    sudo cp -r $backup_dir/* $mount_point/
    if [ $? -ne 0 ]; then
        log "Ошибка: не удалось восстановить содержимое на $raid_device"
        exit 1
    fi
    sudo umount $mount_point
    log "Содержимое EFI раздела успешно восстановлено на $raid_device"
}

# Остановка RAID
log "Остановка RAID массива $raid_device"
sudo mdadm --stop $raid_device
if [ $? -ne 0 ]; then
    log "Ошибка: не удалось остановить RAID массив $raid_device"
    exit 1
fi

# Убедиться, что mount_point размонтирован
ensure_unmounted

# Установка загрузчиков на каждый диск
for disk in "${efi_partitions[@]}"; do
    log "Установка загрузчиков на $disk"
    install_grub $disk
    install_systemd_boot $disk
    install_refind $disk
    install_limine $disk
    install_lilo $disk
    copy_boot_contents $disk
done

# Сохранение содержимого одного из EFI разделов
log "Сохранение содержимого EFI раздела с ${efi_partitions[0]}"
backup_efi ${efi_partitions[0]}

# Пересоздание RAID с сохранением содержимого (метаданные версии 1.0)
log "Пересоздание RAID массива $raid_device с метаданными версии 1.0"
sudo mdadm --create --verbose $raid_device --level=1 --raid-devices=${#efi_partitions[@]} --metadata=1.0 ${efi_partitions[@]}
if [ $? -ne 0 ]; then
    log "Ошибка: не удалось создать RAID массив $raid_device"
    exit 1
fi

# Восстановление содержимого EFI раздела
log "Восстановление содержимого EFI раздела на $raid_device"
restore_efi

# Монтаж RAID
log "Монтаж RAID массива $raid_device на /boot/efi"
sudo mount $raid_device /boot/efi
if [ $? -ne 0 ]; then
    log "Ошибка: не удалось смонтировать $raid_device на /boot/efi"
    exit 1
fi

log "Установка загрузчиков завершена и RAID массив успешно пересобран."

```


