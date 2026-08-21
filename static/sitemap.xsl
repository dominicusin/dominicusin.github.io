<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="s">

  <xsl:output method="html" encoding="UTF-8" indent="yes"
    doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="ru">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Карта сайта — dominicusin.github.io</title>
        <style>
          :root {
            --emerald: #10b981;
            --emerald-dark: #047857;
            --bg: #0b0f0c;
            --card: #111a14;
            --text: #e6f4ea;
            --muted: #8aa395;
            --border: #1c2c22;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            background: radial-gradient(1200px 600px at 50% -10%, #0f1f17 0%, var(--bg) 60%);
            color: var(--text);
            line-height: 1.55;
            padding: 2.5rem 1rem 4rem;
          }
          .wrap { max-width: 880px; margin: 0 auto; }
          header { text-align: center; margin-bottom: 2rem; }
          h1 {
            font-size: 2rem; margin: 0 0 .4rem;
            background: linear-gradient(90deg, var(--emerald), #6ee7b7);
            -webkit-background-clip: text; background-clip: text; color: transparent;
          }
          .sub { color: var(--muted); font-size: .95rem; }
          .count {
            display: inline-block; margin-top: 1rem; padding: .3rem .8rem;
            border: 1px solid var(--border); border-radius: 999px;
            background: var(--card); color: var(--emerald); font-size: .85rem;
          }
          ul { list-style: none; padding: 0; margin: 0; display: grid; gap: .6rem; }
          li {
            background: var(--card); border: 1px solid var(--border);
            border-radius: 12px; padding: .8rem 1rem;
            transition: border-color .15s ease, transform .15s ease;
          }
          li:hover { border-color: var(--emerald); transform: translateY(-1px); }
          a { color: var(--text); text-decoration: none; font-weight: 600; }
          a:hover { color: var(--emerald); }
          .meta { display: flex; flex-wrap: wrap; gap: .4rem .9rem; margin-top: .35rem; font-size: .8rem; color: var(--muted); }
          .badge {
            padding: .1rem .55rem; border-radius: 999px; font-size: .72rem;
            background: rgba(16,185,129,.12); color: var(--emerald);
            border: 1px solid rgba(16,185,129,.25);
          }
          .sec { text-transform: uppercase; letter-spacing: .04em; }
          footer { text-align: center; margin-top: 2.5rem; color: var(--muted); font-size: .8rem; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <h1>Карта сайта</h1>
            <div class="sub">Полный индекс страниц dominicusin.github.io</div>
            <div class="count"><xsl:value-of select="count(s:urlset/s:url)"/> страниц</div>
          </header>
          <ul>
            <xsl:for-each select="s:urlset/s:url">
              <xsl:sort select="s:loc"/>
              <li>
                <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
                <div class="meta">
                  <span class="badge sec">
                    <xsl:call-template name="section">
                      <xsl:with-param name="loc" select="s:loc"/>
                    </xsl:call-template>
                  </span>
                  <xsl:if test="s:priority">
                    <span>приоритет: <xsl:value-of select="s:priority"/></span>
                  </xsl:if>
                  <xsl:if test="s:changefreq">
                    <span>обновление: <xsl:value-of select="s:changefreq"/></span>
                  </xsl:if>
                  <xsl:if test="s:lastmod">
                    <span>изменено: <xsl:value-of select="s:lastmod"/></span>
                  </xsl:if>
                </div>
              </li>
            </xsl:for-each>
          </ul>
          <footer>Сгенерировано Hugo · отображение sitemap.xml через XSLT</footer>
        </div>
      </body>
    </html>
  </xsl:template>

  <xsl:template name="section">
    <xsl:param name="loc"/>
    <xsl:variable name="path" select="substring-after(substring-after($loc, '://'), '/')"/>
    <xsl:choose>
      <xsl:when test="contains($path, '/')">
        <xsl:value-of select="substring-before($path, '/')"/>
      </xsl:when>
      <xsl:when test="string-length($path) &gt; 0">
        <xsl:value-of select="$path"/>
      </xsl:when>
      <xsl:otherwise>home</xsl:otherwise>
    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>
