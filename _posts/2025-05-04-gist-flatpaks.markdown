---
layout: post
title: "flatpaks"
date: 2025-05-04 07:56:00 +0300
categories: gist
tags: [gist, code]
gist_id: 93445e617b848ab12e5b0a7026f25752
gist_url: https://gist.github.com/dominicusin/93445e617b848ab12e5b0a7026f25752
---

flatpaks

[View on GitHub Gist](https://gist.github.com/dominicusin/93445e617b848ab12e5b0a7026f25752)

```txt
 flatpak remote-add --from eos-sdk #http://endlessm.github.io/eos-knowledge-lib/eos-sdk.flatpakrepo
 flatpak remote-add --from eos-sdk http://endlessm.github.io/eos-knowledge-lib/eos-sdk.flatpakrepo
 flatpak remote-add --from eos-sdk-nightly http://endlessm.github.io/eos-knowledge-lib/eos-sdk-nightly.flatpakrepo
 flatpak remote-add --gpg-import=eos-flatpak-keyring.gpg eos-apps https://ostree.endlessm.com/ostree/eos-apps
 flatpak remote-add --gpg-import=eos-flatpak-keyring.gpg eos-sdk https://ostree.endlessm.com/ostree/eos-sdk
 flatpak remote-add --if-not-exists dragon-nightly https://cdn.kde.org/flatpak/dragon-nightly/dragon-nightly.flatpakrepo
 flatpak remote-add --if-not-exists eclipse-nightly https://download.eclipse.org/linuxtools/flatpak-I-builds/eclipse.flatpakrepo
 flatpak remote-add --if-not-exists elementaryos https://flatpak.elementary.io/repo.flatpakrepo
 flatpak remote-add --if-not-exists fedora oci+https://registry.fedoraproject.org
 flatpak remote-add --if-not-exists fedora-testing oci+https://registry.fedoraproject.org#testing
 flatpak remote-add --if-not-exists flathub-beta https://flathub.org/beta-repo/flathub-beta.flatpakrepo
 flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
 flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
 flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
 flatpak remote-add --if-not-exists gnome-nightly https://nightly.gnome.org/gnome-nightly.flatpakrepo
 flatpak remote-add --if-not-exists gnome-nightly https://nightly.gnome.org/gnome-nightly.flatpakrepo.
 flatpak remote-add --if-not-exists igalia https://software.igalia.com/flatpak-refs/igalia.flatpakrepo
 flatpak remote-add --if-not-exists kdeapps https://distribute.kde.org/kdeapps.flatpakrepo
 flatpak remote-add --if-not-exists kde-runtime-nightly https://cdn.kde.org/flatpak/kde-runtime-nightly/kde-runtime-nightly.flatpakrepo
 flatpak remote-add --if-not-exists PureOS https://store.puri.sm/repo/stable/pureos.flatpakrepo
 flatpak remote-add --if-not-exists --subset=floss flathub-floss https://dl.flathub.org/repo/flathub.flatpakrepo..
 flatpak remote-add --if-not-exists --subset=verified flathub-verified https://dl.flathub.org/repo/flathub.flatpakrepo
 flatpak remote-add --if-not-exists --subset=verified_floss flathub-verified_floss https://dl.flathub.org/repo/flathub.flatpakrepo
 flatpak remote-add --if-not-exists tenacity oci+https://tenacityteam.github.io/tenacity-flatpak-nightly
 flatpak remote-add --if-not-exists --user appcenter https://flatpak.elementary.io/repo.flatpakrepo
 flatpak remote-add --if-not-exists webkit-sdk https://software.igalia.com/flatpak-refs/webkit-sdk.flatpakrepo
 flatpak remote-add rhel https://flatpaks.redhat.io/rhel.flatpakrepo
 flatpak remote-add --system elementary https://flatpak.elementary.io/elementary.flatpakrepo
 flatpak remote-add --user appcenter https://flatpak.elementary.io/appcenter.flatpakrepo
 flatpak remote-add --user --if-not-exists webkit https://software.igalia.com/flatpak-refs/webkit-sdk.flatpakrepo
 flatpak remote-add xwaylandvideobridge-nightly https://cdn.kde.org/flatpak/xwaylandvideobridge-nightly/xwaylandvideobridge-nightly.flatpakrepo
 flatpak --system remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

```

