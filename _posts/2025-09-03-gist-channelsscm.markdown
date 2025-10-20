---
layout: post
title: "channels.scm"
date: 2025-09-03 11:08:12 +0300
categories: gist
tags: [gist, code]
gist_id: a94364c9e2c9e742d0c94dc58a706361
gist_url: https://gist.github.com/dominicusin/a94364c9e2c9e742d0c94dc58a706361
---

channels.scm

[View on GitHub Gist](https://gist.github.com/dominicusin/a94364c9e2c9e742d0c94dc58a706361)

```scm
;; ~/.config/guix/channels.scm

(list (channel
        (name 'nonguix)
        (url "https://gitlab.com/nonguix/nonguix")
        (branch "master")
        (commit
          "477f283914ca771a8622e16b73d845b87c63335d")
        (introduction
          (make-channel-introduction
            "897c1a470da759236cc11798f4e0a5f7d4d59fbc"
            (openpgp-fingerprint
              "2A39 3FFF 68F4 EF7A 3D29  12AF 6F51 20A0 22FB B2D5"))))
      (channel
        (name 'guix)
        (url "https://git.guix.gnu.org/guix.git")
        (branch "master")
        (commit
          "b377ec079d9ffe8f0f372c43735ad012ea889b6f")
        (introduction
          (make-channel-introduction
            "9edb3f66fd807b096b48283debdcddccfea34bad"
            (openpgp-fingerprint
              "BBB0 2DDF 2CEA F6A8 0D1D  E643 A2A0 6DF2 A33A 54FA"))))
      (channel
        (name 'pantherx)
        (url "https://channels.pantherx.org/git/panther.git")
        (branch "master")
        (commit
          "236f6a56cb78556eeeb64b4895ce59cdba644b0b")
        (introduction
          (make-channel-introduction
            "54b4056ac571611892c743b65f4c47dc298c49da"
            (openpgp-fingerprint
              "A36A D41E ECC7 A871 1003  5D24 524F EB1A 9D33 C9CB"))))
      (channel
        (name 'guix-gaming-games)
        (url "https://gitlab.com/guix-gaming-channels/games.git")
        (branch "master")
        (commit
          "b943b1e3cacffa8c9b7ea63d49f3f7d8fc3bee85")
        (introduction
          (make-channel-introduction
            "c23d64f1b8cc086659f8781b27ab6c7314c5cca5"
            (openpgp-fingerprint
              "50F3 3E2E 5B0C 3D90 0424  ABE8 9BDC F497 A4BB CC7F"))))
      (channel
        (name 'flat)
        (url "https://github.com/flatwhatson/guix-channel.git")
        (branch "master")
        (commit
          "b62ba3214ed0f781e2d6015044ae8a4a1bd5c7d7")
        (introduction
          (make-channel-introduction
            "33f86a4b48205c0dc19d7c036c85393f0766f806"
            (openpgp-fingerprint
              "736A C00E 1254 378B A982  7AF6 9DBE 8265 81B6 4490"))))
      (channel
        (name 'guix-science)
        (url "https://codeberg.org/guix-science/guix-science.git")
        (branch "master")
        (commit
          "6f6b833e7b258251abc33186d2775c333e91d11f")
        (introduction
          (make-channel-introduction
            "b1fe5aaff3ab48e798a4cce02f0212bc91f423dc"
            (openpgp-fingerprint
              "CA4F 8CF4 37D7 478F DA05  5FD4 4213 7701 1A37 8446"))))
      (channel
        (name 'guix-hpc)
        (url "https://gitlab.inria.fr/guix-hpc/guix-hpc.git")
        (branch "master")
        (commit
          "383fd2297febd03401d2b70c29db6eaff8c6384d"))
      (channel
        (name 'guix-past)
        (url "https://codeberg.org/guix-science/guix-past")
        (branch "master")
        (commit
          "b14d7f997ae8eec788a7c16a7252460cba3aaef8")
        (introduction
          (make-channel-introduction
            "0c119db2ea86a389769f4d2b9c6f5c41c027e336"
            (openpgp-fingerprint
              "3CE4 6455 8A84 FDC6 9DB4  0CFB 090B 1199 3D9A EBB5"))))
      (channel
        (name 'rde)
        (url "https://git.sr.ht/~abcdw/rde")
        (branch "master")
        (commit
          "46a2e694a4afc3d1dbce8b751389b566df16d46a")
        (introduction
          (make-channel-introduction
            "257cebd587b66e4d865b3537a9a88cccd7107c95"
            (openpgp-fingerprint
              "2841 9AC6 5038 7440 C7E9  2FFA 2208 D209 58C1 DEB0"))))
      (channel
        (name 'rosenthal)
        (url "https://codeberg.org/hako/rosenthal.git")
        (branch "trunk")
        (commit
          "9e51ad4215461702056e57557b89d56d9123713f")
        (introduction
          (make-channel-introduction
            "7677db76330121a901604dfbad19077893865f35"
            (openpgp-fingerprint
              "13E7 6CD6 E649 C28C 3385  4DF5 5E5A A665 6149 17F7"))))
      (channel
        (name 'babelfish)
        (url "https://codeberg.org/ifitzpat/babelfish.git")
        (branch "master")
        (commit
          "2a92e7289d260e21b64b3857dbab980adfc78b42"))
      (channel
        (name 'guix-cran)
        (url "https://github.com/guix-science/guix-cran.git")
        (branch "master")
        (commit
          "6ef1a68cb0b4e9949ec667c0fb4cd1c730e2015e"))
      (channel
        (name 'guix-bioc)
        (url "https://github.com/guix-science/guix-bioc.git")
        (branch "master")
        (commit
          "7500d208fc1f08abd0a382eba2984e622d814f13"))
      (channel
        (name 'ajattix)
        (url "https://git.ajattix.org/hashirama/ajattix.git")
        (branch "main")
        (commit
          "b62401404713cbdfcccb6172e8efab59934c62e5")
        (introduction
          (make-channel-introduction
            "5f1904f1a514b89b2d614300d8048577aa717617"
            (openpgp-fingerprint
              "F164 709E 5FC7 B32B AEC7  9F37 1F2E 76AC E3F5 31C8"))))
      (channel
        (name 'crafted-guix)
        (url "https://codeberg.org/ifitzpat/crafted-guix.git")
        (branch
          "docker-container-service-type-documentation")
        (commit
          "1eba6117713e06a27b40fc77606b9496fd7fe19b")))


```

