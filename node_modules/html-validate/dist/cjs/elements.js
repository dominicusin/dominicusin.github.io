'use strict';

var metaHelper = require('./meta-helper.js');
var utils_parseImageCandidateString = require('./utils/parse-image-candidate-string.js');

const {
  allowedIfAttributeIsPresent,
  allowedIfAttributeIsAbsent,
  allowedIfAttributeHasValue,
  allowedIfParentIsPresent,
  hasKeyword
} = metaHelper.metadataHelper;
const validId = {
  name: "a valid id",
  pattern: /^\S+$/
};
const validPositiveInteger = {
  name: "a positive integer",
  pattern: /^\d+$/
};
const validNonEmptyString = {
  name: "a non-empty string",
  pattern: /^.+$/
};
const validBrowsingContextName = {
  name: "a browsing context name (non-empty string, must not start with `_`)",
  pattern: /^[^_].*$/
};
const validFloatingPoint = {
  name: "a floating-point number",
  pattern: /^-?(\d+(\.\d+)?|\.\d+)(E[+-]?\d+)?$/i
};
const ReferrerPolicy = [
  "",
  "no-referrer",
  "no-referrer-when-downgrade",
  "same-origin",
  "origin",
  "strict-origin",
  "origin-when-cross-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url"
];
function isInsideLandmark(node) {
  const selectors = [
    "article",
    "aside",
    "main",
    "nav",
    "section",
    '[role="article"]',
    '[role="complementary"]',
    '[role="main"]',
    '[role="navigation"]',
    '[role="region"]'
  ];
  return Boolean(node.closest(selectors.join(",")));
}
function hasWidthDescriptor(srcset) {
  return utils_parseImageCandidateString.parseImageCandidateString(srcset).some((it) => it.descriptor === "width");
}
function linkBodyOk(node) {
  if (node.hasAttribute("itemprop")) {
    return true;
  }
  const rel = node.getAttribute("rel");
  if (!rel) {
    return false;
  }
  if (typeof rel !== "string") {
    return false;
  }
  const bodyOk = /* @__PURE__ */ new Set([
    "dns-prefetch",
    "modulepreload",
    "pingback",
    "preconnect",
    "prefetch",
    "preload",
    "stylesheet"
  ]);
  const tokens = rel.toLowerCase().split(/\s+/);
  return tokens.some((keyword) => bodyOk.has(keyword));
}
var html5 = {
  /* https://html.spec.whatwg.org/multipage/dom.html#global-attributes */
  "*": {
    attributes: {
      accesskey: {
        enum: [/./u],
        list: true
      },
      "aria-activedescendant": {
        enum: [validId],
        reference: "id"
      },
      "aria-controls": {
        list: true,
        enum: [validId],
        reference: "id"
      },
      "aria-describedby": {
        list: true,
        enum: [validId],
        reference: "id"
      },
      "aria-details": {
        enum: [validId],
        reference: "id"
      },
      "aria-errormessage": {
        enum: [validId],
        reference: "id"
      },
      "aria-flowto": {
        list: true,
        enum: [validId],
        reference: "id"
      },
      "aria-labelledby": {
        list: true,
        enum: [validId],
        reference: "id"
      },
      "aria-owns": {
        list: true,
        enum: [validId],
        reference: "id"
      },
      "aria-*": {},
      autocapitalize: {
        enum: ["off", "none", "on", "sentences", "words", "characters"]
      },
      autocorrect: {
        omit: true,
        enum: ["on", "off"]
      },
      autofocus: {
        boolean: true
      },
      class: {},
      contenteditable: {
        omit: true,
        enum: ["true", "false"]
      },
      contextmenu: {
        deprecated: true
      },
      "data-*": {},
      dir: {
        enum: ["ltr", "rtl", "auto"]
      },
      draggable: {
        enum: ["true", "false"]
      },
      enterkeyhint: {
        enum: ["enter", "done", "go", "next", "previous", "search", "send"]
      },
      /* css-shadow */
      exportparts: {},
      headingoffset: {
        enum: ["/^[0-8]$/"]
      },
      headingreset: {
        boolean: true
      },
      hidden: {
        omit: true,
        enum: ["hidden", "until-found"]
      },
      id: {
        enum: [validId]
      },
      inert: {
        boolean: true
      },
      inputmode: {
        enum: ["none", "text", "decimal", "numeric", "tel", "search", "email", "url"]
      },
      is: {},
      /* microdata */
      itemid: {},
      /* microdata */
      itemprop: {},
      /* microdata */
      itemref: {},
      /* microdata */
      itemscope: {
        boolean: true
      },
      /* microdata */
      itemtype: {},
      lang: {},
      nonce: {},
      "on*": {},
      /* css-shadow */
      part: {},
      popover: {
        omit: true,
        enum: ["auto", "hint", "manual"]
      },
      /* wai-aria */
      role: {},
      slot: {},
      spellcheck: {
        omit: true,
        enum: ["true", "false"]
      },
      style: {},
      tabindex: {
        enum: ["/-?\\d+/"]
      },
      title: {},
      translate: {
        omit: true,
        enum: ["yes", "no"]
      },
      writingsuggestions: {
        omit: true,
        enum: ["true", "false"]
      },
      "xml:*": {},
      xmlns: {
        enum: [validNonEmptyString]
      },
      "xmlns:*": {
        enum: [validNonEmptyString]
      }
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element */
  a: {
    flow: true,
    focusable(node) {
      return node.hasAttribute("href");
    },
    phrasing: true,
    interactive(node) {
      return node.hasAttribute("href");
    },
    transparent: true,
    attributes: {
      charset: {
        deprecated: true
      },
      coords: {
        deprecated: true
      },
      datafld: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      download: {
        allowed: allowedIfAttributeIsPresent("href"),
        omit: true,
        enum: [validNonEmptyString]
      },
      href: {
        enum: ["/.*/"]
      },
      hreflang: {
        allowed: allowedIfAttributeIsPresent("href")
      },
      itemprop: {
        allowed: allowedIfAttributeIsPresent("href")
      },
      methods: {
        deprecated: true
      },
      name: {
        deprecated: true
      },
      ping: {
        allowed: allowedIfAttributeIsPresent("href")
      },
      referrerpolicy: {
        allowed: allowedIfAttributeIsPresent("href"),
        enum: ReferrerPolicy
      },
      rel: {
        allowed(node, attr) {
          if (!node.hasAttribute("href")) {
            return `requires "href" attribute to be present`;
          }
          if (!attr || attr === "" || typeof attr !== "string") {
            return null;
          }
          const disallowed = /* @__PURE__ */ new Set([
            /* whatwg */
            "canonical",
            "dns-prefetch",
            "expect",
            "icon",
            "manifest",
            "modulepreload",
            "pingback",
            "preconnect",
            "prefetch",
            "preload",
            "stylesheet",
            /* microformats.org */
            "apple-touch-icon",
            "apple-touch-icon-precomposed",
            "apple-touch-startup-image",
            "authorization_endpoint",
            "component",
            "chrome-webstore-item",
            "edit",
            "gbfs",
            "gtfs-static",
            "gtfs-realtime",
            "import",
            "mask-icon",
            "meta",
            "micropub",
            "openid.delegate",
            "openid.server",
            "openid2.local_id",
            "openid2.provider",
            "p3pv1",
            "pgpkey",
            "schema.dcterms",
            "service",
            "shortlink",
            "sitemap",
            "subresource",
            "sword",
            "timesheet",
            "token_endpoint",
            "wlwmanifest",
            "stylesheet/less",
            "yandex-tableau-widget"
          ]);
          const tokens = attr.toLowerCase().split(/\s+/);
          for (const keyword of tokens) {
            if (disallowed.has(keyword)) {
              return `<a> does not allow rel="${keyword}"`;
            }
            if (keyword.startsWith("dcterms.")) {
              return `<a> does not allow rel="${keyword}"`;
            }
          }
          return null;
        },
        list: true,
        enum: [validNonEmptyString]
      },
      shape: {
        deprecated: true
      },
      target: {
        allowed: allowedIfAttributeIsPresent("href"),
        enum: [validBrowsingContextName, "_blank", "_self", "_parent", "_top"]
      },
      type: {
        allowed: allowedIfAttributeIsPresent("href")
      },
      urn: {
        deprecated: true
      }
    },
    permittedDescendants: [
      /* "Transparent, but there must be no interactive content descendant, a
       * element descendant, or descendant with the tabindex attribute
       * specified." */
      { exclude: ["@interactive", "a"] }
    ],
    aria: {
      implicitRole(node) {
        return node.hasAttribute("href") ? "link" : "generic";
      },
      naming(node) {
        return node.hasAttribute("href") ? "allowed" : "prohibited";
      }
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-abbr-element */
  abbr: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      naming: "prohibited"
    }
  },
  acronym: {
    deprecated: {
      message: "use <abbr> instead",
      documentation: "`<abbr>` can be used as a replacement.",
      source: "html5"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-address-element */
  address: {
    flow: true,
    aria: {
      implicitRole: "group"
    },
    permittedContent: ["@flow"],
    permittedDescendants: [{ exclude: ["address", "header", "footer", "@heading", "@sectioning"] }]
  },
  /* https://html.spec.whatwg.org/multipage/obsolete.html#the-applet-element */
  applet: {
    deprecated: {
      source: "html5"
    },
    attributes: {
      datafld: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      }
    }
  },
  /* https://html.spec.whatwg.org/multipage/image-maps.html#the-area-element */
  area: {
    flow(node) {
      return Boolean(node.closest("map"));
    },
    focusable(node) {
      return node.hasAttribute("href");
    },
    phrasing(node) {
      return Boolean(node.closest("map"));
    },
    void: true,
    attributes: {
      alt: {},
      coords: {
        allowed(node) {
          const attr = node.getAttribute("shape");
          if (attr === "default") {
            return `cannot be used when "shape" attribute is "default"`;
          }
          return null;
        }
      },
      download: {
        allowed: allowedIfAttributeIsPresent("href")
      },
      nohref: {
        deprecated: true
      },
      itemprop: {
        allowed: allowedIfAttributeIsPresent("href")
      },
      ping: {
        allowed: allowedIfAttributeIsPresent("href")
      },
      referrerpolicy: {
        allowed: allowedIfAttributeIsPresent("href"),
        enum: ReferrerPolicy
      },
      rel: {
        allowed(node, attr) {
          if (!node.hasAttribute("href")) {
            return `requires "href" attribute to be present`;
          }
          if (!attr || attr === "" || typeof attr !== "string") {
            return null;
          }
          const disallowed = /* @__PURE__ */ new Set([
            /* whatwg */
            "canonical",
            "dns-prefetch",
            "expect",
            "icon",
            "manifest",
            "modulepreload",
            "pingback",
            "preconnect",
            "prefetch",
            "preload",
            "stylesheet",
            /* microformats.org */
            "apple-touch-icon",
            "apple-touch-icon-precomposed",
            "apple-touch-startup-image",
            "authorization_endpoint",
            "component",
            "chrome-webstore-item",
            "edit",
            "gbfs",
            "gtfs-static",
            "gtfs-realtime",
            "import",
            "mask-icon",
            "meta",
            "micropub",
            "openid.delegate",
            "openid.server",
            "openid2.local_id",
            "openid2.provider",
            "p3pv1",
            "pgpkey",
            "schema.dcterms",
            "service",
            "shortlink",
            "sitemap",
            "subresource",
            "sword",
            "timesheet",
            "token_endpoint",
            "wlwmanifest",
            "stylesheet/less",
            "yandex-tableau-widget"
          ]);
          const tokens = attr.toLowerCase().split(/\s+/);
          for (const keyword of tokens) {
            if (disallowed.has(keyword)) {
              return `<area> does not allow rel="${keyword}"`;
            }
            if (keyword.startsWith("dcterms.")) {
              return `<area> does not allow rel="${keyword}"`;
            }
          }
          return null;
        }
      },
      shape: {
        allowed(node, attr) {
          const shape = attr ?? "rect";
          switch (shape) {
            case "circ":
            case "circle":
            case "poly":
            case "polygon":
            case "rect":
            case "rectangle":
              return allowedIfAttributeIsPresent("coords")(node, attr);
            default:
              return null;
          }
        },
        enum: ["rect", "circle", "poly", "default"]
      },
      target: {
        allowed: allowedIfAttributeIsPresent("href"),
        enum: [validBrowsingContextName, "_blank", "_self", "_parent", "_top"]
      }
    },
    aria: {
      implicitRole(node) {
        return node.hasAttribute("href") ? "link" : "generic";
      },
      naming(node) {
        return node.hasAttribute("href") ? "allowed" : "prohibited";
      }
    },
    requiredAncestors: ["map", "template"]
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-article-element */
  article: {
    flow: true,
    sectioning: true,
    permittedContent: ["@flow"],
    permittedDescendants: [{ exclude: ["main"] }],
    aria: {
      implicitRole: "article"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-aside-element */
  aside: {
    flow: true,
    sectioning: true,
    permittedContent: ["@flow"],
    permittedDescendants: [{ exclude: ["main"] }],
    aria: {
      implicitRole: "complementary"
    }
  },
  /* https://html.spec.whatwg.org/multipage/media.html#the-audio-element */
  audio: {
    flow: true,
    focusable(node) {
      return node.hasAttribute("controls");
    },
    phrasing: true,
    embedded: true,
    interactive(node) {
      return node.hasAttribute("controls");
    },
    transparent: ["@flow"],
    attributes: {
      autoplay: {
        boolean: true
      },
      controls: {
        boolean: true
      },
      crossorigin: {
        omit: true,
        enum: ["anonymous", "use-credentials"]
      },
      itemprop: {
        allowed: allowedIfAttributeIsPresent("src")
      },
      loop: {
        boolean: true
      },
      muted: {
        boolean: true
      },
      preload: {
        omit: true,
        enum: ["none", "metadata", "auto"]
      },
      src: {
        enum: [validNonEmptyString]
      }
    },
    permittedContent: ["@flow", "track", "source"],
    permittedDescendants: [{ exclude: ["audio", "video"] }],
    permittedOrder: ["source", "track", "@flow"]
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-b-element */
  b: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/document-metadata.html#the-base-element */
  base: {
    metadata: true,
    void: true,
    attributes: {
      href: {},
      target: {}
    },
    permittedParent: ["head"],
    aria: {
      naming: "prohibited"
    }
  },
  basefont: {
    deprecated: {
      message: "use CSS instead",
      documentation: "Use CSS `font-size` property instead.",
      source: "html4"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-bdi-element */
  bdi: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-bdo-element */
  bdo: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  bgsound: {
    deprecated: {
      message: "use <audio> instead",
      documentation: "Use the `<audio>` element instead but consider accessibility concerns with autoplaying sounds.",
      source: "non-standard"
    }
  },
  big: {
    deprecated: {
      message: "use CSS instead",
      documentation: "Use CSS `font-size` property instead.",
      source: "html5"
    }
  },
  blink: {
    deprecated: {
      documentation: "`<blink>` has no direct replacement and blinking text is frowned upon by accessibility standards.",
      source: "non-standard"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-blockquote-element */
  blockquote: {
    flow: true,
    sectioning: true,
    attributes: {
      cite: {}
    },
    aria: {
      implicitRole: "blockquote"
    },
    permittedContent: ["@flow"]
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-body-element */
  body: {
    optionalEnd: true,
    permittedContent: ["@flow"],
    permittedParent: ["html"],
    attributes: {
      alink: {
        deprecated: true
      },
      background: {
        deprecated: true
      },
      bgcolor: {
        deprecated: true
      },
      link: {
        deprecated: true
      },
      marginbottom: {
        deprecated: true
      },
      marginheight: {
        deprecated: true
      },
      marginleft: {
        deprecated: true
      },
      marginright: {
        deprecated: true
      },
      margintop: {
        deprecated: true
      },
      marginwidth: {
        deprecated: true
      },
      text: {
        deprecated: true
      },
      vlink: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-br-element */
  br: {
    flow: true,
    phrasing: true,
    void: true,
    attributes: {
      clear: {
        deprecated: true
      }
    },
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element */
  button: {
    flow: true,
    focusable: true,
    phrasing: true,
    interactive: true,
    formAssociated: {
      disablable: true,
      listed: true
    },
    labelable: true,
    submitButton(node) {
      const type = node.getAttribute("type");
      return !type || type === "submit";
    },
    attributes: {
      autofocus: {
        boolean: true
      },
      command: {
        enum: [
          "toggle-popover",
          "show-popover",
          "hide-popover",
          "close",
          "request-close",
          "show-modal",
          "/^--/"
        ]
      },
      commandfor: {
        enum: [validId],
        reference: "id"
      },
      datafld: {
        deprecated: true
      },
      dataformatas: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      disabled: {
        boolean: true
      },
      form: {
        enum: [validId],
        reference: "id"
      },
      formaction: {
        allowed: allowedIfAttributeHasValue("type", ["submit"], { defaultValue: "submit" })
      },
      formenctype: {
        allowed: allowedIfAttributeHasValue("type", ["submit"], { defaultValue: "submit" })
      },
      formmethod: {
        allowed: allowedIfAttributeHasValue("type", ["submit"], { defaultValue: "submit" }),
        enum: ["get", "post", "dialog"]
      },
      formnovalidate: {
        allowed: allowedIfAttributeHasValue("type", ["submit"], { defaultValue: "submit" }),
        boolean: true
      },
      formtarget: {
        allowed: allowedIfAttributeHasValue("type", ["submit"], { defaultValue: "submit" }),
        enum: [validBrowsingContextName, "_blank", "_self", "_parent", "_top"]
      },
      name: {
        enum: [validNonEmptyString]
      },
      popovertarget: {
        enum: [validId],
        reference: "id"
      },
      popovertargetaction: {
        enum: ["toggle", "show", "hide"]
      },
      type: {
        enum: ["submit", "reset", "button"]
      },
      value: {}
    },
    aria: {
      implicitRole: "button"
    },
    permittedContent: ["@phrasing"],
    permittedDescendants: [{ exclude: ["@interactive"] }],
    textContent: "accessible"
  },
  /* https://html.spec.whatwg.org/multipage/canvas.html#the-canvas-element */
  canvas: {
    flow: true,
    phrasing: true,
    embedded: true,
    transparent: true
  },
  /* https://html.spec.whatwg.org/multipage/tables.html#the-caption-element */
  caption: {
    implicitClosed: ["col", "colgroup", "thead", "tfoot", "tbody", "tr"],
    optionalEnd: true,
    permittedContent: ["@flow"],
    permittedDescendants: [{ exclude: ["table"] }],
    attributes: {
      align: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "caption",
      naming: "prohibited"
    }
  },
  center: {
    deprecated: {
      message: "use CSS instead",
      documentation: "Use the CSS `text-align` or `margin: auto` properties instead.",
      source: "html4"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-cite-element */
  cite: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-code-element */
  code: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "code",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/tables.html#the-col-element */
  col: {
    attributes: {
      align: {
        deprecated: true
      },
      char: {
        deprecated: true
      },
      charoff: {
        deprecated: true
      },
      span: {
        enum: [validPositiveInteger]
      },
      valign: {
        deprecated: true
      },
      width: {
        deprecated: true
      }
    },
    void: true,
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/tables.html#the-colgroup-element */
  colgroup: {
    implicitClosed: ["colgroup", "caption", "thead", "tbody", "tfoot", "tr"],
    attributes: {
      span: {
        enum: [validPositiveInteger]
      }
    },
    permittedContent: ["col", "template"],
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-data-element */
  data: {
    flow: true,
    phrasing: true,
    attributes: {
      value: {}
    },
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-datalist-element */
  datalist: {
    flow: true,
    phrasing: true,
    aria: {
      implicitRole: "listbox",
      naming: "prohibited"
    },
    permittedContent: ["@phrasing", "option"]
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-dd-element */
  dd: {
    implicitClosed: ["dd", "dt"],
    permittedContent: ["@flow"],
    requiredAncestors: ["dl > dd", "dl > div > dd", "template > dd", "template > div > dd"]
  },
  /* https://html.spec.whatwg.org/multipage/edits.html#the-del-element */
  del: {
    flow: true,
    phrasing: true,
    transparent: true,
    attributes: {
      cite: {},
      datetime: {}
    },
    aria: {
      implicitRole: "deletion",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element */
  details: {
    flow: true,
    sectioning: true,
    interactive: true,
    attributes: {
      name: {},
      open: {
        boolean: true
      }
    },
    aria: {
      implicitRole: "group"
    },
    permittedContent: ["summary", "@flow"],
    permittedOrder: ["summary", "@flow"],
    requiredContent: ["summary"]
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-dfn-element */
  dfn: {
    flow: true,
    phrasing: true,
    aria: {
      implicitRole: "term"
    },
    permittedContent: ["@phrasing"],
    permittedDescendants: [{ exclude: ["dfn"] }]
  },
  /* https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element */
  dialog: {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      closedby: {
        omit: true,
        enum: ["any", "closerequest", "none"]
      },
      open: {
        boolean: true
      }
    },
    aria: {
      implicitRole: "dialog"
    }
  },
  dir: {
    deprecated: {
      documentation: "The non-standard `<dir>` element has no direct replacement but MDN recommends replacing with `<ul>` and CSS.",
      source: "html4"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-div-element */
  div: {
    flow: true,
    permittedContent: ["@flow", "dt", "dd"],
    attributes: {
      align: {
        deprecated: true
      },
      datafld: {
        deprecated: true
      },
      dataformatas: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-dl-element */
  dl: {
    flow: true,
    permittedContent: ["@script", "dt", "dd", "div"],
    attributes: {
      compact: {
        deprecated: true
      }
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-dt-element */
  dt: {
    implicitClosed: ["dd", "dt"],
    permittedContent: ["@flow"],
    permittedDescendants: [{ exclude: ["header", "footer", "@sectioning", "@heading"] }],
    requiredAncestors: ["dl > dt", "dl > div > dt", "template > dt", "template > div > dt"]
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-em-element */
  em: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "emphasis",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-embed-element */
  embed: {
    flow: true,
    phrasing: true,
    embedded: true,
    interactive: true,
    void: true,
    attributes: {
      height: {
        enum: [validPositiveInteger]
      },
      src: {
        required: true,
        enum: [validNonEmptyString]
      },
      title: {
        required: true
      },
      width: {
        enum: [validPositiveInteger]
      }
    }
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-fieldset-element */
  fieldset: {
    flow: true,
    formAssociated: {
      disablable: true,
      listed: true
    },
    attributes: {
      datafld: {
        deprecated: true
      },
      disabled: {
        boolean: true
      },
      form: {
        enum: [validId],
        reference: "id"
      },
      name: {
        enum: [validNonEmptyString]
      }
    },
    aria: {
      implicitRole: "group"
    },
    permittedContent: ["@flow", "legend?"],
    permittedOrder: ["legend", "@flow"]
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-figcaption-element */
  figcaption: {
    permittedContent: ["@flow"],
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-figure-element */
  figure: {
    flow: true,
    aria: {
      implicitRole: "figure"
    },
    permittedContent: ["@flow", "figcaption?"],
    permittedOrder: ["figcaption", "@flow", "figcaption"]
  },
  font: {
    deprecated: {
      message: "use CSS instead",
      documentation: "Use CSS font properties instead.",
      source: "html4"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-footer-element */
  footer: {
    flow: true,
    aria: {
      implicitRole(node) {
        if (isInsideLandmark(node)) {
          return "generic";
        }
        return "contentinfo";
      },
      naming(node) {
        if (isInsideLandmark(node)) {
          return "prohibited";
        }
        return "allowed";
      }
    },
    permittedContent: ["@flow"],
    permittedDescendants: [{ exclude: ["header", "footer", "main"] }]
  },
  /* https://html.spec.whatwg.org/multipage/forms.html#the-form-element */
  form: {
    flow: true,
    form: true,
    attributes: {
      accept: {
        deprecated: true
      },
      "accept-charset": {},
      action: {
        enum: [/^\s*\S+\s*$/]
      },
      autocomplete: {
        enum: ["on", "off"]
      },
      enctype: {
        enum: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]
      },
      method: {
        enum: ["get", "post", "dialog"]
      },
      name: {},
      novalidate: {
        boolean: true
      },
      rel: {
        allowed(_, attr) {
          if (!attr || attr === "" || typeof attr !== "string") {
            return null;
          }
          const disallowed = /* @__PURE__ */ new Set([
            /* whatwg */
            "alternate",
            "canonical",
            "author",
            "bookmark",
            "dns-prefetch",
            "expect",
            "icon",
            "manifest",
            "modulepreload",
            "pingback",
            "preconnect",
            "prefetch",
            "preload",
            "privacy-policy",
            "stylesheet",
            "tag",
            "terms-of-service"
          ]);
          const tokens = attr.toLowerCase().split(/\s+/);
          for (const keyword of tokens) {
            if (disallowed.has(keyword)) {
              return `<form> does not allow rel="${keyword}"`;
            }
          }
          return null;
        },
        list: true,
        enum: [validNonEmptyString]
      },
      target: {
        enum: [validBrowsingContextName, "_blank", "_self", "_parent", "_top"]
      }
    },
    aria: {
      implicitRole: "form"
    },
    permittedContent: ["@flow"],
    permittedDescendants: [{ exclude: ["@form"] }]
  },
  frame: {
    deprecated: {
      documentation: "The `<frame>` element can be replaced with the `<iframe>` element but a better solution is to remove usage of frames entirely.",
      source: "html5"
    },
    attributes: {
      datafld: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      title: {
        required: true
      }
    }
  },
  frameset: {
    deprecated: {
      documentation: "The `<frameset>` element can be replaced with the `<iframe>` element but a better solution is to remove usage of frames entirely.",
      source: "html5"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements */
  h1: {
    flow: true,
    heading: true,
    permittedContent: ["@phrasing"],
    attributes: {
      align: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "heading"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements */
  h2: {
    flow: true,
    heading: true,
    permittedContent: ["@phrasing"],
    attributes: {
      align: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "heading"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements */
  h3: {
    flow: true,
    heading: true,
    permittedContent: ["@phrasing"],
    attributes: {
      align: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "heading"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements */
  h4: {
    flow: true,
    heading: true,
    permittedContent: ["@phrasing"],
    attributes: {
      align: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "heading"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements */
  h5: {
    flow: true,
    heading: true,
    permittedContent: ["@phrasing"],
    attributes: {
      align: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "heading"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-h1,-h2,-h3,-h4,-h5,-and-h6-elements */
  h6: {
    flow: true,
    heading: true,
    permittedContent: ["@phrasing"],
    attributes: {
      align: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "heading"
    }
  },
  /* https://html.spec.whatwg.org/multipage/document-metadata.html#the-head-element */
  head: {
    implicitClosed: ["body", "@flow-not-meta"],
    optionalEnd: true,
    permittedContent: ["base?", "title?", "@meta"],
    permittedParent: ["html"],
    requiredContent: ["title"],
    attributes: {
      profile: {
        deprecated: true
      }
    },
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-header-element */
  header: {
    flow: true,
    aria: {
      implicitRole(node) {
        if (isInsideLandmark(node)) {
          return "generic";
        }
        return "banner";
      },
      naming(node) {
        if (isInsideLandmark(node)) {
          return "prohibited";
        }
        return "allowed";
      }
    },
    permittedContent: ["@flow"],
    permittedDescendants: [{ exclude: ["header", "footer", "main"] }]
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-hgroup-element */
  hgroup: {
    flow: true,
    heading: true,
    permittedContent: ["p", "@heading?"],
    permittedDescendants: [{ exclude: ["hgroup"] }],
    requiredContent: ["@heading"],
    aria: {
      implicitRole: "group"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-hr-element */
  hr: {
    flow: true,
    void: true,
    attributes: {
      align: {
        deprecated: true
      },
      color: {
        deprecated: true
      },
      noshade: {
        deprecated: true
      },
      size: {
        deprecated: true
      },
      width: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "separator"
    }
  },
  /* https://html.spec.whatwg.org/multipage/semantics.html#the-html-element */
  html: {
    implicitOpen: [
      { for: ["@meta"], open: "head" },
      { for: ["@flow-not-meta"], open: "body" }
    ],
    optionalEnd: true,
    permittedContent: ["head?", "body?"],
    permittedOrder: ["head", "body"],
    requiredContent: ["head", "body"],
    attributes: {
      lang: {
        required: true
      },
      version: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-i-element */
  i: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element */
  iframe: {
    flow: true,
    phrasing: true,
    embedded: true,
    interactive: true,
    attributes: {
      align: {
        deprecated: true
      },
      allowtransparency: {
        deprecated: true
      },
      datafld: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      frameborder: {
        deprecated: true
      },
      height: {
        enum: [validPositiveInteger]
      },
      hspace: {
        deprecated: true
      },
      marginheight: {
        deprecated: true
      },
      marginwidth: {
        deprecated: true
      },
      referrerpolicy: {
        enum: ReferrerPolicy
      },
      scrolling: {
        deprecated: true
      },
      src: {
        enum: [validNonEmptyString]
      },
      title: {
        required: true
      },
      vspace: {
        deprecated: true
      },
      width: {
        enum: [validPositiveInteger]
      }
    },
    permittedContent: []
  },
  /* https://html.spec.whatwg.org/multipage/embedded-content.html#the-img-element */
  img: {
    flow: true,
    phrasing: true,
    embedded: true,
    interactive(node) {
      return node.hasAttribute("usemap");
    },
    void: true,
    attributes: {
      align: {
        deprecated: true
      },
      alt: {},
      border: {
        deprecated: true
      },
      crossorigin: {
        omit: true,
        enum: ["anonymous", "use-credentials"]
      },
      datafld: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      decoding: {
        enum: ["sync", "async", "auto"]
      },
      fetchpriority: {
        omit: true,
        enum: ["high", "low", "auto"]
      },
      height: {
        enum: [validPositiveInteger]
      },
      hspace: {
        deprecated: true
      },
      ismap: {
        boolean: true
      },
      loading: {
        omit: true,
        enum: ["lazy", "eager"]
      },
      lowsrc: {
        deprecated: true
      },
      name: {
        deprecated: true
      },
      referrerpolicy: {
        enum: ReferrerPolicy
      },
      sizes: {},
      src: {
        required: true,
        enum: [validNonEmptyString]
      },
      srcset: {
        enum: ["/[^]+/"]
      },
      usemap: {},
      vspace: {
        deprecated: true
      },
      width: {
        enum: [validPositiveInteger]
      }
    },
    aria: {
      implicitRole(node) {
        const alt = node.getAttribute("alt");
        const ariaLabel = node.getAttribute("aria-label");
        const ariaLabelledBy = node.getAttribute("aria-labelledby");
        const title = node.getAttribute("title");
        if (alt === "" && !ariaLabel && !ariaLabelledBy && !title) {
          return "none";
        }
        return "img";
      },
      naming(node) {
        const alt = node.getAttribute("alt");
        const ariaLabel = node.getAttribute("aria-label");
        const ariaLabelledBy = node.getAttribute("aria-labelledby");
        const title = node.getAttribute("title");
        if (!alt && !ariaLabel && !ariaLabelledBy && !title) {
          return "prohibited";
        }
        return "allowed";
      }
    }
  },
  /* https://html.spec.whatwg.org/multipage/input.html#the-input-element */
  input: {
    flow: true,
    focusable(node) {
      return node.getAttribute("type") !== "hidden";
    },
    phrasing: true,
    interactive(node) {
      return node.getAttribute("type") !== "hidden";
    },
    void: true,
    formAssociated: {
      disablable: true,
      listed: true
    },
    labelable(node) {
      return node.getAttribute("type") !== "hidden";
    },
    submitButton(node) {
      const type = node.getAttribute("type");
      return type === "submit" || type === "image";
    },
    attributes: {
      accept: {},
      align: {
        deprecated: true
      },
      alpha: {
        boolean: true
      },
      alt: {},
      autocapitalize: {
        enum: ["off", "none", "on", "sentences", "words", "characters"]
      },
      autocomplete: {},
      autofocus: {
        boolean: true
      },
      capture: {
        omit: true,
        enum: ["environment", "user"]
      },
      checked: {
        boolean: true
      },
      colorspace: {
        enum: ["limited-srgb", "display-p3"]
      },
      datafld: {
        deprecated: true
      },
      dataformatas: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      dirname: {},
      disabled: {
        boolean: true
      },
      form: {
        enum: [validId],
        reference: "id"
      },
      formaction: {
        allowed: allowedIfAttributeHasValue("type", ["submit", "image"], {
          defaultValue: "submit"
        })
      },
      formenctype: {
        allowed: allowedIfAttributeHasValue("type", ["submit", "image"], {
          defaultValue: "submit"
        })
      },
      formmethod: {
        allowed: allowedIfAttributeHasValue("type", ["submit", "image"], {
          defaultValue: "submit"
        }),
        enum: ["get", "post", "dialog"]
      },
      formnovalidate: {
        allowed: allowedIfAttributeHasValue("type", ["submit", "image"], {
          defaultValue: "submit"
        }),
        boolean: true
      },
      formtarget: {
        allowed: allowedIfAttributeHasValue("type", ["submit", "image"], {
          defaultValue: "submit"
        }),
        enum: [validBrowsingContextName, "_blank", "_self", "_parent", "_top"]
      },
      height: {
        enum: [validPositiveInteger]
      },
      hspace: {
        deprecated: true
      },
      inputmode: {
        enum: ["none", "text", "decimal", "numeric", "tel", "search", "email", "url"]
      },
      ismap: {
        deprecated: true
      },
      list: {
        enum: [validId],
        reference: "id"
      },
      max: {
        enum: [validNonEmptyString]
      },
      maxlength: {
        enum: [validPositiveInteger]
      },
      min: {
        enum: [validNonEmptyString]
      },
      minlength: {
        enum: [validPositiveInteger]
      },
      multiple: {
        boolean: true
      },
      name: {
        enum: [validNonEmptyString]
      },
      pattern: {},
      placeholder: {},
      popovertarget: {
        enum: [validId],
        reference: "id"
      },
      popovertargetaction: {
        enum: ["toggle", "show", "hide"]
      },
      readonly: {
        boolean: true
      },
      required: {
        boolean: true
      },
      size: {
        enum: [validPositiveInteger]
      },
      src: {
        enum: [validNonEmptyString]
      },
      step: {},
      type: {
        enum: [
          "button",
          "checkbox",
          "color",
          "date",
          "datetime-local",
          "email",
          "file",
          "hidden",
          "image",
          "month",
          "number",
          "password",
          "radio",
          "range",
          "reset",
          "search",
          "submit",
          "tel",
          "text",
          "time",
          "url",
          "week"
        ]
      },
      usemap: {
        deprecated: true
      },
      value: {},
      vspace: {
        deprecated: true
      },
      width: {
        enum: [validPositiveInteger]
      }
    },
    aria: {
      /* eslint-disable-next-line complexity -- the standard is complicated */
      implicitRole(node) {
        const list = node.hasAttribute("list");
        if (list) {
          return "combobox";
        }
        const type = node.getAttribute("type");
        switch (type) {
          case "button":
            return "button";
          case "checkbox":
            return "checkbox";
          case "color":
            return null;
          case "date":
            return null;
          case "datetime-local":
            return null;
          case "email":
            return "textbox";
          case "file":
            return null;
          case "hidden":
            return null;
          case "image":
            return "button";
          case "month":
            return null;
          case "number":
            return "spinbutton";
          case "password":
            return null;
          case "radio":
            return "radio";
          case "range":
            return "slider";
          case "reset":
            return "button";
          case "search":
            return "searchbox";
          case "submit":
            return "button";
          case "tel":
            return "textbox";
          case "text":
            return "textbox";
          case "time":
            return null;
          case "url":
            return "textbox";
          case "week":
            return null;
          default:
            return "textbox";
        }
      },
      naming(node) {
        return node.getAttribute("type") !== "hidden" ? "allowed" : "prohibited";
      }
    }
  },
  /* https://html.spec.whatwg.org/multipage/edits.html#the-ins-element */
  ins: {
    flow: true,
    phrasing: true,
    transparent: true,
    attributes: {
      cite: {},
      datetime: {}
    },
    aria: {
      implicitRole: "insertion",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/obsolete.html#isindex */
  isindex: {
    deprecated: {
      source: "html4"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-kbd-element */
  kbd: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      naming: "prohibited"
    }
  },
  keygen: {
    flow: true,
    phrasing: true,
    interactive: true,
    void: true,
    labelable: true,
    deprecated: true
  },
  /* https://html.spec.whatwg.org/multipage/forms.html#the-label-element */
  label: {
    flow: true,
    phrasing: true,
    interactive: true,
    permittedContent: ["@phrasing"],
    permittedDescendants: [{ exclude: ["label"] }],
    attributes: {
      datafld: {
        deprecated: true
      },
      dataformatas: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      for: {
        enum: [validId],
        reference: "id"
      }
    },
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-legend-element */
  legend: {
    permittedContent: ["@phrasing", "@heading"],
    attributes: {
      align: {
        deprecated: true
      },
      datafld: {
        deprecated: true
      },
      dataformatas: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      }
    },
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-li-element */
  li: {
    implicitClosed: ["li"],
    permittedContent: ["@flow"],
    permittedParent: ["ul", "ol", "menu", "template"],
    attributes: {
      type: {
        deprecated: true
      },
      value: {
        enum: ["/-?\\d+/"]
      }
    },
    aria: {
      implicitRole(node) {
        return node.closest("ul, ol, menu") ? "listitem" : "generic";
      }
    }
  },
  /* https://html.spec.whatwg.org/multipage/document-metadata.html#the-link-element */
  link: {
    metadata: true,
    flow(node) {
      return linkBodyOk(node);
    },
    phrasing(node) {
      return linkBodyOk(node);
    },
    void: true,
    attributes: {
      as: {
        allowed: allowedIfAttributeHasValue("rel", ["prefetch", "preload", "modulepreload"]),
        enum: [
          "audio",
          "audioworklet",
          "document",
          "embed",
          "fetch",
          "font",
          "frame",
          "iframe",
          "image",
          "manifest",
          "object",
          "paintworklet",
          "report",
          "script",
          "serviceworker",
          "sharedworker",
          "style",
          "track",
          "video",
          "webidentity",
          "worker",
          "xslt"
        ]
      },
      blocking: {
        allowed: allowedIfAttributeHasValue("rel", ["expect", "stylesheet"]),
        list: true,
        enum: ["render"]
      },
      charset: {
        deprecated: true
      },
      crossorigin: {
        omit: true,
        enum: ["anonymous", "use-credentials"]
      },
      disabled: {
        allowed: allowedIfAttributeHasValue("rel", ["stylesheet"]),
        boolean: true
      },
      href: {
        required(node) {
          if (node.hasAttribute("imagesrcset")) {
            return false;
          }
          return `{{ tagName }} is missing required "href" or "imagesrcset" attribute`;
        },
        enum: [validNonEmptyString]
      },
      imagesrcset: {
        allowed(node) {
          const rel = node.getAttribute("rel");
          if (!rel || typeof rel === "string" && !hasKeyword(rel, "preload")) {
            return `"rel" attribute must be "preload"`;
          }
          const as = node.getAttribute("as");
          if (!as || typeof as === "string" && as !== "image") {
            return `"as" attribute must be "image"`;
          }
          return null;
        }
      },
      imagesizes: {
        allowed(node) {
          const rel = node.getAttribute("rel");
          if (!rel || typeof rel === "string" && !hasKeyword(rel, "preload")) {
            return `"rel" attribute must be "preload"`;
          }
          const as = node.getAttribute("as");
          if (!as || typeof as === "string" && as !== "image") {
            return `"as" attribute must be "image"`;
          }
          return null;
        },
        required(node) {
          const imagesrcset = node.getAttribute("imagesrcset");
          if (typeof imagesrcset === "string" && hasWidthDescriptor(imagesrcset)) {
            return `{{ tagName }} requires "{{ attr }}" attribute when "imagesrcset" uses width descriptors`;
          }
          return false;
        }
      },
      integrity: {
        allowed: allowedIfAttributeHasValue("rel", ["stylesheet", "preload", "modulepreload"]),
        enum: [validNonEmptyString]
      },
      methods: {
        deprecated: true
      },
      referrerpolicy: {
        enum: ReferrerPolicy
      },
      rel: {
        allowed(_, attr) {
          if (!attr || attr === "" || typeof attr !== "string") {
            return null;
          }
          const disallowed = /* @__PURE__ */ new Set([
            /* whatwg */
            "bookmark",
            "external",
            "nofollow",
            "noopener",
            "noreferrer",
            "opener",
            "tag",
            /* microformats.org */
            "disclosure",
            "entry-content",
            "lightbox",
            "lightvideo"
          ]);
          const tokens = attr.toLowerCase().split(/\s+/);
          for (const keyword of tokens) {
            if (disallowed.has(keyword)) {
              return `<link> does not allow rel="${keyword}"`;
            }
          }
          return null;
        },
        list: true,
        enum: [validNonEmptyString]
      },
      target: {
        deprecated: true
      },
      urn: {
        deprecated: true
      }
    },
    aria: {
      naming: "prohibited"
    }
  },
  listing: {
    deprecated: {
      source: "html32"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-main-element */
  main: {
    flow: true,
    aria: {
      implicitRole: "main"
    }
  },
  /* https://html.spec.whatwg.org/multipage/image-maps.html#the-map-element */
  map: {
    flow: true,
    phrasing: true,
    transparent: true,
    attributes: {
      name: {
        required: true,
        enum: ["/\\S+/"]
      }
    },
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-mark-element */
  mark: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      naming: "prohibited"
    }
  },
  marquee: {
    deprecated: {
      documentation: "Marked as obsolete by both W3C and WHATWG standards but still implemented in most browsers. Animated text should be avoided for accessibility reasons as well.",
      source: "html5"
    },
    attributes: {
      datafld: {
        deprecated: true
      },
      dataformatas: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      }
    }
  },
  /* https://html.spec.whatwg.org/multipage/embedded-content.html#mathml */
  math: {
    flow: true,
    foreign: true,
    phrasing: true,
    embedded: true,
    attributes: {
      align: {
        deprecated: true
      },
      dir: {
        enum: ["ltr", "rtl"]
      },
      display: {
        enum: ["block", "inline"]
      },
      hspace: {
        deprecated: true
      },
      name: {
        deprecated: true
      },
      overflow: {
        enum: ["linebreak", "scroll", "elide", "truncate", "scale"]
      },
      vspace: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "math"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-menu-element */
  menu: {
    flow: true,
    aria: {
      implicitRole: "list"
    },
    permittedContent: ["@script", "li"]
  },
  /* https://html.spec.whatwg.org/multipage/semantics.html#the-meta-element */
  meta: {
    flow(node) {
      return node.hasAttribute("itemprop");
    },
    phrasing(node) {
      return node.hasAttribute("itemprop");
    },
    metadata: true,
    void: true,
    attributes: {
      charset: {
        enum: ["utf-8"]
      },
      content: {
        allowed: allowedIfAttributeIsPresent("name", "http-equiv", "itemprop", "property")
      },
      itemprop: {
        allowed: allowedIfAttributeIsAbsent("http-equiv", "name")
      },
      name: {
        allowed: allowedIfAttributeIsAbsent("http-equiv", "itemprop")
      },
      "http-equiv": {
        allowed: allowedIfAttributeIsAbsent("name", "itemprop")
      },
      scheme: {
        deprecated: true
      }
    },
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-meter-element */
  meter: {
    flow: true,
    phrasing: true,
    labelable: true,
    attributes: {
      high: {
        enum: [validFloatingPoint]
      },
      low: {
        enum: [validFloatingPoint]
      },
      max: {
        enum: [validFloatingPoint]
      },
      min: {
        enum: [validFloatingPoint]
      },
      optimum: {
        enum: [validFloatingPoint]
      },
      value: {
        enum: [validFloatingPoint]
      }
    },
    aria: {
      implicitRole: "meter"
    },
    permittedContent: ["@phrasing"],
    permittedDescendants: [{ exclude: "meter" }]
  },
  multicol: {
    deprecated: {
      message: "use CSS instead",
      documentation: "Use CSS columns instead.",
      source: "html5"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-nav-element */
  nav: {
    flow: true,
    sectioning: true,
    aria: {
      implicitRole: "navigation"
    },
    permittedContent: ["@flow"],
    permittedDescendants: [{ exclude: "main" }]
  },
  nextid: {
    deprecated: {
      source: "html32"
    }
  },
  nobr: {
    deprecated: {
      message: "use CSS instead",
      documentation: "Use CSS `white-space` property instead.",
      source: "non-standard"
    }
  },
  noembed: {
    deprecated: {
      source: "non-standard"
    }
  },
  noframes: {
    deprecated: {
      source: "html5"
    }
  },
  /* https://html.spec.whatwg.org/multipage/scripting.html#the-noscript-element */
  noscript: {
    metadata: true,
    flow: true,
    phrasing: true,
    transparent: true,
    permittedDescendants: [{ exclude: "noscript" }],
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-object-element */
  object: {
    flow: true,
    phrasing: true,
    embedded: true,
    interactive(node) {
      return node.hasAttribute("usemap");
    },
    transparent: true,
    formAssociated: {
      disablable: false,
      listed: true
    },
    attributes: {
      align: {
        deprecated: true
      },
      archive: {
        deprecated: true
      },
      blocking: {
        list: true,
        enum: ["render"]
      },
      border: {
        deprecated: true
      },
      classid: {
        deprecated: true
      },
      code: {
        deprecated: true
      },
      codebase: {
        deprecated: true
      },
      codetype: {
        deprecated: true
      },
      data: {
        enum: [validNonEmptyString],
        required: true
      },
      datafld: {
        deprecated: true
      },
      dataformatas: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      declare: {
        deprecated: true
      },
      height: {
        enum: [validPositiveInteger]
      },
      hspace: {
        deprecated: true
      },
      name: {
        enum: [validBrowsingContextName]
      },
      standby: {
        deprecated: true
      },
      vspace: {
        deprecated: true
      },
      width: {
        enum: [validPositiveInteger]
      }
    },
    permittedContent: ["param", "@flow"],
    permittedOrder: ["param", "@flow"]
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-ol-element */
  ol: {
    flow: true,
    attributes: {
      compact: {
        deprecated: true
      },
      reversed: {
        boolean: true
      },
      start: {
        enum: [validPositiveInteger]
      },
      type: {
        enum: ["a", "A", "i", "I", "1"]
      }
    },
    aria: {
      implicitRole: "list"
    },
    permittedContent: ["@script", "li"]
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-optgroup-element */
  optgroup: {
    implicitClosed: ["optgroup"],
    attributes: {
      disabled: {
        boolean: true
      },
      label: {}
    },
    aria: {
      implicitRole: "group"
    },
    permittedContent: ["@script", "option"]
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-option-element */
  option: {
    implicitClosed: ["option", "optgroup"],
    attributes: {
      dataformatas: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      disabled: {
        boolean: true
      },
      label: {},
      name: {
        deprecated: true
      },
      selected: {
        boolean: true
      },
      value: {}
    },
    aria: {
      implicitRole: "option"
    },
    permittedContent: ["@phrasing", "div"],
    permittedDescendants: [{ exclude: ["@interactive", "datalist", "object"] }]
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-output-element */
  output: {
    flow: true,
    phrasing: true,
    formAssociated: {
      disablable: false,
      listed: true
    },
    labelable: true,
    attributes: {
      for: {
        list: true,
        enum: [validId],
        reference: "id"
      },
      form: {
        enum: [validId],
        reference: "id"
      },
      name: {
        enum: [validNonEmptyString]
      }
    },
    aria: {
      implicitRole: "status"
    },
    permittedContent: ["@phrasing"]
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-p-element */
  p: {
    flow: true,
    implicitClosed: [
      "address",
      "article",
      "aside",
      "blockquote",
      "dd",
      "details",
      "dialog",
      "div",
      "dl",
      "dt",
      "fieldset",
      "figcaption",
      "figure",
      "footer",
      "form",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "header",
      "hgroup",
      "hr",
      "li",
      "main",
      "menu",
      "nav",
      "ol",
      "p",
      "pre",
      "search",
      "section",
      "table",
      "ul"
    ],
    permittedContent: ["@phrasing"],
    attributes: {
      align: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "paragraph",
      naming: "prohibited"
    }
  },
  param: {
    void: true,
    attributes: {
      datafld: {
        deprecated: true
      },
      type: {
        deprecated: true
      },
      valuetype: {
        deprecated: true
      }
    },
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/embedded-content.html#the-picture-element */
  picture: {
    flow: true,
    phrasing: true,
    embedded: true,
    permittedContent: ["@script", "source", "img"],
    permittedOrder: ["source", "img"],
    aria: {
      naming: "prohibited"
    }
  },
  plaintext: {
    deprecated: {
      message: "use <pre> or CSS instead",
      documentation: "Use the `<pre>` element or use CSS to set a monospace font.",
      source: "html2"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element */
  pre: {
    flow: true,
    permittedContent: ["@phrasing"],
    attributes: {
      width: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-progress-element */
  progress: {
    flow: true,
    phrasing: true,
    labelable: true,
    attributes: {
      max: {
        enum: [validFloatingPoint]
      },
      value: {
        enum: [validFloatingPoint]
      }
    },
    aria: {
      implicitRole: "progressbar"
    },
    permittedContent: ["@phrasing"],
    permittedDescendants: [{ exclude: "progress" }]
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-q-element */
  q: {
    flow: true,
    phrasing: true,
    attributes: {
      cite: {}
    },
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  rb: {
    implicitClosed: ["rb", "rt", "rtc", "rp"],
    permittedContent: ["@phrasing"]
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-rp-element */
  rp: {
    implicitClosed: ["rb", "rt", "rtc", "rp"],
    permittedContent: ["@phrasing"],
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-rt-element */
  rt: {
    implicitClosed: ["rb", "rt", "rtc", "rp"],
    permittedContent: ["@phrasing"],
    aria: {
      naming: "prohibited"
    }
  },
  rtc: {
    implicitClosed: ["rb", "rtc", "rp"],
    permittedContent: ["@phrasing", "rt"]
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-ruby-element */
  ruby: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing", "rb", "rp", "rt", "rtc"]
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-s-element */
  s: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "deletion",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-samp-element */
  samp: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/scripting.html#the-script-element */
  script: {
    metadata: true,
    flow: true,
    phrasing: true,
    scriptSupporting: true,
    attributes: {
      async: {
        boolean: true
      },
      blocking: {
        list: true,
        enum: ["render"]
      },
      crossorigin: {
        omit: true,
        enum: ["anonymous", "use-credentials"]
      },
      defer: {
        boolean: true
      },
      event: {
        deprecated: true
      },
      fetchpriority: {
        enum: ["high", "low", "auto"]
      },
      for: {
        deprecated: true
      },
      integrity: {
        allowed: allowedIfAttributeIsPresent("src"),
        enum: [validNonEmptyString]
      },
      language: {
        deprecated: true
      },
      nomodule: {
        boolean: true
      },
      referrerpolicy: {
        enum: ReferrerPolicy
      },
      src: {
        enum: [validNonEmptyString]
      },
      type: {}
    },
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-search-element */
  search: {
    flow: true,
    aria: {
      implicitRole: "search"
    }
  },
  /* https://html.spec.whatwg.org/multipage/sections.html#the-section-element */
  section: {
    flow: true,
    sectioning: true,
    aria: {
      implicitRole(node) {
        const name = node.hasAttribute("aria-label") || node.hasAttribute("aria-labelledby");
        return name ? "region" : "generic";
      }
    },
    permittedContent: ["@flow"]
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-select-element */
  select: {
    flow: true,
    focusable: true,
    phrasing: true,
    interactive: true,
    formAssociated: {
      disablable: true,
      listed: true
    },
    labelable: true,
    attributes: {
      autocomplete: {},
      autofocus: {
        boolean: true
      },
      disabled: {
        boolean: true
      },
      form: {
        enum: [validId],
        reference: "id"
      },
      multiple: {
        boolean: true
      },
      name: {
        enum: [validNonEmptyString]
      },
      required: {
        boolean: true
      },
      size: {
        enum: [validPositiveInteger]
      }
    },
    aria: {
      implicitRole(node) {
        const multiple = node.hasAttribute("multiple");
        if (multiple) {
          return "listbox";
        }
        const size = node.getAttribute("size");
        if (typeof size === "string") {
          const parsed = Math.trunc(Number(size));
          if (parsed > 1) {
            return "listbox";
          }
        }
        return "combobox";
      }
    },
    /* "Zero or one button elements if the select is a drop-down box, followed
     * by zero or more select element inner content element."
     *
     * "The following are select element inner content elements:
     * option, optgroup, hr, script-supporting elements, noscript, div"
     *
     * https://html.spec.whatwg.org/multipage/form-elements.html#the-select-element
     */
    permittedContent: [
      "@script",
      "button?",
      "datasrc",
      "datafld",
      "dataformatas",
      "option",
      "optgroup",
      "hr"
    ],
    permittedOrder: ["button", "option, optgroup, hr"]
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-selectedcontent-element */
  selectedcontent: {
    phrasing: true,
    permittedContent: [],
    textContent: "none",
    requiredAncestors: ["select > button"],
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/scripting.html#the-slot-element */
  slot: {
    flow: true,
    phrasing: true,
    transparent: true,
    aria: {
      naming: "prohibited"
    },
    attributes: {
      name: {}
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-small-element */
  small: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/embedded-content.html#the-source-element */
  source: {
    void: true,
    attributes: {
      type: {},
      media: {},
      src: {
        allowed: allowedIfParentIsPresent("audio", "video")
      },
      srcset: {
        allowed: allowedIfParentIsPresent("picture")
      },
      sizes: {
        allowed: allowedIfParentIsPresent("picture")
      },
      width: {
        allowed: allowedIfParentIsPresent("picture"),
        enum: [validPositiveInteger]
      },
      height: {
        allowed: allowedIfParentIsPresent("picture"),
        enum: [validPositiveInteger]
      }
    },
    aria: {
      naming: "prohibited"
    }
  },
  spacer: {
    deprecated: {
      message: "use CSS instead",
      documentation: "Use CSS margin or padding instead.",
      source: "non-standard"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-span-element */
  span: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    attributes: {
      datafld: {
        deprecated: true
      },
      dataformatas: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  strike: {
    deprecated: {
      message: "use <del> or <s> instead",
      documentation: "Use the `<del>` or `<s>` element instead.",
      source: "html5"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-strong-element */
  strong: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "strong",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/semantics.html#the-style-element */
  style: {
    metadata: true,
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-sub-and-sup-elements */
  sub: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "subscript",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/interactive-elements.html#the-summary-element */
  summary: {
    permittedContent: ["@phrasing", "@heading"],
    focusable(node) {
      return Boolean(node.closest("details"));
    },
    aria: {
      implicitRole: "button"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-sub-and-sup-elements */
  sup: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "superscript",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/embedded-content.html#svg-0 */
  svg: {
    flow: true,
    foreign: true,
    phrasing: true,
    embedded: true,
    aria: {
      implicitRole: "graphics-document"
    },
    attributes: {
      focusable: {
        enum: ["true", "false"]
      }
    }
  },
  /* while not part of HTML 5 specification these two elements are handled as
   * special cases to allow them as accessible text and to avoid issues with
   * "no-unknown-elements" they are added here */
  "svg:desc": {},
  "svg:title": {},
  /* https://html.spec.whatwg.org/multipage/tables.html#the-table-element */
  table: {
    flow: true,
    implicitOpen: [{ for: ["col"], open: "colgroup" }],
    permittedContent: ["@script", "caption?", "colgroup", "tbody", "tfoot?", "thead?", "tr"],
    permittedOrder: ["caption", "colgroup", "thead", "tbody", "tr", "tfoot"],
    attributes: {
      align: {
        deprecated: true
      },
      background: {
        deprecated: true
      },
      bgcolor: {
        deprecated: true
      },
      bordercolor: {
        deprecated: true
      },
      cellpadding: {
        deprecated: true
      },
      cellspacing: {
        deprecated: true
      },
      dataformatas: {
        deprecated: true
      },
      datapagesize: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      frame: {
        deprecated: true
      },
      rules: {
        deprecated: true
      },
      summary: {
        deprecated: true
      },
      width: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "table"
    }
  },
  /* https://html.spec.whatwg.org/multipage/tables.html#the-tbody-element */
  tbody: {
    implicitClosed: ["tbody", "tfoot"],
    permittedContent: ["@script", "tr"],
    attributes: {
      align: {
        deprecated: true
      },
      background: {
        deprecated: true
      },
      char: {
        deprecated: true
      },
      charoff: {
        deprecated: true
      },
      valign: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "rowgroup"
    }
  },
  /* https://html.spec.whatwg.org/multipage/tables.html#the-td-element */
  td: {
    flow: true,
    implicitClosed: ["td", "th", "tr", "tbody", "tfoot"],
    attributes: {
      align: {
        deprecated: true
      },
      axis: {
        deprecated: true
      },
      background: {
        deprecated: true
      },
      bgcolor: {
        deprecated: true
      },
      char: {
        deprecated: true
      },
      charoff: {
        deprecated: true
      },
      colspan: {
        enum: [validPositiveInteger]
      },
      headers: {
        list: true,
        enum: [validId],
        reference: "id"
      },
      height: {
        deprecated: true
      },
      nowrap: {
        deprecated: true
      },
      rowspan: {
        enum: [validPositiveInteger]
      },
      scope: {
        deprecated: true
      },
      valign: {
        deprecated: true
      },
      width: {
        deprecated: true
      }
    },
    aria: {
      implicitRole(node) {
        const table = node.closest("table");
        const tableRole = table?.getAttribute("role") ?? "table";
        switch (tableRole) {
          case "table":
            return "cell";
          case "grid":
          case "treegrid":
            return "gridcell";
          default:
            return null;
        }
      }
    },
    permittedContent: ["@flow"]
  },
  /* https://html.spec.whatwg.org/multipage/scripting.html#the-template-element */
  template: {
    metadata: true,
    flow: true,
    phrasing: true,
    scriptSupporting: true,
    templateRoot: true,
    attributes: {
      shadowrootclonable: {
        boolean: true
      },
      shadowrootcustomelementregistry: {
        boolean: true
      },
      shadowrootdelegatesfocus: {
        boolean: true
      },
      shadowrootmode: {
        enum: ["open", "closed"]
      },
      shadowrootserializable: {
        boolean: true
      },
      shadowrootslotassignment: {
        enum: ["named", "manual"]
      }
    },
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/form-elements.html#the-textarea-element */
  textarea: {
    flow: true,
    focusable: true,
    phrasing: true,
    interactive: true,
    formAssociated: {
      disablable: true,
      listed: true
    },
    labelable: true,
    attributes: {
      autocomplete: {},
      autofocus: {
        boolean: true
      },
      cols: {
        enum: [validPositiveInteger]
      },
      datafld: {
        deprecated: true
      },
      datasrc: {
        deprecated: true
      },
      dirname: {
        enum: [validNonEmptyString]
      },
      disabled: {
        boolean: true
      },
      form: {
        enum: [validId],
        reference: "id"
      },
      maxlength: {
        enum: [validPositiveInteger]
      },
      minlength: {
        enum: [validPositiveInteger]
      },
      name: {
        enum: [validNonEmptyString]
      },
      placeholder: {},
      readonly: {
        boolean: true
      },
      required: {
        boolean: true
      },
      rows: {
        enum: [validPositiveInteger]
      },
      wrap: {
        enum: ["hard", "soft"]
      }
    },
    aria: {
      implicitRole: "textbox"
    },
    permittedContent: []
  },
  /* https://html.spec.whatwg.org/multipage/tables.html#the-tfoot-element */
  tfoot: {
    implicitClosed: ["tbody"],
    optionalEnd: true,
    permittedContent: ["@script", "tr"],
    attributes: {
      align: {
        deprecated: true
      },
      background: {
        deprecated: true
      },
      char: {
        deprecated: true
      },
      charoff: {
        deprecated: true
      },
      valign: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "rowgroup"
    }
  },
  /* https://html.spec.whatwg.org/multipage/tables.html#the-th-element */
  th: {
    flow: true,
    implicitClosed: ["td", "th", "tr", "tbody", "tfoot"],
    attributes: {
      abbr: {},
      align: {
        deprecated: true
      },
      axis: {
        deprecated: true
      },
      background: {
        deprecated: true
      },
      bgcolor: {
        deprecated: true
      },
      char: {
        deprecated: true
      },
      headers: {
        list: true,
        enum: [validId],
        reference: "id"
      },
      charoff: {
        deprecated: true
      },
      colspan: {
        enum: [validPositiveInteger]
      },
      height: {
        deprecated: true
      },
      nowrap: {
        deprecated: true
      },
      rowspan: {
        enum: [validPositiveInteger]
      },
      scope: {
        enum: ["row", "col", "rowgroup", "colgroup"]
      },
      valign: {
        deprecated: true
      },
      width: {
        deprecated: true
      }
    },
    aria: {
      implicitRole(node) {
        const table = node.closest("table");
        const tableRole = table?.getAttribute("role") ?? "table";
        if (typeof tableRole !== "string" || !["table", "grid", "treegrid"].includes(tableRole)) {
          return null;
        }
        const scope = node.getAttribute("scope");
        switch (scope) {
          case "col":
            return "columnheader";
          case "row":
            return "rowheader";
          default:
            return tableRole === "table" ? "cell" : "gridcell";
        }
      }
    },
    permittedContent: ["@flow"],
    permittedDescendants: [{ exclude: ["header", "footer", "@sectioning", "@heading"] }]
  },
  /* https://html.spec.whatwg.org/multipage/tables.html#the-thead-element */
  thead: {
    implicitClosed: ["tbody", "tfoot"],
    optionalEnd: true,
    permittedContent: ["@script", "tr"],
    attributes: {
      align: {
        deprecated: true
      },
      background: {
        deprecated: true
      },
      char: {
        deprecated: true
      },
      charoff: {
        deprecated: true
      },
      valign: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "rowgroup"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-time-element */
  time: {
    flow: true,
    phrasing: true,
    attributes: {
      datetime: {}
    },
    aria: {
      implicitRole: "time",
      naming: "prohibited"
    },
    permittedContent: ["@phrasing"]
  },
  /* https://html.spec.whatwg.org/multipage/document-metadata.html#the-title-element */
  title: {
    metadata: true,
    permittedContent: [],
    permittedParent: ["head"],
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/tables.html#the-tr-element */
  tr: {
    implicitClosed: ["tr", "tbody", "tfoot"],
    permittedContent: ["@script", "td", "th"],
    attributes: {
      align: {
        deprecated: true
      },
      background: {
        deprecated: true
      },
      bgcolor: {
        deprecated: true
      },
      char: {
        deprecated: true
      },
      charoff: {
        deprecated: true
      },
      valign: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "row"
    }
  },
  /* https://html.spec.whatwg.org/multipage/media.html#the-track-element */
  track: {
    void: true,
    attributes: {
      default: {
        boolean: true
      },
      kind: {
        omit: true,
        enum: ["subtitles", "captions", "descriptions", "chapters", "metadata"]
      },
      label: {},
      src: {
        required: true,
        enum: [validNonEmptyString]
      },
      srclang: {}
    },
    aria: {
      naming: "prohibited"
    }
  },
  tt: {
    deprecated: {
      documentation: "Use a more semantically correct element such as `<code>`, `<var>` or `<pre>`.",
      source: "html4"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-u-element */
  u: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      implicitRole: "generic",
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element */
  ul: {
    flow: true,
    permittedContent: ["@script", "li"],
    attributes: {
      compact: {
        deprecated: true
      },
      type: {
        deprecated: true
      }
    },
    aria: {
      implicitRole: "list"
    }
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-var-element */
  var: {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/media.html#the-video-element */
  video: {
    flow: true,
    focusable(node) {
      return node.hasAttribute("controls");
    },
    phrasing: true,
    embedded: true,
    interactive(node) {
      return node.hasAttribute("controls");
    },
    transparent: ["@flow"],
    attributes: {
      autoplay: {
        boolean: true
      },
      controls: {
        boolean: true
      },
      crossorigin: {
        omit: true,
        enum: ["anonymous", "use-credentials"]
      },
      height: {
        enum: [validPositiveInteger]
      },
      itemprop: {
        allowed: allowedIfAttributeIsPresent("src")
      },
      loop: {
        boolean: true
      },
      muted: {
        boolean: true
      },
      playsinline: {
        boolean: true
      },
      poster: {
        enum: [validNonEmptyString]
      },
      preload: {
        omit: true,
        enum: ["none", "metadata", "auto"]
      },
      src: {
        enum: [validNonEmptyString]
      },
      width: {
        enum: [validPositiveInteger]
      }
    },
    permittedContent: ["@flow", "track", "source"],
    permittedDescendants: [{ exclude: ["audio", "video"] }],
    permittedOrder: ["source", "track", "@flow"]
  },
  /* https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-wbr-element */
  wbr: {
    flow: true,
    phrasing: true,
    void: true,
    aria: {
      naming: "prohibited"
    }
  },
  /* https://html.spec.whatwg.org/multipage/obsolete.html#the-xmp-element */
  xmp: {
    deprecated: {
      documentation: "Use `<pre>` or `<code>` and escape content using HTML entities instead.",
      source: "html32"
    }
  }
};

const bundledElements = {
  html5
};

var entities = [
	"&Aacute",
	"&aacute",
	"&Aacute;",
	"&aacute;",
	"&Abreve;",
	"&abreve;",
	"&ac;",
	"&acd;",
	"&acE;",
	"&Acirc",
	"&acirc",
	"&Acirc;",
	"&acirc;",
	"&acute",
	"&acute;",
	"&Acy;",
	"&acy;",
	"&AElig",
	"&aelig",
	"&AElig;",
	"&aelig;",
	"&af;",
	"&Afr;",
	"&afr;",
	"&Agrave",
	"&agrave",
	"&Agrave;",
	"&agrave;",
	"&alefsym;",
	"&aleph;",
	"&Alpha;",
	"&alpha;",
	"&Amacr;",
	"&amacr;",
	"&amalg;",
	"&AMP",
	"&amp",
	"&AMP;",
	"&amp;",
	"&And;",
	"&and;",
	"&andand;",
	"&andd;",
	"&andslope;",
	"&andv;",
	"&ang;",
	"&ange;",
	"&angle;",
	"&angmsd;",
	"&angmsdaa;",
	"&angmsdab;",
	"&angmsdac;",
	"&angmsdad;",
	"&angmsdae;",
	"&angmsdaf;",
	"&angmsdag;",
	"&angmsdah;",
	"&angrt;",
	"&angrtvb;",
	"&angrtvbd;",
	"&angsph;",
	"&angst;",
	"&angzarr;",
	"&Aogon;",
	"&aogon;",
	"&Aopf;",
	"&aopf;",
	"&ap;",
	"&apacir;",
	"&apE;",
	"&ape;",
	"&apid;",
	"&apos;",
	"&ApplyFunction;",
	"&approx;",
	"&approxeq;",
	"&Aring",
	"&aring",
	"&Aring;",
	"&aring;",
	"&Ascr;",
	"&ascr;",
	"&Assign;",
	"&ast;",
	"&asymp;",
	"&asympeq;",
	"&Atilde",
	"&atilde",
	"&Atilde;",
	"&atilde;",
	"&Auml",
	"&auml",
	"&Auml;",
	"&auml;",
	"&awconint;",
	"&awint;",
	"&backcong;",
	"&backepsilon;",
	"&backprime;",
	"&backsim;",
	"&backsimeq;",
	"&Backslash;",
	"&Barv;",
	"&barvee;",
	"&Barwed;",
	"&barwed;",
	"&barwedge;",
	"&bbrk;",
	"&bbrktbrk;",
	"&bcong;",
	"&Bcy;",
	"&bcy;",
	"&bdquo;",
	"&becaus;",
	"&Because;",
	"&because;",
	"&bemptyv;",
	"&bepsi;",
	"&bernou;",
	"&Bernoullis;",
	"&Beta;",
	"&beta;",
	"&beth;",
	"&between;",
	"&Bfr;",
	"&bfr;",
	"&bigcap;",
	"&bigcirc;",
	"&bigcup;",
	"&bigodot;",
	"&bigoplus;",
	"&bigotimes;",
	"&bigsqcup;",
	"&bigstar;",
	"&bigtriangledown;",
	"&bigtriangleup;",
	"&biguplus;",
	"&bigvee;",
	"&bigwedge;",
	"&bkarow;",
	"&blacklozenge;",
	"&blacksquare;",
	"&blacktriangle;",
	"&blacktriangledown;",
	"&blacktriangleleft;",
	"&blacktriangleright;",
	"&blank;",
	"&blk12;",
	"&blk14;",
	"&blk34;",
	"&block;",
	"&bne;",
	"&bnequiv;",
	"&bNot;",
	"&bnot;",
	"&Bopf;",
	"&bopf;",
	"&bot;",
	"&bottom;",
	"&bowtie;",
	"&boxbox;",
	"&boxDL;",
	"&boxDl;",
	"&boxdL;",
	"&boxdl;",
	"&boxDR;",
	"&boxDr;",
	"&boxdR;",
	"&boxdr;",
	"&boxH;",
	"&boxh;",
	"&boxHD;",
	"&boxHd;",
	"&boxhD;",
	"&boxhd;",
	"&boxHU;",
	"&boxHu;",
	"&boxhU;",
	"&boxhu;",
	"&boxminus;",
	"&boxplus;",
	"&boxtimes;",
	"&boxUL;",
	"&boxUl;",
	"&boxuL;",
	"&boxul;",
	"&boxUR;",
	"&boxUr;",
	"&boxuR;",
	"&boxur;",
	"&boxV;",
	"&boxv;",
	"&boxVH;",
	"&boxVh;",
	"&boxvH;",
	"&boxvh;",
	"&boxVL;",
	"&boxVl;",
	"&boxvL;",
	"&boxvl;",
	"&boxVR;",
	"&boxVr;",
	"&boxvR;",
	"&boxvr;",
	"&bprime;",
	"&Breve;",
	"&breve;",
	"&brvbar",
	"&brvbar;",
	"&Bscr;",
	"&bscr;",
	"&bsemi;",
	"&bsim;",
	"&bsime;",
	"&bsol;",
	"&bsolb;",
	"&bsolhsub;",
	"&bull;",
	"&bullet;",
	"&bump;",
	"&bumpE;",
	"&bumpe;",
	"&Bumpeq;",
	"&bumpeq;",
	"&Cacute;",
	"&cacute;",
	"&Cap;",
	"&cap;",
	"&capand;",
	"&capbrcup;",
	"&capcap;",
	"&capcup;",
	"&capdot;",
	"&CapitalDifferentialD;",
	"&caps;",
	"&caret;",
	"&caron;",
	"&Cayleys;",
	"&ccaps;",
	"&Ccaron;",
	"&ccaron;",
	"&Ccedil",
	"&ccedil",
	"&Ccedil;",
	"&ccedil;",
	"&Ccirc;",
	"&ccirc;",
	"&Cconint;",
	"&ccups;",
	"&ccupssm;",
	"&Cdot;",
	"&cdot;",
	"&cedil",
	"&cedil;",
	"&Cedilla;",
	"&cemptyv;",
	"&cent",
	"&cent;",
	"&CenterDot;",
	"&centerdot;",
	"&Cfr;",
	"&cfr;",
	"&CHcy;",
	"&chcy;",
	"&check;",
	"&checkmark;",
	"&Chi;",
	"&chi;",
	"&cir;",
	"&circ;",
	"&circeq;",
	"&circlearrowleft;",
	"&circlearrowright;",
	"&circledast;",
	"&circledcirc;",
	"&circleddash;",
	"&CircleDot;",
	"&circledR;",
	"&circledS;",
	"&CircleMinus;",
	"&CirclePlus;",
	"&CircleTimes;",
	"&cirE;",
	"&cire;",
	"&cirfnint;",
	"&cirmid;",
	"&cirscir;",
	"&ClockwiseContourIntegral;",
	"&CloseCurlyDoubleQuote;",
	"&CloseCurlyQuote;",
	"&clubs;",
	"&clubsuit;",
	"&Colon;",
	"&colon;",
	"&Colone;",
	"&colone;",
	"&coloneq;",
	"&comma;",
	"&commat;",
	"&comp;",
	"&compfn;",
	"&complement;",
	"&complexes;",
	"&cong;",
	"&congdot;",
	"&Congruent;",
	"&Conint;",
	"&conint;",
	"&ContourIntegral;",
	"&Copf;",
	"&copf;",
	"&coprod;",
	"&Coproduct;",
	"&COPY",
	"&copy",
	"&COPY;",
	"&copy;",
	"&copysr;",
	"&CounterClockwiseContourIntegral;",
	"&crarr;",
	"&Cross;",
	"&cross;",
	"&Cscr;",
	"&cscr;",
	"&csub;",
	"&csube;",
	"&csup;",
	"&csupe;",
	"&ctdot;",
	"&cudarrl;",
	"&cudarrr;",
	"&cuepr;",
	"&cuesc;",
	"&cularr;",
	"&cularrp;",
	"&Cup;",
	"&cup;",
	"&cupbrcap;",
	"&CupCap;",
	"&cupcap;",
	"&cupcup;",
	"&cupdot;",
	"&cupor;",
	"&cups;",
	"&curarr;",
	"&curarrm;",
	"&curlyeqprec;",
	"&curlyeqsucc;",
	"&curlyvee;",
	"&curlywedge;",
	"&curren",
	"&curren;",
	"&curvearrowleft;",
	"&curvearrowright;",
	"&cuvee;",
	"&cuwed;",
	"&cwconint;",
	"&cwint;",
	"&cylcty;",
	"&Dagger;",
	"&dagger;",
	"&daleth;",
	"&Darr;",
	"&dArr;",
	"&darr;",
	"&dash;",
	"&Dashv;",
	"&dashv;",
	"&dbkarow;",
	"&dblac;",
	"&Dcaron;",
	"&dcaron;",
	"&Dcy;",
	"&dcy;",
	"&DD;",
	"&dd;",
	"&ddagger;",
	"&ddarr;",
	"&DDotrahd;",
	"&ddotseq;",
	"&deg",
	"&deg;",
	"&Del;",
	"&Delta;",
	"&delta;",
	"&demptyv;",
	"&dfisht;",
	"&Dfr;",
	"&dfr;",
	"&dHar;",
	"&dharl;",
	"&dharr;",
	"&DiacriticalAcute;",
	"&DiacriticalDot;",
	"&DiacriticalDoubleAcute;",
	"&DiacriticalGrave;",
	"&DiacriticalTilde;",
	"&diam;",
	"&Diamond;",
	"&diamond;",
	"&diamondsuit;",
	"&diams;",
	"&die;",
	"&DifferentialD;",
	"&digamma;",
	"&disin;",
	"&div;",
	"&divide",
	"&divide;",
	"&divideontimes;",
	"&divonx;",
	"&DJcy;",
	"&djcy;",
	"&dlcorn;",
	"&dlcrop;",
	"&dollar;",
	"&Dopf;",
	"&dopf;",
	"&Dot;",
	"&dot;",
	"&DotDot;",
	"&doteq;",
	"&doteqdot;",
	"&DotEqual;",
	"&dotminus;",
	"&dotplus;",
	"&dotsquare;",
	"&doublebarwedge;",
	"&DoubleContourIntegral;",
	"&DoubleDot;",
	"&DoubleDownArrow;",
	"&DoubleLeftArrow;",
	"&DoubleLeftRightArrow;",
	"&DoubleLeftTee;",
	"&DoubleLongLeftArrow;",
	"&DoubleLongLeftRightArrow;",
	"&DoubleLongRightArrow;",
	"&DoubleRightArrow;",
	"&DoubleRightTee;",
	"&DoubleUpArrow;",
	"&DoubleUpDownArrow;",
	"&DoubleVerticalBar;",
	"&DownArrow;",
	"&Downarrow;",
	"&downarrow;",
	"&DownArrowBar;",
	"&DownArrowUpArrow;",
	"&DownBreve;",
	"&downdownarrows;",
	"&downharpoonleft;",
	"&downharpoonright;",
	"&DownLeftRightVector;",
	"&DownLeftTeeVector;",
	"&DownLeftVector;",
	"&DownLeftVectorBar;",
	"&DownRightTeeVector;",
	"&DownRightVector;",
	"&DownRightVectorBar;",
	"&DownTee;",
	"&DownTeeArrow;",
	"&drbkarow;",
	"&drcorn;",
	"&drcrop;",
	"&Dscr;",
	"&dscr;",
	"&DScy;",
	"&dscy;",
	"&dsol;",
	"&Dstrok;",
	"&dstrok;",
	"&dtdot;",
	"&dtri;",
	"&dtrif;",
	"&duarr;",
	"&duhar;",
	"&dwangle;",
	"&DZcy;",
	"&dzcy;",
	"&dzigrarr;",
	"&Eacute",
	"&eacute",
	"&Eacute;",
	"&eacute;",
	"&easter;",
	"&Ecaron;",
	"&ecaron;",
	"&ecir;",
	"&Ecirc",
	"&ecirc",
	"&Ecirc;",
	"&ecirc;",
	"&ecolon;",
	"&Ecy;",
	"&ecy;",
	"&eDDot;",
	"&Edot;",
	"&eDot;",
	"&edot;",
	"&ee;",
	"&efDot;",
	"&Efr;",
	"&efr;",
	"&eg;",
	"&Egrave",
	"&egrave",
	"&Egrave;",
	"&egrave;",
	"&egs;",
	"&egsdot;",
	"&el;",
	"&Element;",
	"&elinters;",
	"&ell;",
	"&els;",
	"&elsdot;",
	"&Emacr;",
	"&emacr;",
	"&empty;",
	"&emptyset;",
	"&EmptySmallSquare;",
	"&emptyv;",
	"&EmptyVerySmallSquare;",
	"&emsp13;",
	"&emsp14;",
	"&emsp;",
	"&ENG;",
	"&eng;",
	"&ensp;",
	"&Eogon;",
	"&eogon;",
	"&Eopf;",
	"&eopf;",
	"&epar;",
	"&eparsl;",
	"&eplus;",
	"&epsi;",
	"&Epsilon;",
	"&epsilon;",
	"&epsiv;",
	"&eqcirc;",
	"&eqcolon;",
	"&eqsim;",
	"&eqslantgtr;",
	"&eqslantless;",
	"&Equal;",
	"&equals;",
	"&EqualTilde;",
	"&equest;",
	"&Equilibrium;",
	"&equiv;",
	"&equivDD;",
	"&eqvparsl;",
	"&erarr;",
	"&erDot;",
	"&Escr;",
	"&escr;",
	"&esdot;",
	"&Esim;",
	"&esim;",
	"&Eta;",
	"&eta;",
	"&ETH",
	"&eth",
	"&ETH;",
	"&eth;",
	"&Euml",
	"&euml",
	"&Euml;",
	"&euml;",
	"&euro;",
	"&excl;",
	"&exist;",
	"&Exists;",
	"&expectation;",
	"&ExponentialE;",
	"&exponentiale;",
	"&fallingdotseq;",
	"&Fcy;",
	"&fcy;",
	"&female;",
	"&ffilig;",
	"&fflig;",
	"&ffllig;",
	"&Ffr;",
	"&ffr;",
	"&filig;",
	"&FilledSmallSquare;",
	"&FilledVerySmallSquare;",
	"&fjlig;",
	"&flat;",
	"&fllig;",
	"&fltns;",
	"&fnof;",
	"&Fopf;",
	"&fopf;",
	"&ForAll;",
	"&forall;",
	"&fork;",
	"&forkv;",
	"&Fouriertrf;",
	"&fpartint;",
	"&frac12",
	"&frac12;",
	"&frac13;",
	"&frac14",
	"&frac14;",
	"&frac15;",
	"&frac16;",
	"&frac18;",
	"&frac23;",
	"&frac25;",
	"&frac34",
	"&frac34;",
	"&frac35;",
	"&frac38;",
	"&frac45;",
	"&frac56;",
	"&frac58;",
	"&frac78;",
	"&frasl;",
	"&frown;",
	"&Fscr;",
	"&fscr;",
	"&gacute;",
	"&Gamma;",
	"&gamma;",
	"&Gammad;",
	"&gammad;",
	"&gap;",
	"&Gbreve;",
	"&gbreve;",
	"&Gcedil;",
	"&Gcirc;",
	"&gcirc;",
	"&Gcy;",
	"&gcy;",
	"&Gdot;",
	"&gdot;",
	"&gE;",
	"&ge;",
	"&gEl;",
	"&gel;",
	"&geq;",
	"&geqq;",
	"&geqslant;",
	"&ges;",
	"&gescc;",
	"&gesdot;",
	"&gesdoto;",
	"&gesdotol;",
	"&gesl;",
	"&gesles;",
	"&Gfr;",
	"&gfr;",
	"&Gg;",
	"&gg;",
	"&ggg;",
	"&gimel;",
	"&GJcy;",
	"&gjcy;",
	"&gl;",
	"&gla;",
	"&glE;",
	"&glj;",
	"&gnap;",
	"&gnapprox;",
	"&gnE;",
	"&gne;",
	"&gneq;",
	"&gneqq;",
	"&gnsim;",
	"&Gopf;",
	"&gopf;",
	"&grave;",
	"&GreaterEqual;",
	"&GreaterEqualLess;",
	"&GreaterFullEqual;",
	"&GreaterGreater;",
	"&GreaterLess;",
	"&GreaterSlantEqual;",
	"&GreaterTilde;",
	"&Gscr;",
	"&gscr;",
	"&gsim;",
	"&gsime;",
	"&gsiml;",
	"&GT",
	"&gt",
	"&GT;",
	"&Gt;",
	"&gt;",
	"&gtcc;",
	"&gtcir;",
	"&gtdot;",
	"&gtlPar;",
	"&gtquest;",
	"&gtrapprox;",
	"&gtrarr;",
	"&gtrdot;",
	"&gtreqless;",
	"&gtreqqless;",
	"&gtrless;",
	"&gtrsim;",
	"&gvertneqq;",
	"&gvnE;",
	"&Hacek;",
	"&hairsp;",
	"&half;",
	"&hamilt;",
	"&HARDcy;",
	"&hardcy;",
	"&hArr;",
	"&harr;",
	"&harrcir;",
	"&harrw;",
	"&Hat;",
	"&hbar;",
	"&Hcirc;",
	"&hcirc;",
	"&hearts;",
	"&heartsuit;",
	"&hellip;",
	"&hercon;",
	"&Hfr;",
	"&hfr;",
	"&HilbertSpace;",
	"&hksearow;",
	"&hkswarow;",
	"&hoarr;",
	"&homtht;",
	"&hookleftarrow;",
	"&hookrightarrow;",
	"&Hopf;",
	"&hopf;",
	"&horbar;",
	"&HorizontalLine;",
	"&Hscr;",
	"&hscr;",
	"&hslash;",
	"&Hstrok;",
	"&hstrok;",
	"&HumpDownHump;",
	"&HumpEqual;",
	"&hybull;",
	"&hyphen;",
	"&Iacute",
	"&iacute",
	"&Iacute;",
	"&iacute;",
	"&ic;",
	"&Icirc",
	"&icirc",
	"&Icirc;",
	"&icirc;",
	"&Icy;",
	"&icy;",
	"&Idot;",
	"&IEcy;",
	"&iecy;",
	"&iexcl",
	"&iexcl;",
	"&iff;",
	"&Ifr;",
	"&ifr;",
	"&Igrave",
	"&igrave",
	"&Igrave;",
	"&igrave;",
	"&ii;",
	"&iiiint;",
	"&iiint;",
	"&iinfin;",
	"&iiota;",
	"&IJlig;",
	"&ijlig;",
	"&Im;",
	"&Imacr;",
	"&imacr;",
	"&image;",
	"&ImaginaryI;",
	"&imagline;",
	"&imagpart;",
	"&imath;",
	"&imof;",
	"&imped;",
	"&Implies;",
	"&in;",
	"&incare;",
	"&infin;",
	"&infintie;",
	"&inodot;",
	"&Int;",
	"&int;",
	"&intcal;",
	"&integers;",
	"&Integral;",
	"&intercal;",
	"&Intersection;",
	"&intlarhk;",
	"&intprod;",
	"&InvisibleComma;",
	"&InvisibleTimes;",
	"&IOcy;",
	"&iocy;",
	"&Iogon;",
	"&iogon;",
	"&Iopf;",
	"&iopf;",
	"&Iota;",
	"&iota;",
	"&iprod;",
	"&iquest",
	"&iquest;",
	"&Iscr;",
	"&iscr;",
	"&isin;",
	"&isindot;",
	"&isinE;",
	"&isins;",
	"&isinsv;",
	"&isinv;",
	"&it;",
	"&Itilde;",
	"&itilde;",
	"&Iukcy;",
	"&iukcy;",
	"&Iuml",
	"&iuml",
	"&Iuml;",
	"&iuml;",
	"&Jcirc;",
	"&jcirc;",
	"&Jcy;",
	"&jcy;",
	"&Jfr;",
	"&jfr;",
	"&jmath;",
	"&Jopf;",
	"&jopf;",
	"&Jscr;",
	"&jscr;",
	"&Jsercy;",
	"&jsercy;",
	"&Jukcy;",
	"&jukcy;",
	"&Kappa;",
	"&kappa;",
	"&kappav;",
	"&Kcedil;",
	"&kcedil;",
	"&Kcy;",
	"&kcy;",
	"&Kfr;",
	"&kfr;",
	"&kgreen;",
	"&KHcy;",
	"&khcy;",
	"&KJcy;",
	"&kjcy;",
	"&Kopf;",
	"&kopf;",
	"&Kscr;",
	"&kscr;",
	"&lAarr;",
	"&Lacute;",
	"&lacute;",
	"&laemptyv;",
	"&lagran;",
	"&Lambda;",
	"&lambda;",
	"&Lang;",
	"&lang;",
	"&langd;",
	"&langle;",
	"&lap;",
	"&Laplacetrf;",
	"&laquo",
	"&laquo;",
	"&Larr;",
	"&lArr;",
	"&larr;",
	"&larrb;",
	"&larrbfs;",
	"&larrfs;",
	"&larrhk;",
	"&larrlp;",
	"&larrpl;",
	"&larrsim;",
	"&larrtl;",
	"&lat;",
	"&lAtail;",
	"&latail;",
	"&late;",
	"&lates;",
	"&lBarr;",
	"&lbarr;",
	"&lbbrk;",
	"&lbrace;",
	"&lbrack;",
	"&lbrke;",
	"&lbrksld;",
	"&lbrkslu;",
	"&Lcaron;",
	"&lcaron;",
	"&Lcedil;",
	"&lcedil;",
	"&lceil;",
	"&lcub;",
	"&Lcy;",
	"&lcy;",
	"&ldca;",
	"&ldquo;",
	"&ldquor;",
	"&ldrdhar;",
	"&ldrushar;",
	"&ldsh;",
	"&lE;",
	"&le;",
	"&LeftAngleBracket;",
	"&LeftArrow;",
	"&Leftarrow;",
	"&leftarrow;",
	"&LeftArrowBar;",
	"&LeftArrowRightArrow;",
	"&leftarrowtail;",
	"&LeftCeiling;",
	"&LeftDoubleBracket;",
	"&LeftDownTeeVector;",
	"&LeftDownVector;",
	"&LeftDownVectorBar;",
	"&LeftFloor;",
	"&leftharpoondown;",
	"&leftharpoonup;",
	"&leftleftarrows;",
	"&LeftRightArrow;",
	"&Leftrightarrow;",
	"&leftrightarrow;",
	"&leftrightarrows;",
	"&leftrightharpoons;",
	"&leftrightsquigarrow;",
	"&LeftRightVector;",
	"&LeftTee;",
	"&LeftTeeArrow;",
	"&LeftTeeVector;",
	"&leftthreetimes;",
	"&LeftTriangle;",
	"&LeftTriangleBar;",
	"&LeftTriangleEqual;",
	"&LeftUpDownVector;",
	"&LeftUpTeeVector;",
	"&LeftUpVector;",
	"&LeftUpVectorBar;",
	"&LeftVector;",
	"&LeftVectorBar;",
	"&lEg;",
	"&leg;",
	"&leq;",
	"&leqq;",
	"&leqslant;",
	"&les;",
	"&lescc;",
	"&lesdot;",
	"&lesdoto;",
	"&lesdotor;",
	"&lesg;",
	"&lesges;",
	"&lessapprox;",
	"&lessdot;",
	"&lesseqgtr;",
	"&lesseqqgtr;",
	"&LessEqualGreater;",
	"&LessFullEqual;",
	"&LessGreater;",
	"&lessgtr;",
	"&LessLess;",
	"&lesssim;",
	"&LessSlantEqual;",
	"&LessTilde;",
	"&lfisht;",
	"&lfloor;",
	"&Lfr;",
	"&lfr;",
	"&lg;",
	"&lgE;",
	"&lHar;",
	"&lhard;",
	"&lharu;",
	"&lharul;",
	"&lhblk;",
	"&LJcy;",
	"&ljcy;",
	"&Ll;",
	"&ll;",
	"&llarr;",
	"&llcorner;",
	"&Lleftarrow;",
	"&llhard;",
	"&lltri;",
	"&Lmidot;",
	"&lmidot;",
	"&lmoust;",
	"&lmoustache;",
	"&lnap;",
	"&lnapprox;",
	"&lnE;",
	"&lne;",
	"&lneq;",
	"&lneqq;",
	"&lnsim;",
	"&loang;",
	"&loarr;",
	"&lobrk;",
	"&LongLeftArrow;",
	"&Longleftarrow;",
	"&longleftarrow;",
	"&LongLeftRightArrow;",
	"&Longleftrightarrow;",
	"&longleftrightarrow;",
	"&longmapsto;",
	"&LongRightArrow;",
	"&Longrightarrow;",
	"&longrightarrow;",
	"&looparrowleft;",
	"&looparrowright;",
	"&lopar;",
	"&Lopf;",
	"&lopf;",
	"&loplus;",
	"&lotimes;",
	"&lowast;",
	"&lowbar;",
	"&LowerLeftArrow;",
	"&LowerRightArrow;",
	"&loz;",
	"&lozenge;",
	"&lozf;",
	"&lpar;",
	"&lparlt;",
	"&lrarr;",
	"&lrcorner;",
	"&lrhar;",
	"&lrhard;",
	"&lrm;",
	"&lrtri;",
	"&lsaquo;",
	"&Lscr;",
	"&lscr;",
	"&Lsh;",
	"&lsh;",
	"&lsim;",
	"&lsime;",
	"&lsimg;",
	"&lsqb;",
	"&lsquo;",
	"&lsquor;",
	"&Lstrok;",
	"&lstrok;",
	"&LT",
	"&lt",
	"&LT;",
	"&Lt;",
	"&lt;",
	"&ltcc;",
	"&ltcir;",
	"&ltdot;",
	"&lthree;",
	"&ltimes;",
	"&ltlarr;",
	"&ltquest;",
	"&ltri;",
	"&ltrie;",
	"&ltrif;",
	"&ltrPar;",
	"&lurdshar;",
	"&luruhar;",
	"&lvertneqq;",
	"&lvnE;",
	"&macr",
	"&macr;",
	"&male;",
	"&malt;",
	"&maltese;",
	"&Map;",
	"&map;",
	"&mapsto;",
	"&mapstodown;",
	"&mapstoleft;",
	"&mapstoup;",
	"&marker;",
	"&mcomma;",
	"&Mcy;",
	"&mcy;",
	"&mdash;",
	"&mDDot;",
	"&measuredangle;",
	"&MediumSpace;",
	"&Mellintrf;",
	"&Mfr;",
	"&mfr;",
	"&mho;",
	"&micro",
	"&micro;",
	"&mid;",
	"&midast;",
	"&midcir;",
	"&middot",
	"&middot;",
	"&minus;",
	"&minusb;",
	"&minusd;",
	"&minusdu;",
	"&MinusPlus;",
	"&mlcp;",
	"&mldr;",
	"&mnplus;",
	"&models;",
	"&Mopf;",
	"&mopf;",
	"&mp;",
	"&Mscr;",
	"&mscr;",
	"&mstpos;",
	"&Mu;",
	"&mu;",
	"&multimap;",
	"&mumap;",
	"&nabla;",
	"&Nacute;",
	"&nacute;",
	"&nang;",
	"&nap;",
	"&napE;",
	"&napid;",
	"&napos;",
	"&napprox;",
	"&natur;",
	"&natural;",
	"&naturals;",
	"&nbsp",
	"&nbsp;",
	"&nbump;",
	"&nbumpe;",
	"&ncap;",
	"&Ncaron;",
	"&ncaron;",
	"&Ncedil;",
	"&ncedil;",
	"&ncong;",
	"&ncongdot;",
	"&ncup;",
	"&Ncy;",
	"&ncy;",
	"&ndash;",
	"&ne;",
	"&nearhk;",
	"&neArr;",
	"&nearr;",
	"&nearrow;",
	"&nedot;",
	"&NegativeMediumSpace;",
	"&NegativeThickSpace;",
	"&NegativeThinSpace;",
	"&NegativeVeryThinSpace;",
	"&nequiv;",
	"&nesear;",
	"&nesim;",
	"&NestedGreaterGreater;",
	"&NestedLessLess;",
	"&NewLine;",
	"&nexist;",
	"&nexists;",
	"&Nfr;",
	"&nfr;",
	"&ngE;",
	"&nge;",
	"&ngeq;",
	"&ngeqq;",
	"&ngeqslant;",
	"&nges;",
	"&nGg;",
	"&ngsim;",
	"&nGt;",
	"&ngt;",
	"&ngtr;",
	"&nGtv;",
	"&nhArr;",
	"&nharr;",
	"&nhpar;",
	"&ni;",
	"&nis;",
	"&nisd;",
	"&niv;",
	"&NJcy;",
	"&njcy;",
	"&nlArr;",
	"&nlarr;",
	"&nldr;",
	"&nlE;",
	"&nle;",
	"&nLeftarrow;",
	"&nleftarrow;",
	"&nLeftrightarrow;",
	"&nleftrightarrow;",
	"&nleq;",
	"&nleqq;",
	"&nleqslant;",
	"&nles;",
	"&nless;",
	"&nLl;",
	"&nlsim;",
	"&nLt;",
	"&nlt;",
	"&nltri;",
	"&nltrie;",
	"&nLtv;",
	"&nmid;",
	"&NoBreak;",
	"&NonBreakingSpace;",
	"&Nopf;",
	"&nopf;",
	"&not",
	"&Not;",
	"&not;",
	"&NotCongruent;",
	"&NotCupCap;",
	"&NotDoubleVerticalBar;",
	"&NotElement;",
	"&NotEqual;",
	"&NotEqualTilde;",
	"&NotExists;",
	"&NotGreater;",
	"&NotGreaterEqual;",
	"&NotGreaterFullEqual;",
	"&NotGreaterGreater;",
	"&NotGreaterLess;",
	"&NotGreaterSlantEqual;",
	"&NotGreaterTilde;",
	"&NotHumpDownHump;",
	"&NotHumpEqual;",
	"&notin;",
	"&notindot;",
	"&notinE;",
	"&notinva;",
	"&notinvb;",
	"&notinvc;",
	"&NotLeftTriangle;",
	"&NotLeftTriangleBar;",
	"&NotLeftTriangleEqual;",
	"&NotLess;",
	"&NotLessEqual;",
	"&NotLessGreater;",
	"&NotLessLess;",
	"&NotLessSlantEqual;",
	"&NotLessTilde;",
	"&NotNestedGreaterGreater;",
	"&NotNestedLessLess;",
	"&notni;",
	"&notniva;",
	"&notnivb;",
	"&notnivc;",
	"&NotPrecedes;",
	"&NotPrecedesEqual;",
	"&NotPrecedesSlantEqual;",
	"&NotReverseElement;",
	"&NotRightTriangle;",
	"&NotRightTriangleBar;",
	"&NotRightTriangleEqual;",
	"&NotSquareSubset;",
	"&NotSquareSubsetEqual;",
	"&NotSquareSuperset;",
	"&NotSquareSupersetEqual;",
	"&NotSubset;",
	"&NotSubsetEqual;",
	"&NotSucceeds;",
	"&NotSucceedsEqual;",
	"&NotSucceedsSlantEqual;",
	"&NotSucceedsTilde;",
	"&NotSuperset;",
	"&NotSupersetEqual;",
	"&NotTilde;",
	"&NotTildeEqual;",
	"&NotTildeFullEqual;",
	"&NotTildeTilde;",
	"&NotVerticalBar;",
	"&npar;",
	"&nparallel;",
	"&nparsl;",
	"&npart;",
	"&npolint;",
	"&npr;",
	"&nprcue;",
	"&npre;",
	"&nprec;",
	"&npreceq;",
	"&nrArr;",
	"&nrarr;",
	"&nrarrc;",
	"&nrarrw;",
	"&nRightarrow;",
	"&nrightarrow;",
	"&nrtri;",
	"&nrtrie;",
	"&nsc;",
	"&nsccue;",
	"&nsce;",
	"&Nscr;",
	"&nscr;",
	"&nshortmid;",
	"&nshortparallel;",
	"&nsim;",
	"&nsime;",
	"&nsimeq;",
	"&nsmid;",
	"&nspar;",
	"&nsqsube;",
	"&nsqsupe;",
	"&nsub;",
	"&nsubE;",
	"&nsube;",
	"&nsubset;",
	"&nsubseteq;",
	"&nsubseteqq;",
	"&nsucc;",
	"&nsucceq;",
	"&nsup;",
	"&nsupE;",
	"&nsupe;",
	"&nsupset;",
	"&nsupseteq;",
	"&nsupseteqq;",
	"&ntgl;",
	"&Ntilde",
	"&ntilde",
	"&Ntilde;",
	"&ntilde;",
	"&ntlg;",
	"&ntriangleleft;",
	"&ntrianglelefteq;",
	"&ntriangleright;",
	"&ntrianglerighteq;",
	"&Nu;",
	"&nu;",
	"&num;",
	"&numero;",
	"&numsp;",
	"&nvap;",
	"&nVDash;",
	"&nVdash;",
	"&nvDash;",
	"&nvdash;",
	"&nvge;",
	"&nvgt;",
	"&nvHarr;",
	"&nvinfin;",
	"&nvlArr;",
	"&nvle;",
	"&nvlt;",
	"&nvltrie;",
	"&nvrArr;",
	"&nvrtrie;",
	"&nvsim;",
	"&nwarhk;",
	"&nwArr;",
	"&nwarr;",
	"&nwarrow;",
	"&nwnear;",
	"&Oacute",
	"&oacute",
	"&Oacute;",
	"&oacute;",
	"&oast;",
	"&ocir;",
	"&Ocirc",
	"&ocirc",
	"&Ocirc;",
	"&ocirc;",
	"&Ocy;",
	"&ocy;",
	"&odash;",
	"&Odblac;",
	"&odblac;",
	"&odiv;",
	"&odot;",
	"&odsold;",
	"&OElig;",
	"&oelig;",
	"&ofcir;",
	"&Ofr;",
	"&ofr;",
	"&ogon;",
	"&Ograve",
	"&ograve",
	"&Ograve;",
	"&ograve;",
	"&ogt;",
	"&ohbar;",
	"&ohm;",
	"&oint;",
	"&olarr;",
	"&olcir;",
	"&olcross;",
	"&oline;",
	"&olt;",
	"&Omacr;",
	"&omacr;",
	"&Omega;",
	"&omega;",
	"&Omicron;",
	"&omicron;",
	"&omid;",
	"&ominus;",
	"&Oopf;",
	"&oopf;",
	"&opar;",
	"&OpenCurlyDoubleQuote;",
	"&OpenCurlyQuote;",
	"&operp;",
	"&oplus;",
	"&Or;",
	"&or;",
	"&orarr;",
	"&ord;",
	"&order;",
	"&orderof;",
	"&ordf",
	"&ordf;",
	"&ordm",
	"&ordm;",
	"&origof;",
	"&oror;",
	"&orslope;",
	"&orv;",
	"&oS;",
	"&Oscr;",
	"&oscr;",
	"&Oslash",
	"&oslash",
	"&Oslash;",
	"&oslash;",
	"&osol;",
	"&Otilde",
	"&otilde",
	"&Otilde;",
	"&otilde;",
	"&Otimes;",
	"&otimes;",
	"&otimesas;",
	"&Ouml",
	"&ouml",
	"&Ouml;",
	"&ouml;",
	"&ovbar;",
	"&OverBar;",
	"&OverBrace;",
	"&OverBracket;",
	"&OverParenthesis;",
	"&par;",
	"&para",
	"&para;",
	"&parallel;",
	"&parsim;",
	"&parsl;",
	"&part;",
	"&PartialD;",
	"&Pcy;",
	"&pcy;",
	"&percnt;",
	"&period;",
	"&permil;",
	"&perp;",
	"&pertenk;",
	"&Pfr;",
	"&pfr;",
	"&Phi;",
	"&phi;",
	"&phiv;",
	"&phmmat;",
	"&phone;",
	"&Pi;",
	"&pi;",
	"&pitchfork;",
	"&piv;",
	"&planck;",
	"&planckh;",
	"&plankv;",
	"&plus;",
	"&plusacir;",
	"&plusb;",
	"&pluscir;",
	"&plusdo;",
	"&plusdu;",
	"&pluse;",
	"&PlusMinus;",
	"&plusmn",
	"&plusmn;",
	"&plussim;",
	"&plustwo;",
	"&pm;",
	"&Poincareplane;",
	"&pointint;",
	"&Popf;",
	"&popf;",
	"&pound",
	"&pound;",
	"&Pr;",
	"&pr;",
	"&prap;",
	"&prcue;",
	"&prE;",
	"&pre;",
	"&prec;",
	"&precapprox;",
	"&preccurlyeq;",
	"&Precedes;",
	"&PrecedesEqual;",
	"&PrecedesSlantEqual;",
	"&PrecedesTilde;",
	"&preceq;",
	"&precnapprox;",
	"&precneqq;",
	"&precnsim;",
	"&precsim;",
	"&Prime;",
	"&prime;",
	"&primes;",
	"&prnap;",
	"&prnE;",
	"&prnsim;",
	"&prod;",
	"&Product;",
	"&profalar;",
	"&profline;",
	"&profsurf;",
	"&prop;",
	"&Proportion;",
	"&Proportional;",
	"&propto;",
	"&prsim;",
	"&prurel;",
	"&Pscr;",
	"&pscr;",
	"&Psi;",
	"&psi;",
	"&puncsp;",
	"&Qfr;",
	"&qfr;",
	"&qint;",
	"&Qopf;",
	"&qopf;",
	"&qprime;",
	"&Qscr;",
	"&qscr;",
	"&quaternions;",
	"&quatint;",
	"&quest;",
	"&questeq;",
	"&QUOT",
	"&quot",
	"&QUOT;",
	"&quot;",
	"&rAarr;",
	"&race;",
	"&Racute;",
	"&racute;",
	"&radic;",
	"&raemptyv;",
	"&Rang;",
	"&rang;",
	"&rangd;",
	"&range;",
	"&rangle;",
	"&raquo",
	"&raquo;",
	"&Rarr;",
	"&rArr;",
	"&rarr;",
	"&rarrap;",
	"&rarrb;",
	"&rarrbfs;",
	"&rarrc;",
	"&rarrfs;",
	"&rarrhk;",
	"&rarrlp;",
	"&rarrpl;",
	"&rarrsim;",
	"&Rarrtl;",
	"&rarrtl;",
	"&rarrw;",
	"&rAtail;",
	"&ratail;",
	"&ratio;",
	"&rationals;",
	"&RBarr;",
	"&rBarr;",
	"&rbarr;",
	"&rbbrk;",
	"&rbrace;",
	"&rbrack;",
	"&rbrke;",
	"&rbrksld;",
	"&rbrkslu;",
	"&Rcaron;",
	"&rcaron;",
	"&Rcedil;",
	"&rcedil;",
	"&rceil;",
	"&rcub;",
	"&Rcy;",
	"&rcy;",
	"&rdca;",
	"&rdldhar;",
	"&rdquo;",
	"&rdquor;",
	"&rdsh;",
	"&Re;",
	"&real;",
	"&realine;",
	"&realpart;",
	"&reals;",
	"&rect;",
	"&REG",
	"&reg",
	"&REG;",
	"&reg;",
	"&ReverseElement;",
	"&ReverseEquilibrium;",
	"&ReverseUpEquilibrium;",
	"&rfisht;",
	"&rfloor;",
	"&Rfr;",
	"&rfr;",
	"&rHar;",
	"&rhard;",
	"&rharu;",
	"&rharul;",
	"&Rho;",
	"&rho;",
	"&rhov;",
	"&RightAngleBracket;",
	"&RightArrow;",
	"&Rightarrow;",
	"&rightarrow;",
	"&RightArrowBar;",
	"&RightArrowLeftArrow;",
	"&rightarrowtail;",
	"&RightCeiling;",
	"&RightDoubleBracket;",
	"&RightDownTeeVector;",
	"&RightDownVector;",
	"&RightDownVectorBar;",
	"&RightFloor;",
	"&rightharpoondown;",
	"&rightharpoonup;",
	"&rightleftarrows;",
	"&rightleftharpoons;",
	"&rightrightarrows;",
	"&rightsquigarrow;",
	"&RightTee;",
	"&RightTeeArrow;",
	"&RightTeeVector;",
	"&rightthreetimes;",
	"&RightTriangle;",
	"&RightTriangleBar;",
	"&RightTriangleEqual;",
	"&RightUpDownVector;",
	"&RightUpTeeVector;",
	"&RightUpVector;",
	"&RightUpVectorBar;",
	"&RightVector;",
	"&RightVectorBar;",
	"&ring;",
	"&risingdotseq;",
	"&rlarr;",
	"&rlhar;",
	"&rlm;",
	"&rmoust;",
	"&rmoustache;",
	"&rnmid;",
	"&roang;",
	"&roarr;",
	"&robrk;",
	"&ropar;",
	"&Ropf;",
	"&ropf;",
	"&roplus;",
	"&rotimes;",
	"&RoundImplies;",
	"&rpar;",
	"&rpargt;",
	"&rppolint;",
	"&rrarr;",
	"&Rrightarrow;",
	"&rsaquo;",
	"&Rscr;",
	"&rscr;",
	"&Rsh;",
	"&rsh;",
	"&rsqb;",
	"&rsquo;",
	"&rsquor;",
	"&rthree;",
	"&rtimes;",
	"&rtri;",
	"&rtrie;",
	"&rtrif;",
	"&rtriltri;",
	"&RuleDelayed;",
	"&ruluhar;",
	"&rx;",
	"&Sacute;",
	"&sacute;",
	"&sbquo;",
	"&Sc;",
	"&sc;",
	"&scap;",
	"&Scaron;",
	"&scaron;",
	"&sccue;",
	"&scE;",
	"&sce;",
	"&Scedil;",
	"&scedil;",
	"&Scirc;",
	"&scirc;",
	"&scnap;",
	"&scnE;",
	"&scnsim;",
	"&scpolint;",
	"&scsim;",
	"&Scy;",
	"&scy;",
	"&sdot;",
	"&sdotb;",
	"&sdote;",
	"&searhk;",
	"&seArr;",
	"&searr;",
	"&searrow;",
	"&sect",
	"&sect;",
	"&semi;",
	"&seswar;",
	"&setminus;",
	"&setmn;",
	"&sext;",
	"&Sfr;",
	"&sfr;",
	"&sfrown;",
	"&sharp;",
	"&SHCHcy;",
	"&shchcy;",
	"&SHcy;",
	"&shcy;",
	"&ShortDownArrow;",
	"&ShortLeftArrow;",
	"&shortmid;",
	"&shortparallel;",
	"&ShortRightArrow;",
	"&ShortUpArrow;",
	"&shy",
	"&shy;",
	"&Sigma;",
	"&sigma;",
	"&sigmaf;",
	"&sigmav;",
	"&sim;",
	"&simdot;",
	"&sime;",
	"&simeq;",
	"&simg;",
	"&simgE;",
	"&siml;",
	"&simlE;",
	"&simne;",
	"&simplus;",
	"&simrarr;",
	"&slarr;",
	"&SmallCircle;",
	"&smallsetminus;",
	"&smashp;",
	"&smeparsl;",
	"&smid;",
	"&smile;",
	"&smt;",
	"&smte;",
	"&smtes;",
	"&SOFTcy;",
	"&softcy;",
	"&sol;",
	"&solb;",
	"&solbar;",
	"&Sopf;",
	"&sopf;",
	"&spades;",
	"&spadesuit;",
	"&spar;",
	"&sqcap;",
	"&sqcaps;",
	"&sqcup;",
	"&sqcups;",
	"&Sqrt;",
	"&sqsub;",
	"&sqsube;",
	"&sqsubset;",
	"&sqsubseteq;",
	"&sqsup;",
	"&sqsupe;",
	"&sqsupset;",
	"&sqsupseteq;",
	"&squ;",
	"&Square;",
	"&square;",
	"&SquareIntersection;",
	"&SquareSubset;",
	"&SquareSubsetEqual;",
	"&SquareSuperset;",
	"&SquareSupersetEqual;",
	"&SquareUnion;",
	"&squarf;",
	"&squf;",
	"&srarr;",
	"&Sscr;",
	"&sscr;",
	"&ssetmn;",
	"&ssmile;",
	"&sstarf;",
	"&Star;",
	"&star;",
	"&starf;",
	"&straightepsilon;",
	"&straightphi;",
	"&strns;",
	"&Sub;",
	"&sub;",
	"&subdot;",
	"&subE;",
	"&sube;",
	"&subedot;",
	"&submult;",
	"&subnE;",
	"&subne;",
	"&subplus;",
	"&subrarr;",
	"&Subset;",
	"&subset;",
	"&subseteq;",
	"&subseteqq;",
	"&SubsetEqual;",
	"&subsetneq;",
	"&subsetneqq;",
	"&subsim;",
	"&subsub;",
	"&subsup;",
	"&succ;",
	"&succapprox;",
	"&succcurlyeq;",
	"&Succeeds;",
	"&SucceedsEqual;",
	"&SucceedsSlantEqual;",
	"&SucceedsTilde;",
	"&succeq;",
	"&succnapprox;",
	"&succneqq;",
	"&succnsim;",
	"&succsim;",
	"&SuchThat;",
	"&Sum;",
	"&sum;",
	"&sung;",
	"&sup1",
	"&sup1;",
	"&sup2",
	"&sup2;",
	"&sup3",
	"&sup3;",
	"&Sup;",
	"&sup;",
	"&supdot;",
	"&supdsub;",
	"&supE;",
	"&supe;",
	"&supedot;",
	"&Superset;",
	"&SupersetEqual;",
	"&suphsol;",
	"&suphsub;",
	"&suplarr;",
	"&supmult;",
	"&supnE;",
	"&supne;",
	"&supplus;",
	"&Supset;",
	"&supset;",
	"&supseteq;",
	"&supseteqq;",
	"&supsetneq;",
	"&supsetneqq;",
	"&supsim;",
	"&supsub;",
	"&supsup;",
	"&swarhk;",
	"&swArr;",
	"&swarr;",
	"&swarrow;",
	"&swnwar;",
	"&szlig",
	"&szlig;",
	"&Tab;",
	"&target;",
	"&Tau;",
	"&tau;",
	"&tbrk;",
	"&Tcaron;",
	"&tcaron;",
	"&Tcedil;",
	"&tcedil;",
	"&Tcy;",
	"&tcy;",
	"&tdot;",
	"&telrec;",
	"&Tfr;",
	"&tfr;",
	"&there4;",
	"&Therefore;",
	"&therefore;",
	"&Theta;",
	"&theta;",
	"&thetasym;",
	"&thetav;",
	"&thickapprox;",
	"&thicksim;",
	"&ThickSpace;",
	"&thinsp;",
	"&ThinSpace;",
	"&thkap;",
	"&thksim;",
	"&THORN",
	"&thorn",
	"&THORN;",
	"&thorn;",
	"&Tilde;",
	"&tilde;",
	"&TildeEqual;",
	"&TildeFullEqual;",
	"&TildeTilde;",
	"&times",
	"&times;",
	"&timesb;",
	"&timesbar;",
	"&timesd;",
	"&tint;",
	"&toea;",
	"&top;",
	"&topbot;",
	"&topcir;",
	"&Topf;",
	"&topf;",
	"&topfork;",
	"&tosa;",
	"&tprime;",
	"&TRADE;",
	"&trade;",
	"&triangle;",
	"&triangledown;",
	"&triangleleft;",
	"&trianglelefteq;",
	"&triangleq;",
	"&triangleright;",
	"&trianglerighteq;",
	"&tridot;",
	"&trie;",
	"&triminus;",
	"&TripleDot;",
	"&triplus;",
	"&trisb;",
	"&tritime;",
	"&trpezium;",
	"&Tscr;",
	"&tscr;",
	"&TScy;",
	"&tscy;",
	"&TSHcy;",
	"&tshcy;",
	"&Tstrok;",
	"&tstrok;",
	"&twixt;",
	"&twoheadleftarrow;",
	"&twoheadrightarrow;",
	"&Uacute",
	"&uacute",
	"&Uacute;",
	"&uacute;",
	"&Uarr;",
	"&uArr;",
	"&uarr;",
	"&Uarrocir;",
	"&Ubrcy;",
	"&ubrcy;",
	"&Ubreve;",
	"&ubreve;",
	"&Ucirc",
	"&ucirc",
	"&Ucirc;",
	"&ucirc;",
	"&Ucy;",
	"&ucy;",
	"&udarr;",
	"&Udblac;",
	"&udblac;",
	"&udhar;",
	"&ufisht;",
	"&Ufr;",
	"&ufr;",
	"&Ugrave",
	"&ugrave",
	"&Ugrave;",
	"&ugrave;",
	"&uHar;",
	"&uharl;",
	"&uharr;",
	"&uhblk;",
	"&ulcorn;",
	"&ulcorner;",
	"&ulcrop;",
	"&ultri;",
	"&Umacr;",
	"&umacr;",
	"&uml",
	"&uml;",
	"&UnderBar;",
	"&UnderBrace;",
	"&UnderBracket;",
	"&UnderParenthesis;",
	"&Union;",
	"&UnionPlus;",
	"&Uogon;",
	"&uogon;",
	"&Uopf;",
	"&uopf;",
	"&UpArrow;",
	"&Uparrow;",
	"&uparrow;",
	"&UpArrowBar;",
	"&UpArrowDownArrow;",
	"&UpDownArrow;",
	"&Updownarrow;",
	"&updownarrow;",
	"&UpEquilibrium;",
	"&upharpoonleft;",
	"&upharpoonright;",
	"&uplus;",
	"&UpperLeftArrow;",
	"&UpperRightArrow;",
	"&Upsi;",
	"&upsi;",
	"&upsih;",
	"&Upsilon;",
	"&upsilon;",
	"&UpTee;",
	"&UpTeeArrow;",
	"&upuparrows;",
	"&urcorn;",
	"&urcorner;",
	"&urcrop;",
	"&Uring;",
	"&uring;",
	"&urtri;",
	"&Uscr;",
	"&uscr;",
	"&utdot;",
	"&Utilde;",
	"&utilde;",
	"&utri;",
	"&utrif;",
	"&uuarr;",
	"&Uuml",
	"&uuml",
	"&Uuml;",
	"&uuml;",
	"&uwangle;",
	"&vangrt;",
	"&varepsilon;",
	"&varkappa;",
	"&varnothing;",
	"&varphi;",
	"&varpi;",
	"&varpropto;",
	"&vArr;",
	"&varr;",
	"&varrho;",
	"&varsigma;",
	"&varsubsetneq;",
	"&varsubsetneqq;",
	"&varsupsetneq;",
	"&varsupsetneqq;",
	"&vartheta;",
	"&vartriangleleft;",
	"&vartriangleright;",
	"&Vbar;",
	"&vBar;",
	"&vBarv;",
	"&Vcy;",
	"&vcy;",
	"&VDash;",
	"&Vdash;",
	"&vDash;",
	"&vdash;",
	"&Vdashl;",
	"&Vee;",
	"&vee;",
	"&veebar;",
	"&veeeq;",
	"&vellip;",
	"&Verbar;",
	"&verbar;",
	"&Vert;",
	"&vert;",
	"&VerticalBar;",
	"&VerticalLine;",
	"&VerticalSeparator;",
	"&VerticalTilde;",
	"&VeryThinSpace;",
	"&Vfr;",
	"&vfr;",
	"&vltri;",
	"&vnsub;",
	"&vnsup;",
	"&Vopf;",
	"&vopf;",
	"&vprop;",
	"&vrtri;",
	"&Vscr;",
	"&vscr;",
	"&vsubnE;",
	"&vsubne;",
	"&vsupnE;",
	"&vsupne;",
	"&Vvdash;",
	"&vzigzag;",
	"&Wcirc;",
	"&wcirc;",
	"&wedbar;",
	"&Wedge;",
	"&wedge;",
	"&wedgeq;",
	"&weierp;",
	"&Wfr;",
	"&wfr;",
	"&Wopf;",
	"&wopf;",
	"&wp;",
	"&wr;",
	"&wreath;",
	"&Wscr;",
	"&wscr;",
	"&xcap;",
	"&xcirc;",
	"&xcup;",
	"&xdtri;",
	"&Xfr;",
	"&xfr;",
	"&xhArr;",
	"&xharr;",
	"&Xi;",
	"&xi;",
	"&xlArr;",
	"&xlarr;",
	"&xmap;",
	"&xnis;",
	"&xodot;",
	"&Xopf;",
	"&xopf;",
	"&xoplus;",
	"&xotime;",
	"&xrArr;",
	"&xrarr;",
	"&Xscr;",
	"&xscr;",
	"&xsqcup;",
	"&xuplus;",
	"&xutri;",
	"&xvee;",
	"&xwedge;",
	"&Yacute",
	"&yacute",
	"&Yacute;",
	"&yacute;",
	"&YAcy;",
	"&yacy;",
	"&Ycirc;",
	"&ycirc;",
	"&Ycy;",
	"&ycy;",
	"&yen",
	"&yen;",
	"&Yfr;",
	"&yfr;",
	"&YIcy;",
	"&yicy;",
	"&Yopf;",
	"&yopf;",
	"&Yscr;",
	"&yscr;",
	"&YUcy;",
	"&yucy;",
	"&yuml",
	"&Yuml;",
	"&yuml;",
	"&Zacute;",
	"&zacute;",
	"&Zcaron;",
	"&zcaron;",
	"&Zcy;",
	"&zcy;",
	"&Zdot;",
	"&zdot;",
	"&zeetrf;",
	"&ZeroWidthSpace;",
	"&Zeta;",
	"&zeta;",
	"&Zfr;",
	"&zfr;",
	"&ZHcy;",
	"&zhcy;",
	"&zigrarr;",
	"&Zopf;",
	"&zopf;",
	"&Zscr;",
	"&zscr;",
	"&zwj;",
	"&zwnj;"
];

exports.bundledElements = bundledElements;
exports.entities = entities;
exports.html5 = html5;
//# sourceMappingURL=elements.js.map
