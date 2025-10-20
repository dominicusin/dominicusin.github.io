---
layout: post
title: "gistfile1 txt"
date: 2025-03-11 09:38:07 +0300
categories: gist
tags: [gist, code]
gist_id: 09e979be90a5a188026c91453113f5fa
gist_url: https://gist.github.com/dominicusin/09e979be90a5a188026c91453113f5fa
---

[View on GitHub Gist](https://gist.github.com/dominicusin/09e979be90a5a188026c91453113f5fa)

```txt
export LANG=C.UTF-8
export DEBIAN_FRONTEND=noninteractive
export APT_LISTCHANGES_FRONTEND=none
apt -y modernize-sources;apt-mark -y minimize-manual ;apt --allow-change-held-packages --allow-downgrades   --allow-remove-essential --allow-unauthenticated --fix-broken --fix-missing --ignore-hold --install-recommends --install-suggests  --update --show-progress --color --audit --autoremove --purge --reinstall --fix-broken --fix-missing --ignore-hold  -t unstable  --option DPkg::Options::="--force-confnew"  --option DPkg::Options::="--force-all" -fym   full-upgrade;aptitude --no-gui --with-recommends -t unstable -vfy full-upgrade;dpkg --configure -a --force-all


```

