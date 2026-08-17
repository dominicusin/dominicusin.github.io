---
title: "/etc/apt/sources.list.d/Debian.sources"
type: gist
gist_id: "2fbfdcb6ff72ab2debe1a4dbebe0b509"
gist_name: "/etc/apt/sources.list.d/Debian.sources Debian.sources"
gist_url: https://gist.github.com/dominicusin/2fbfdcb6ff72ab2debe1a4dbebe0b509
updated_at: "2024-03-04T03:58:27Z"
files: ["Debian.sources"]
---
_/etc/apt/sources.list.d/Debian.sources_

## Debian.sources

```
Enabled: yes
Types: deb deb-src
URIs: https://deb.debian.org/debian https://httpredir.debian.org/debian https://cdn-fastly.deb.debian.org/debian
Suites:  trixie-backports trixie-proposed-updates trixie-updates trixie experimental  proposed-updates rc-buggy testing-backports testing-proposed-updates testing-updates testing
# Suites: experimental  proposed-updates rc-buggy sid testing-backports testing-proposed-updates testing-updates testing trixie-backports trixie-proposed-updates trixie-updates trixie
# Suites: bookworm-backports-sloppy bookworm-backports bookworm-proposed-updates bookworm-updates bookworm  experimental  proposed-updates rc-buggy sid stable-backports-sloppy stable-backports stable-updates stable testing-backports testing-proposed-updates testing-updates testing trixie-backports trixie-proposed-updates trixie-updates trixie unstable
# Debian10.13 Debian11.7 Debian12.1 bookworm-backports-sloppy bookworm-backports bookworm-proposed-updates bookworm-updates bookworm bullseye-backports-sloppy bullseye-backports bullseye-proposed-updates bullseye-updates bullseye buster-backports-sloppy buster-backports buster-proposed-updates buster-updates buster experimental oldoldstable-backports-sloppy oldoldstable-backports oldoldstable-proposed-updates oldoldstable-updates oldoldstable oldstable-backports-sloppy oldstable-backports oldstable-proposed-updates oldstable-updates oldstable proposed-updates rc-buggy sid stable-backports-sloppy stable-backports stable-proposed-updates stable-updates stable testing-backports testing-proposed-updates testing-updates testing trixie-backports trixie-proposed-updates trixie-updates trixie unstable
#sid experimental unstable testing testing-updates testing-proposed-updates testing-backports trixie trixie-updates trixie-proposed-updates trixie-backports
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg /usr/share/keyrings/debian-keyring.gpg
X-Repolib-Name: "Debian Sources"
#Architectures: all amd64 arm64 armel armhf i386 mips64el ppc64el s390x
By-Hash: force
Check-Valid-Until: yes
#Languages: ca cs da de el en eo es eu fi fr gl hr hu id it ja km ko ml nb nl pl pt pt_AO pt_BR ro ru sk sr sv tr uk vi zh zh_CN zh_TW
Languages: en ru
PDiffs: yes
Allow-Downgrade-To-Insecure: no
Allow-Insecure: no
Allow-Weak: no
Trusted: no



Enabled: yes
Types: deb deb-src
URIs: http://mirror.as43289.net/debian/ http://ftp.md.debian.org/debian/
Suites: experimental  proposed-updates rc-buggy testing-backports testing-proposed-updates testing-updates testing trixie-backports trixie-proposed-updates trixie-updates trixie
# Suites: experimental  proposed-updates rc-buggy sid testing-backports testing-proposed-updates testing-updates testing trixie-backports trixie-proposed-updates trixie-updates trixie unstable
# Suites: bookworm-backports-sloppy bookworm-backports bookworm-proposed-updates bookworm-updates bookworm  experimental  proposed-updates rc-buggy sid stable-backports-sloppy stable-backports stable-updates stable testing-backports testing-proposed-updates testing-updates testing trixie-backports trixie-proposed-updates trixie-updates trixie unstable
# sid experimental unstable testing testing-updates testing-proposed-updates testing-backports trixie trixie-updates trixie-proposed-updates trixie-backports
Components: main contrib non-free non-free-firmware
Signed-By:  /usr/share/keyrings/debian-keyring.gpg /usr/share/keyrings/debian-archive-keyring.gpg
X-Repolib-Name: "Debian Sources"
Architectures: amd64 i386
#Architectures: all amd64 arm64 armel armhf i386 mips64el ppc64el s390x
By-Hash: force
Check-Valid-Until: yes
Languages: en ru
#Languages: ca cs da de el en eo es eu fi fr gl hr hu id it ja km ko ml nb nl pl pt pt_AO pt_BR ro ru sk sr sv tr uk vi zh zh_CN zh_TW
PDiffs: yes
Allow-Downgrade-To-Insecure: no
Allow-Insecure: no
Allow-Weak: no
Trusted: no


#   	Debian 14.0 (forky)  forky Enabled: yes
Types: deb deb-src
URIs: https://www.deb-multimedia.org
Suites: unstable testing trixie stable
Components: main non-free
X-Repolib-Name: "Multimedia Debian Sources"
Signed-By: /etc/apt/trusted.gpg.d/deb-multimedia-keyring.gpg
Architectures: amd64 i386
Languages: en ru
#Languages: ca cs da de el en eo es eu fi fr gl hr hu id it ja km ko ml nb nl pl pt pt_AO pt_BR ro ru sk sr sv tr uk vi zh zh_CN zh_TW
#Architectures: all amd64 arm64 armel armhf i386
Enabled: yes
Types: deb
URIs: http://debian.linutronix.de/elbe
Suites:  bookworm
Components: main
Signed-By: /usr/share/keyrings/elbe-archive-keyring.gpg
X-Repolib-Name: "ELBE Sources"
Architectures: amd64
By-Hash: force
Check-Valid-Until: yes
Languages: en ru
PDiffs: yes
Allow-Downgrade-To-Insecure: no
Allow-Insecure: no
Allow-Weak: no
Trusted: no
#deb [signed-by=/usr/share/keyrings/elbe-archive-keyring.gpg] http://debian.linutronix.de/elbe bookworm main

Enabled: yes
Types: deb deb-src
URIs: http://fasttrack.debian.net/debian  https://fasttrack.debian.net/debian-fasttrack https://debian-fasttrack.sur5r.net/debian
Suites: bookworm-backports-staging bookworm-fasttrack
Components: main contrib non-free
X-Repolib-Name: "FastTrack"
Signed-By: /etc/apt/trusted.gpg.d/fasttrack-archive-keyring.gpg
By-Hash: force
Check-Valid-Until: yes
Architectures: amd64 i386
Languages: en ru
#Languages: ca cs da de el en eo es eu fi fr gl hr hu id it ja km ko ml nb nl pl pt pt_AO pt_BR ro ru sk sr sv tr uk vi zh zh_CN zh_TW
#Architectures: all amd64 arm64 armel armhf i386

Enabled: yes
Types: deb
URIs: https://dl.google.com/linux/chrome/deb/
Suites:  stable
Components: main
Signed-By: /etc/apt/trusted.gpg.d/google-chrome-beta.gpg
X-Repolib-Name: "GoogleChrome Sources"
Architectures: amd64
By-Hash: force
Check-Valid-Until: yes
Languages: en ru
PDiffs: yes
Allow-Downgrade-To-Insecure: no
Allow-Insecure: no
Allow-Weak: no
Trusted: no

### THIS FILE IS AUTOMATICALLY CONFIGURED ###
# You may comment out this entry, but any other modifications may be lost.
#deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main


Enabled: no
Types: deb deb-src
URIs: https://incoming.debian.org/debian-buildd
Suites: buildd-bookworm-backports-sloppy buildd-bookworm-backports buildd-bookworm-proposed-updates buildd-bullseye-backports-sloppy buildd-bullseye-backports buildd-bullseye-proposed-updates buildd-buster-backports-sloppy buildd-buster-backports buildd-buster-proposed-updates buildd-experimental buildd-oldoldstable-backports-sloppy buildd-oldoldstable-proposed-updates buildd-oldstable-backports-sloppy buildd-oldstable-proposed-updates buildd-proposed-updates buildd-rc-buggy buildd-sid buildd-stable-backports-sloppy buildd-stable-backports buildd-testing-backports buildd-testing-proposed-updates buildd-trixie-backports buildd-trixie-proposed-updates buildd-unstable
# buildd-sid buildd-unstable buildd-experimental buildd-proposed-updates buildd-testing-backports buildd-testing-proposed-updates buildd-trixie-backports buildd-trixie-proposed-updates
Components: main contrib non-free non-free-firmware
X-Repolib-Name: "Debian Incoming"
Architectures: amd64 i386
Languages: en ru
#Languages: ca cs da de el en eo es eu fi fr gl hr hu id it ja km ko ml nb nl pl pt pt_AO pt_BR ro ru sk sr sv tr uk vi zh zh_CN zh_TW
#Architectures: all amd64 arm64 armel armhf i386 mips64el ppc64el s390x

Enabled: yes
Types: deb deb-src
URIs: http://neurodebian.g-node.org
Suites:  data trixie
Components: main contrib non-free
Signed-By: /etc/apt/trusted.gpg.d/neurodebian-archive-keyring.gpg
X-Repolib-Name: "NeuroDebian Sources"
Architectures: amd64
By-Hash: force
Check-Valid-Until: yes
Languages: en ru
PDiffs: yes
Allow-Downgrade-To-Insecure: no
Allow-Insecure: no
Allow-Weak: no
Trusted: no

#deb http://neurodebian.g-node.org data main contrib non-free
#deb-src http://neurodebian.g-node.org data main contrib non-free
#deb http://neurodebian.g-node.org trixie main contrib non-free
#deb-src http://neurodebian.g-node.org trixie main contrib non-free

Enabled: no
Types: deb deb-src
URIs: http://ftp.ports.debian.org/debian-ports/
# http://snapshot.debian.org/archive/
Suites:  unreleased
#sid unstable experimental
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-ports-archive-keyring.gpg /etc/apt/trusted.gpg.d/debian-ports-archive-2023.gpg /etc/apt/trusted.gpg.d/debian-ports-archive-2024.gpg
X-Repolib-Name: "Ports Debian Sources"
Architectures: alpha arc hppa hurd-amd64 hurd-i386 ia64 loong64 m68k powerpc ppc64 sh4 sparc64 x32
# kfreebsd-amd64 kfreebsd-i386 riscv64
#Architectures: all amd64 arm64 armel armhf i386 mips64el ppc64el s390x
By-Hash: force
Check-Valid-Until: yes
Languages: en ru
#Languages: ca cs da de el en eo es eu fi fr gl hr hu id it ja km ko ml nb nl pl pt pt_AO pt_BR ro ru sk sr sv tr uk vi zh zh_CN zh_TW
PDiffs: yes
Allow-Downgrade-To-Insecure: no
Allow-Insecure: no
Allow-Weak: no
Trusted: no

# /etc/apt/sources.list.d/progress-linux.sources
Types: deb
URIs: https://deb.progress-linux.org/packages
Suites: horok horok-security horok-updates horok-backports
Components: main contrib non-free non-free-firmware
PDiffs: no
Signed-By: /usr/share/progress-linux/pgp-keys/apt.progress-linux.org.gpg
Types: deb
URIs: https://deb.progress-linux.org/packages
Suites: horok-extras horok-backports-extras
Components: main contrib non-free non-free-firmware restricted
PDiffs: no
Signed-By: /usr/share/progress-linux/pgp-keys/apt.progress-linux.org.gpg

Enabled: yes
Types: deb
URIs: https://repo.skype.com/deb
Suites:  stable
Components: main
Signed-By: /etc/apt/trusted.gpg.d/skype.gpg
X-Repolib-Name: "Skype Sources"
Architectures: amd64
By-Hash: force
Check-Valid-Until: yes
Languages: en ru
PDiffs: yes
Allow-Downgrade-To-Insecure: no
Allow-Insecure: no
Allow-Weak: no
Trusted: no
deb [arch=amd64] https://repo.skype.com/deb stable main

```


