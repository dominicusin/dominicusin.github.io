/* Knowledge Graph — interactive force-directed visualization (v2).
 * Vanilla JS + vendored D3 v7 (static/js/d3.v7.min.js). Fetches
 * /data/knowledge-graph.json and renders a navigable graph of posts, concepts,
 * people, projects and DAO contracts. Degrades to the <noscript> list if JS off.
 *
 * Features: drag nodes, zoom/pan, hover to highlight neighbours, click a node to
 * open its link (or focus it), type filter chips, live search, detail side-panel.
 */
(function () {
  'use strict';
  var root = document.getElementById('kg-root');
  if (!root || typeof window.d3 === 'undefined') return;

  var COLORS = {
    post: 'var(--kg-post, #60a5fa)',
    concept: 'var(--kg-concept, #34d399)',
    person: 'var(--kg-person, #f472b6)',
    project: 'var(--kg-project, #fbbf24)',
    dao: 'var(--kg-dao, #a78bfa)'
  };
  var LABELS = { post: 'Post', concept: 'Concept', person: 'Person', project: 'Project', dao: 'DAO contract' };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  fetch('/data/knowledge-graph.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(init)
    .catch(function (e) { root.innerHTML = ''; root.appendChild(el('p', 'kg-error', 'Could not load knowledge graph data: ' + e.message)); });

  function init(data) {
    var nodes = data.nodes.map(function (n) { return Object.assign({}, n); });
    var links = data.edges.map(function (e) { return Object.assign({}, e); });
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    root.innerHTML = '';
    var wrap = el('div', 'kg-wrap');
    root.appendChild(wrap);

    // Controls
    var controls = el('div', 'kg-controls');
    var search = el('input', 'kg-search'); search.type = 'search'; search.placeholder = 'Search the graph…';
    var reset = el('button', 'kg-btn', 'Reset view');
    controls.appendChild(search); controls.appendChild(reset);
    wrap.appendChild(controls);

    // Filter chips
    var types = ['post', 'concept', 'person', 'project', 'dao'];
    var chips = el('div', 'kg-chips');
    var active = { post: true, concept: true, person: true, project: true, dao: true };
    types.forEach(function (t) {
      var c = el('button', 'kg-chip kg-active', LABELS[t]);
      c.style.setProperty('--chip', COLORS[t]);
      c.setAttribute('data-type', t);
      c.addEventListener('click', function () {
        active[t] = !active[t];
        c.classList.toggle('kg-active', active[t]);
        applyFilter();
      });
      chips.appendChild(c);
    });
    wrap.appendChild(chips);

    // Graph + panel
    var stage = el('div', 'kg-stage');
    var svgHost = el('div', 'kg-svg');
    var panel = el('div', 'kg-panel');
    panel.appendChild(el('p', 'kg-panel-empty', 'Select a node to see details.'));
    stage.appendChild(svgHost); stage.appendChild(panel);
    wrap.appendChild(stage);

    var legend = el('div', 'kg-legend');
    types.forEach(function (t) { var i = el('span', 'kg-leg'); i.style.background = COLORS[t]; i.appendChild(el('span', null, LABELS[t])); legend.appendChild(i); });
    wrap.appendChild(legend);

    var width = Math.max(320, svgHost.clientWidth || svgHost.getBoundingClientRect().width || 800);
    var height = Math.max(420, Math.min(680, window.innerHeight * 0.6));

    var svg = d3.select(svgHost).append('svg')
      .attr('viewBox', [0, 0, width, height])
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('class', 'kg-svg-el');
    var g = svg.append('g');

    var zoom = d3.zoom().scaleExtent([0.2, 4]).on('zoom', function (ev) { g.attr('transform', ev.transform); });
    svg.call(zoom);

    var link = g.append('g').attr('stroke', 'var(--kg-edge, rgba(148,163,184,.35))').attr('stroke-width', 1)
      .selectAll('line').data(links).join('line').attr('class', 'kg-edge');

    var node = g.append('g').selectAll('g').data(nodes).join('g').attr('class', 'kg-node');
    node.append('circle')
      .attr('r', function (d) { return 5 + (d.weight || 2) * 1.6; })
      .attr('fill', function (d) { return COLORS[d.type] || '#94a3b8'; })
      .attr('stroke', 'var(--kg-node-stroke, rgba(255,255,255,.25))')
      .attr('stroke-width', 1.5);
    node.append('text')
      .text(function (d) { return d.label; })
      .attr('x', function (d) { return 8 + (d.weight || 2) * 1.6; })
      .attr('y', 4)
      .attr('class', 'kg-label')
      .attr('data-type', function (d) { return d.type; });

    var sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(function (l) { return 90 + (Math.min((byId[l.source.id || l.source] || {}).weight || 2, (byId[l.target.id || l.target] || {}).weight || 2)) * 6; }).strength(0.2))
      .force('charge', d3.forceManyBody().strength(-380))
      .force('collide', d3.forceCollide(function (d) { return 20 + (d.weight || 2) * 2.8; }))
      .on('tick', ticked);

    function liveSize() {
      var w = Math.max(320, svgHost.clientWidth || svgHost.getBoundingClientRect().width || 800);
      var h = Math.max(420, Math.min(680, window.innerHeight * 0.6));
      return { w: w, h: h };
    }

    function fitView() {
      var s = liveSize();
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(function (n) {
        if (typeof n.x !== 'number') return;
        minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
      });
      if (!isFinite(minX)) return;
      var pad = 70;
      var gw = (maxX - minX) || 1, gh = (maxY - minY) || 1;
      // Expand the bounding box to the container's aspect ratio so the graph
      // fills the canvas (preserveAspectRatio centers it). This avoids the
      // left-cluster caused by letterboxing a mismatched viewBox.
      var targetAR = s.h / s.w;
      var ar = gh / gw;
      if (ar < targetAR) { var nh = gw * targetAR; minY -= (nh - gh) / 2; gh = nh; }
      else { var nw = gh / targetAR; minX -= (nw - gw) / 2; gw = nw; }
      svg.attr('viewBox', [minX - pad, minY - pad, gw + pad * 2, gh + pad * 2]);
    }
    sim.on('end', fitView);
    setTimeout(fitView, 700);
    setTimeout(fitView, 1500);
    setTimeout(fitView, 2600);
    requestAnimationFrame(fitView);

    function ticked() {
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(function (n) {
        if (typeof n.x !== 'number') return;
        minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
      });
      if (!isFinite(minX)) return;
      var pad = 60;
      var gw = (maxX - minX) || 1, gh = (maxY - minY) || 1;
      var scale = Math.min(2, 0.95 * Math.min((width - pad * 2) / gw, (height - pad * 2) / gh));
      scale = Math.max(0.2, scale);
      var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      var t = d3.zoomIdentity.translate(width / 2 - scale * cx, height / 2 - scale * cy).scale(scale);
      svg.transition().duration(500).call(zoom.transform, t);
    }
    sim.on('end', fitView);

    function ticked() {
      link.attr('x1', function (d) { return d.source.x; }).attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; }).attr('y2', function (d) { return d.target.y; });
      node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
    }

    node.call(d3.drag()
      .on('start', function (ev, d) { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', function (ev, d) { d.fx = ev.x; d.fy = ev.y; })
      .on('end', function (ev, d) { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    // Hover highlight
    var neighbors = {};
    links.forEach(function (l) { var s = l.source.id || l.source, t = l.target.id || l.target; (neighbors[s] = neighbors[s] || {})[t] = 1; (neighbors[t] = neighbors[t] || {})[s] = 1; });
    node.on('mouseenter', function (ev, d) {
      node.classed('kg-dim', function (o) { return o.id !== d.id && !neighbors[d.id]?.[o.id]; });
      link.classed('kg-edge-hi', function (l) { return (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id; });
      link.classed('kg-dim', function (l) { return !((l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id); });
    }).on('mouseleave', function () {
      node.classed('kg-dim', false); link.classed('kg-dim', false).classed('kg-edge-hi', false);
    });

    // Click → detail / navigate
    node.on('click', function (ev, d) {
      d3.selectAll('.kg-node').classed('kg-selected', false);
      d3.select(this).classed('kg-selected', true);
      showDetail(d);
    });

    function showDetail(d) {
      panel.innerHTML = '';
      var h = el('h3', 'kg-panel-title', d.label);
      panel.appendChild(h);
      panel.appendChild(el('span', 'kg-panel-type', LABELS[d.type] || d.type));
      if (d.date) panel.appendChild(el('p', 'kg-panel-date', String(d.date).slice(0, 10)));
      if (d.url && d.url.indexOf('http') === 0) {
        var a = el('a', 'kg-panel-link', 'Open ↗'); a.href = d.url; a.target = '_blank'; a.rel = 'noopener'; panel.appendChild(a);
      } else if (d.url) {
        var b = el('a', 'kg-panel-link', 'Open post →'); b.href = d.url; panel.appendChild(b);
      }
      var rel = links.filter(function (l) { return (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id; })
        .map(function (l) { var other = (l.source.id || l.source) === d.id ? (l.target.id || l.target) : (l.source.id || l.source); return byId[other]; })
        .filter(Boolean).slice(0, 12);
      if (rel.length) {
        panel.appendChild(el('p', 'kg-panel-sub', 'Connected (' + rel.length + '):'));
        var ul = el('ul', 'kg-panel-rel');
        rel.forEach(function (r) {
          var li = el('li'); var ra = el('a', null, r.label); ra.href = '#'; ra.addEventListener('click', function (e) { e.preventDefault(); focusNode(r.id); });
          li.appendChild(ra); ul.appendChild(li);
        });
        panel.appendChild(ul);
      }
    }

    function focusNode(id) {
      var d = byId[id]; if (!d) return;
      d3.selectAll('.kg-node').classed('kg-selected', function (o) { return o.id === id; });
      showDetail(d);
      if (typeof d.x === 'number') {
        svg.transition().duration(600).call(d3.zoom().transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1.6).translate(-d.x, -d.y));
      }
    }

    // Search
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      if (!q) { node.classed('kg-dim', false); return; }
      node.classed('kg-dim', function (d) { return (d.label || '').toLowerCase().indexOf(q) === -1; });
    });

    function applyFilter() {
      node.style('display', function (d) { return active[d.type] ? null : 'none'; });
      link.style('display', function (l) {
        var s = byId[l.source.id || l.source], t = byId[l.target.id || l.target];
        return (s && t && active[s.type] && active[t.type]) ? null : 'none';
      });
    }

    reset.addEventListener('click', function () {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
      fitView();
      node.classed('kg-dim', false).classed('kg-selected', false);
      link.classed('kg-dim', false).classed('kg-edge-hi', false);
      panel.innerHTML = ''; panel.appendChild(el('p', 'kg-panel-empty', 'Select a node to see details.'));
    });

    window.addEventListener('resize', function () {
      var w = svgHost.clientWidth || width;
      svg.attr('viewBox', [0, 0, w, height]);
      sim.force('center', d3.forceCenter(w / 2, height / 2)); sim.alpha(0.3).restart();
    });

    console.log('KG ready: ' + nodes.length + ' nodes, ' + links.length + ' links');
  }
})();
