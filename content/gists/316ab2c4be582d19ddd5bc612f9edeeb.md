---
title: "How to setup a community version of Proxmox VE 5.x-6.x"
type: gist
gist_id: "316ab2c4be582d19ddd5bc612f9edeeb"
gist_name: "How to setup a community version of Proxmox VE 5.x-6.x gistfile1.txt"
gist_url: https://gist.github.com/dominicusin/316ab2c4be582d19ddd5bc612f9edeeb
updated_at: "2021-10-26T13:30:59Z"
files: ["gistfile1.txt"]
---
_How to setup a community version of Proxmox VE 5.x-6.x_

## gistfile1.txt

```Text
# Disable Commercial Repo
sed -i "s/^deb/\#deb/" /etc/apt/sources.list.d/pve-enterprise.list
apt-get update

# Add PVE Community Repo
echo "deb http://download.proxmox.com/debian/pve $(grep "VERSION=" /etc/os-release | sed -n 's/.*(\(.*\)).*/\1/p') pve-no-subscription" > /etc/apt/sources.list.d/pve-no-enterprise.list
apt-get update

# Remove nag
echo "DPkg::Post-Invoke { \"dpkg -V proxmox-widget-toolkit | grep -q '/proxmoxlib\.js$'; if [ \$? -eq 1 ]; then { echo 'Removing subscription nag from UI...'; sed -i '/data.status/{s/\!//;s/Active/NoMoreNagging/}' /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js; }; fi\"; };" > /etc/apt/apt.conf.d/no-nag-script
apt --reinstall install proxmox-widget-toolkit
```


