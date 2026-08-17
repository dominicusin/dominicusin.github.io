---
title: "452ef1dfef6ee6d31bcbd6e0c3cf54e3"
type: gist
gist_id: "452ef1dfef6ee6d31bcbd6e0c3cf54e3"
gist_url: https://gist.github.com/dominicusin/452ef1dfef6ee6d31bcbd6e0c3cf54e3
updated_at: "2026-07-03T18:41:14Z"
files: ["gistfile1.txt"]
---
## gistfile1.txt

```Text
debootstrap --verbose --arch=amd64 --include="build-essential,tasksel,aptitude,mc,htop,most,mosh,screen,tmux" --exclude="snapd" --extra-suites="stonking,stonking-backports,stonking-proposed,stonking-security,stonking-updates" --components="main,multiverse,restricted,universe" --variant=minbase --merged-usr --force-check-sig --force-check-gpg --log-extra-deps   stonking /mnt/Ubuntu4 https://mirrors.nxthost.com/ubuntu/
```


