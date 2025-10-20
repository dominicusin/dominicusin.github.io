---
layout: post
title: "chroot"
date: 2025-01-24 12:46:30 +0300
categories: gist
tags: [gist, code]
gist_id: 8402abedb4df49c2852ce150f03a5372
gist_url: https://gist.github.com/dominicusin/8402abedb4df49c2852ce150f03a5372
---

chroot

[View on GitHub Gist](https://gist.github.com/dominicusin/8402abedb4df49c2852ce150f03a5372)

```text
dnf --releasever='rawhide'  --repofrompath='rawhide,http://mirrors.dotsrc.org/fedora-enchilada/linux/development/rawhide/Everything/x86_64/os/'  --repofrompath='rawhide-modular,https://mirrors.huaweicloud.com/repository/fedora/development/rawhide/Modular/x86_64/os/'   --installroot='/chroot/fedora'   --enablerepo='rawhide,rawhide-modular'  --setopt=install_weak_deps=True --nogpgcheck install  dnf @core 
##dnf install --nogpgcheck --repofrompath 'terra,https://repos.fyralabs.com/terra$releasever' terra-release
debootstrap --verbose  --no-check-gpg --no-merged-usr --components="main,contrib,non-free,non-free-firmware"    ceres /chroot/devuan http://deb.devuan.org/merged
debootstrap --verbose --components=main,contrib,non-free-firmware,non-free --variant=minbase --merged-usr --force-check-gpg --log-extra-deps  stable /chroot/debian   https://deb.debian.org/debian
ARCH=amd64 debootstrap --arch=amd64 --verbose --components=main,multiverse,restricted,universe --extra-suites=plucky,plucky-backports,plucky-proposed,plucky-security,plucky-updates,devel-backports,devel-proposed,devel-security,devel-updates,devel --variant=minbase --merged-usr --force-check-sig --force-check-gpg --log-extra-deps  --include=build-essential,tasksel,aptitude,mc,htop,most,mosh,screen,tmux   plucky /mnt/Ubuntu http://archive.ubuntu.com/ubuntu/
zypper --root /chroot/suse  install --allow-vendor-change --allow-arch-change --allow-name-change --allow-downgrade --recommends --force-resolution --auto-agree-with-licenses --replacefiles --no-confirm --force --allow-unsigned-rpm --oldpackage --details  zypper
pacman -r /chroot/arch --cachedir=/chroot/arch/var/cache/pacman/pkg --config=/chroot/arch/etc/pacman.conf  -Syyuu base base-devel
nixos-generate-config  --root /mnt/NixOS; nixos-install  --root /mnt/NixOS
guix time-machine -C /mnt/Guix/etc/channels.scm -- system init /mnt/Guix/etc/config.scm /mnt/Guix/

```

