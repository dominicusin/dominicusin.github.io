---
title: "OpenZFS on OS X on boot installer script"
type: gist
gist_id: "bb91fc051d96cb5d7582eaedead01c3b"
gist_name: "OpenZFS on OS X on boot installer script zfsonosxonboot.sh"
gist_url: https://gist.github.com/dominicusin/bb91fc051d96cb5d7582eaedead01c3b
updated_at: "2022-06-08T00:06:08Z"
files: ["zfsonosxonboot.sh"]
---
_OpenZFS on OS X on boot installer script_

## zfsonosxonboot.sh

```Shell
#!/usr/bin/env bash
# OpenZFS on OS X on boot installer script
# Based on instructions from https://openzfsonosx.org/w/index.php?title=ZFS_on_Boot&oldid=1509

NEWDISK=/dev/null
NEWPOOL=rpool
autoconfirm="n"
for i in "$@"
do
case $i in
    -d=*|--disk=*)
    	NEWDISK="${i#*=}"
    	shift # past argument=value
    	;;
    -p=*|--pool=*)
    	NEWPOOL="${i#*=}"
    	shift # past argument=value
    	;;
    -y|--yes)
    	autoconfirm="y"
    	shift # past argument
    	;;
    *)
        # unknown option
        echo $0: Error: unknown option: $i
        exit 1
    ;;
esac
done


## check osx version and select marketing name
echo -n "checking for mac OS version ... "
osx_names=(
["10"]="Yosemite"
["11"]="ElCapitan"
["12"]="Sierra"
["13"]="HighSierra"
["14"]="Mojave"
["15"]="Catalina"
)
osx_version=$(sw_vers -productVersion)
osx_minorversion=$(echo "${osx_version}"| awk -F '[.]' '{print $2}')
OSX_NAME="${osx_names[$osx_minorversion]}"
[ -n "${OSX_NAME}" ] && {
    echo "ok: mac OS version is ${OSX_NAME} (${osx_version})"
} || {
    echo "fail: unable to determine name of mac OS version ${osx_version}"
    exit 1
}

## check for SIP status
echo -n "checking for SIP status ... "
sip_status=$(csrutil status | grep -o -E "disabled|enabled")
[ "${sip_status}" == "disabled" ] && {
    echo "ok: SIP status is ${sip_status}"
} || {
    echo "fail: SIP status is ${sip_status}"
    cat <<- EOF 
        Blessing the boot device will probably fail because System Integrity Protection is ${sip_status}
        To disable it 
            - Reboot while holding [CMD]+[R]
            - Open Utilities > Terminal
            - Enter the following command(s) 
                csrutil disable
                reboot
EOF
    while true; do
        read -p "Do you wish continue? [Y/N]:" yn
        case $yn in
            [Yy]* ) break;;
            [Nn]* ) exit;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}


## check for diskutil installation
echo -n "checking for diskutil ... "
diskutil="$(which diskutil)"
[ -x "${diskutil}" ] && echo "ok: diskutil is at ${diskutil} " || {
    echo "fail: unable to determine path of diskutil" 
    exit 1
}

## check for rsync installation
echo -n "checking for rsync ... "
rsync="$(which rsync)"
[ -x "${rsync}" ] && echo "ok: rsync is at ${rsync} " || {
    echo "fail: unable to determine path of rsync" 
    exit 1
}

## check that user can sudo
echo "checking user can sudo ... "
sudo -v && echo "ok" || {
    echo "fail"
    echo "You need to be able to sudo, please check your password and permission"
    exit 1
}

## check for homebrew installation
echo -n "checking for homebrew ... "
brew="$(which brew)"
[ -x "${brew}" ] && echo "ok: homebrew is at ${brew} " || {
    echo "fail"
    echo "installing homebrew"
    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    ### check again
    echo -n "checking for homebrew ... "
    brew="$(which brew)"
    [ -x "${brew}" ] && echo "ok: homebrew is at ${brew} " || {
        echo "fail: unable to install homebrew" 
    }
}

## check for zfs installation
echo -n "checking for openzfs ... "
zfs="$(which zfs)"
zpool="$(which zpool)"
mount_zfs="$(which mount_zfs)"
[ -x "${zfs}" -a -x "${zpool}" ] && echo "ok: zfs is at ${zfs} zpool is at ${zpool} mount_zfs is at ${mount_zfs}" || {
    echo "fail"
    echo "installing openzfs"
    ${brew} cask install openzfs
    ### check again
    echo -n "checking for openzfs ... "
    zfs="$(which zfs)"
    zpool="$(which zpool)"
    mount_zfs="$(which mount_zfs)"
    [ -x "${zfs}" -a -x "${zpool}" ] && echo "ok: zfs is at ${zfs} zpool is at ${zpool} mount_zfs is at ${mount_zfs}" || {
        echo "fail: unable to install openzfs" 
        exit 1
    }
}

## Prompt the user to select one of the devices
if [ "${NEWDISK}" == "/dev/null" ]; then
    IFS=$'\n' read -d '' -ra devices < <(diskutil list | grep -E "/dev|0:" | xargs -L2  echo)
    echo "Please select a device:"
    select device in "${devices[@]}"; do
    [[ -n $device ]] || { echo "Invalid choice. Please try again." >&2; continue; }
    break # valid choice was made; exit prompt
    done
    read -r NEWDISK description <<<"${device}"
fi 

## generate script
SCRIPT="$(cat <<- EOF
sudo ${diskutil} partitionDisk ${NEWDISK} GPT ZFS ${NEWPOOL} 0b || true
sudo ${zpool} create -R /mnt -f -o ashift=12 -O casesensitivity=insensitive -O normalization=formD -O atime=off -O compression=lz4 -O mountpoint=none -O canmount=off -o feature@spacemap_v2=disabled ${NEWPOOL} ${NEWDISK}s2
sudo ${zfs} create -o mountpoint=none -o canmount=off ${NEWPOOL}/ROOT
sudo ${zfs} create -o mountpoint=legacy -o com.apple.mimic_hfs=on ${NEWPOOL}/ROOT/${OSX_NAME}
sudo ${zpool} set bootfs=${NEWPOOL}/ROOT/${OSX_NAME} ${NEWPOOL}
sudo ${zfs} create -o mountpoint=/Users -o canmount=off ${NEWPOOL}/HOME
sudo ${zfs} create ${NEWPOOL}/HOME/${USER} || true
sudo mkdir /Volumes/ZFSBoot
sudo ${mount_zfs} ${NEWPOOL}/ROOT/${OSX_NAME} /Volumes/ZFSBoot
sudo ${rsync} -axH --progress --exclude=".Spotlight-V100" --exclude=".fseventsd" --exclude=".vol" --exclude "var/folders/*" "/" "/Volumes/ZFSBoot/"
sudo cp -av /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist~
echo "<dict>" | sudo tee /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist
echo "        <key>Kernel Flags</key>" | sudo tee -a /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist
echo "        <string>-v keepsyms=y zfs_boot=rpool</string>" | sudo tee -a /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist
echo "        <key>Root UUID</key>" | sudo tee -a /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist
echo "        <string>5A465320-626F-6F74-2064-657669636500</string>" | sudo tee -a /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist
echo "</dict>" | sudo tee -a /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist
sudo kextcache -c "/Volumes/ZFSBoot/System/Library/PrelinkedKernels/prelinkedkernel" -K "/Volumes/ZFSBoot/System/Library/Kernels/kernel" -l -- "/Volumes/ZFSBoot/System/Library/Extensions"  "/Volumes/ZFSBoot/Library/Extensions/"
EOF
)"

## check if running inside virtualbox
ioreg -l | grep -q "VirtualBox" && SCRIPT="$(cat <<- EOF
$SCRIPT
sudo newfs_hfs -J -v "boot" ${NEWDISK}s3
sudo ${diskutil} mount ${NEWDISK}s3
sudo mkdir -p /Volumes/boot/Library/Preferences/SystemConfiguration
sudo mkdir -p /Volumes/boot/System/Library/CoreServices/com.apple.recovery.boot
sudo rsync -a /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/autodiskmount.plist /Volumes/boot/Library/Preferences/SystemConfiguration/autodiskmount.plist
sudo rsync -a /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist /Volumes/boot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist
sudo rsync -a /Volumes/ZFSBoot/System/Library/CoreServices/PlatformSupport.plist /Volumes/boot/System/Library/CoreServices/PlatformSupport.plist
sudo rsync -a /Volumes/ZFSBoot/System/Library/CoreServices/SystemVersion.plist /Volumes/boot/System/Library/CoreServices/SystemVersion.plist
sudo rsync -a /Volumes/ZFSBoot/System/Library/CoreServices/boot.efi /Volumes/boot/System/Library/CoreServices/boot.efi
sudo rsync -a /Volumes/ZFSBoot/System/Library/CoreServices/bootbase.efi /Volumes/boot/System/Library/CoreServices/bootbase.efi
sudo rsync -a /Volumes/ZFSBoot/System/Library/CoreServices/com.apple.recovery.boot/PlatformSupport.plist /Volumes/boot/System/Library/CoreServices/com.apple.recovery.boot/PlatformSupport.plist
sudo rsync -a /Volumes/ZFSBoot/System/Library/PrelinkedKernels/prelinkedkernel /Volumes/boot/System/Library/PrelinkedKernels/prelinkedkernel
EOF
)" || SCRIPT="$(cat <<- EOF
$SCRIPT
sudo newfs_hfs -J -v "boot" ${NEWDISK}s3
sudo ${diskutil} mount ${NEWDISK}s3
sudo mkdir -p /Volumes/boot/System/Library/CoreServices
sudo mkdir -p /Volumes/boot/com.apple.boot.R/System/Library/PrelinkedKernels
sudo mkdir -p /Volumes/boot/com.apple.boot.R/Library/Preferences/SystemConfiguration
sudo mkdir -p /Volumes/boot/com.apple.boot.R/usr/standalone/i386
sudo ${rsync} -a /Volumes/ZFSBoot/System/Library/CoreServices/PlatformSupport.plist /Volumes/boot/System/Library/CoreServices/PlatformSupport.plist
sudo ${rsync} -a /Volumes/ZFSBoot/System/Library/CoreServices/SystemVersion.plist /Volumes/boot/System/Library/CoreServices/SystemVersion.plist
sudo ${rsync} -a /Volumes/ZFSBoot/System/Library/PrelinkedKernels/prelinkedkernel /Volumes/boot/com.apple.boot.R/System/Library/PrelinkedKernels/prelinkedkernel
sudo ${rsync} -a /Volumes/ZFSBoot/Library/Preferences/SystemConfiguration/com.apple.Boot.plist /Volumes/boot/com.apple.boot.R/Library/Preferences/SystemConfiguration/com.apple.Boot.plist
sudo ${rsync} -a /Volumes/ZFSBoot/usr/standalone/i386/ /Volumes/boot/com.apple.boot.R/usr/standalone/i386/
EOF
)"

SCRIPT="$(cat <<- EOF
$SCRIPT
sudo bless --folder /Volumes/boot/System/Library/CoreServices --file /Volumes/boot/System/Library/CoreServices/boot.efi --bootefi /Volumes/ZFSBoot/System/Library/CoreServices/boot.efi --label "ZFS Boot"
sudo bless --device ${NEWDISK}s3 --setBoot || true
EOF
)"

echo "*******************************************************"
echo "${SCRIPT}"
echo "*******************************************************"
echo "Please review the above generated script"
while true; do
    read -p "Do you wish continue? [Y/N]:" yn
    case $yn in
        [Yy]* ) break;;
        [Nn]* ) exit;;
        * ) echo "Please answer yes or no.";;
    esac
done

echo "device: ${NEWDISK}"
diskutil list ${NEWDISK}

## Doublecheck that user want to have device destroyed
echo "${NEWDISK} will be partitioned for ZFS"
echo "*******************************************************"
echo "**** WARNING: THIS WILL DESTROY ALL DATA ON DEVICE ****"
echo "*******************************************************"
while true; do
    read -p "Do you wish continue? [Y/N]:" yn
    case $yn in
        [Yy]* ) break;;
        [Nn]* ) exit;;
        * ) echo "Please answer yes or no.";;
    esac
done

## Execute the script line by line
IFS=$'\n';
for line in `echo "${SCRIPT}"`
do 
    echo "${line}"
    if [ "${autoconfirm}" == "n" ];
    then
        while true; do
            read -p "Execute? [Y/N]:" yn
            case $yn in
                [Yy]* ) break;;
                [Nn]* ) continue 2;;
                * ) echo "Please answer yes or no.";;
            esac
        done
    fi
    eval "${line}" || {
        exit_status=$?
        while true; do
            echo "${line}"
            echo "Exit status: ${exit_status}"
            read -p "Do you wish continue? [Y/N]:" yn
            case $yn in
             [Yy]* ) break;;
             [Nn]* ) exit ${exit_status};;
             * ) echo "Please answer yes or no.";;
            esac
        done
    }
done


## check for SIP status
echo -n "checking for SIP status ... "
sip_status=$(csrutil status | grep -o -E "disabled|enabled")
[ "${sip_status}" == "enabled" ] && echo "ok: SIP status is ${sip_status}" || {
    echo "fail: SIP status is ${sip_status}"
    cat << EOF 
        System Integrity Protection is ${sip_status}
        To enable it 
            - Reboot while holding [CMD]+[R]
            - Open Utilities > Terminal
            - Enter the following command(s) 
                csrutil enable
                reboot
EOF
}
```


