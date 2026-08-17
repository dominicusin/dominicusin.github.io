---
title: "strip package version gentoo"
type: gist
gist_id: "db842f92c4bdf62cd9cebddaff0da00b"
gist_url: https://gist.github.com/dominicusin/db842f92c4bdf62cd9cebddaff0da00b
updated_at: "2022-03-28T23:32:11Z"
files: ["strip version"]
---
_strip package version gentoo_

## strip version

```Python
#!/bin/env python

import sys
from portage.dep import Atom

for arg in sys.argv[1:]:
        atom = Atom(arg)
        print(atom.cp)


```


