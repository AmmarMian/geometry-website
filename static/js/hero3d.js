/* <geo-hero variant="flow|geodesic|torus" pattern speed density trail thickness interactive>
   Colors resolve from CSS vars --paper/--ink/--line2/--accent (fallback attrs ink/paper/accent).
   el.orient = {x,y,z} — tweenable from outside (anime.js). */
(function () {
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

  class GeoHero extends HTMLElement {
    static get observedAttributes() { return ['variant', 'pattern', 'speed', 'density', 'trail', 'thickness', 'zoom', 'surface', 'annotations', 'autorotate']; }
    get zoom() { return this._zoom; }
    set zoom(v) { this._zoom = Math.max(0.4, Math.min(3, v)); }
    connectedCallback() {
      if (this._init) return; this._init = true;
      if (getComputedStyle(this).position === 'static') this.style.position = 'relative';
      this.style.display = 'block';
      if (!this.style.height) this.style.height = '100%';
      this.orient = { x: 0, y: 0, z: 0 };
      this._zoom = this._num('zoom', 1); this._dragX = 0; this._dragY = 0;
      this._boot();
    }
    attributeChangedCallback(n, o, v) {
      if (!this._ready || o === v) return;
      if (n === 'speed') return;
      if (n === 'zoom') { this._zoom = this._num('zoom', 1); return; }
      this._build();
    }
    disconnectedCallback() { this._dead = true; cancelAnimationFrame(this._raf); if (this._ro) this._ro.disconnect(); if (this._mo) this._mo.disconnect(); }
    _num(n, d) { const v = parseFloat(this.getAttribute(n)); return isNaN(v) ? d : v; }

    async _boot() {
      let T; try { T = this._T = await import(THREE_URL); } catch (e) { return; }
      if (this._dead) return;
      let r; try { r = this._renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { return; }
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      this.appendChild(r.domElement);
      const cam = this._cam = new T.PerspectiveCamera(32, 1, 0.1, 60);
      cam.position.set(0, 0.55, 4.6); cam.lookAt(0, 0, 0);
      this._scene = new T.Scene();
      const size = () => {
        const w = this.clientWidth || 600, h = this.clientHeight || 400;
        r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      };
      this._ro = new ResizeObserver(size); this._ro.observe(this); size();
      this._visible = true;
      new IntersectionObserver(es => { this._visible = es[0].isIntersecting; }).observe(this);
      // rebuild when theme flips (colors come from CSS vars)
      this._mo = new MutationObserver(() => this._build());
      this._mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      if (this.hasAttribute('interactive')) this._wireControls();
      if (this.hasAttribute('drag')) this._wireDrag();
      this._ready = true; this._build();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (let i = 0; i < 500; i++) this._step(1 / 60);
        this._applyOrient(); this._render(); return;
      }
      const loop = () => {
        if (this._dead) return;
        this._raf = requestAnimationFrame(loop);
        if (!this._visible) return;
        this._step(this._num('speed', 1) / 60);
        this._applyOrient(); this._render();
      };
      this._raf = requestAnimationFrame(loop);
    }
    _wireControls() {
      this.style.cursor = 'grab'; this.style.touchAction = 'none';
      const ptrs = new Map(); let px = 0, py = 0, pinch = 0;
      const zoomLimit = z => Math.max(0.55, Math.min(2.6, z));
      this.addEventListener('pointerdown', e => {
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        this.setPointerCapture(e.pointerId); this.style.cursor = 'grabbing';
        if (ptrs.size === 1) { px = e.clientX; py = e.clientY; }
        else if (ptrs.size === 2) { const p = [...ptrs.values()]; pinch = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); }
      });
      this.addEventListener('pointermove', e => {
        if (!ptrs.has(e.pointerId)) return;
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (ptrs.size >= 2) {
          const p = [...ptrs.values()], d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
          if (pinch) this._zoom = zoomLimit(this._zoom * (d / pinch));
          pinch = d;
        } else {
          this._dragY += (e.clientX - px) * 0.005; this._dragX += (e.clientY - py) * 0.005;
          this._dragX = Math.max(-1.2, Math.min(1.2, this._dragX));
          px = e.clientX; py = e.clientY;
        }
      });
      const up = e => {
        ptrs.delete(e.pointerId); pinch = 0;
        if (ptrs.size === 1) { const p = [...ptrs.values()][0]; px = p.x; py = p.y; }
        if (ptrs.size === 0) this.style.cursor = 'grab';
      };
      this.addEventListener('pointerup', up); this.addEventListener('pointercancel', up);
      this.addEventListener('wheel', e => {
        e.preventDefault();
        this._zoom = zoomLimit(this._zoom * (e.deltaY > 0 ? 0.94 : 1.06));
      }, { passive: false });
      this.addEventListener('dblclick', () => { this._zoom = this._num('zoom', 1); this._dragX = 0; this._dragY = 0; });
    }
    // landing-page drag-to-rotate: lighter than _wireControls — no wheel/pinch hijack, touch-action
    // stays pan-y so vertical page scroll keeps working since this element sits fixed behind the whole page
    _wireDrag() {
      this.style.cursor = 'grab';
      this.style.touchAction = 'pan-y';
      let dragging = false, px = 0, py = 0;
      const move = (x, y) => {
        if (!dragging) return;
        this._dragY += (x - px) * 0.006; this._dragX += (y - py) * 0.006;
        this._dragX = Math.max(-1.2, Math.min(1.2, this._dragX));
        px = x; py = y;
      };
      this.addEventListener('pointerdown', e => { dragging = true; px = e.clientX; py = e.clientY; this.style.cursor = 'grabbing'; });
      window.addEventListener('pointermove', e => move(e.clientX, e.clientY), { passive: true });
      window.addEventListener('pointerup', () => { dragging = false; this.style.cursor = 'grab'; }, { passive: true });
      window.addEventListener('pointercancel', () => { dragging = false; this.style.cursor = 'grab'; }, { passive: true });
    }
    _updateAttractor() {
      if (!this._ptr || !this._ptr.active || !this._group) { this._attr = null; return; }
      const T = this._T;
      if (!this._ray) this._ray = new T.Raycaster();
      if (!this._attrTmp) this._attrTmp = new T.Vector3();
      // cast from the camera through the pointer and take the point on that ray closest to the
      // object's centre — a fixed NDC depth here would land the point right next to the camera,
      // barely moving with the mouse at all
      this._ray.setFromCamera({ x: this._ptr.nx, y: this._ptr.ny }, this._cam);
      this._ray.ray.closestPointToPoint(this._group.position, this._attrTmp);
      this._group.worldToLocal(this._attrTmp);
      this._attr = this._attrTmp;
    }
    _applyOrient() {
      if (!this._group) return;
      const g = this._group, o = this.orient || { x: 0, y: 0, z: 0 };
      g.rotation.x = this._baseRot.x + o.x + this._dragX;
      g.rotation.y = this._baseRot.y + this._spin + o.y + this._dragY;
      g.rotation.z = this._baseRot.z + o.z;
      this._cam.position.setLength(4.6 / this._zoom);
    }
    _css(name, fb) {
      const v = getComputedStyle(this).getPropertyValue(name).trim();
      return new this._T.Color(v || this.getAttribute(name.replace('--', '')) || fb);
    }
    _build() {
      const T = this._T; if (!T) return;
      if (this._group) {
        this._scene.remove(this._group);
        this._group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
      }
      const g = this._group = new T.Group(); this._scene.add(g); this._t = 0; this._spin = 0;
      this._baseRot = { x: 0, y: 0, z: 0 };
      this._cols = {
        ink: this._css('--ink', '#26241f'),
        paper: this._css('--paper', '#f7f4ee'),
        grid: this._css('--line2', '#cfc7b4'),
        accent: this._css('--accent', '#8c4426')
      };
      const v = this.getAttribute('variant') || 'flow';
      this._auto = this.getAttribute('autorotate') !== 'false';
      this._stepFn = v === 'geodesic' ? this._buildGeodesic(g)
        : v === 'torus' ? this._buildTorus(g)
        : v === 'spectral' ? this._buildSpectral(g)
        : v === 'swarm' ? this._buildSwarm(g)
        : this._buildFlow(g);
    }
    _step(dt) { this._t += dt; this._updateAttractor(); if (this._stepFn) this._stepFn(dt, this._t); }
    _render() { this._renderer.render(this._scene, this._cam); }

    _makeTrails(g, N, L, headsInit, nAccent, project) {
      const T = this._T, { ink, paper, accent } = this._cols;
      const th = this._num('thickness', 1);
      const SUB = project ? 6 : 1; // subdivide each hop and project onto the manifold → geodesic arcs
      const trail = new Float32Array(N * L * 3);
      for (let i = 0; i < N; i++) for (let j = 0; j < L; j++)
        trail.set([headsInit[i * 3], headsInit[i * 3 + 1], headsInit[i * 3 + 2]], (i * L + j) * 3);
      const segCount = N * (L - 1) * SUB;
      const pos = new Float32Array(segCount * 2 * 3);
      const col = new Float32Array(segCount * 2 * 3);
      const c = new T.Color();
      const gain = Math.min(1, 0.85 + th * 0.5);
      const fade = (u) => Math.pow(1 - u / L, 0.7) * gain; // u = fractional index along trail; lower exponent = trail reads heavier/thicker
      for (let i = 0; i < N; i++) {
        const base = i < nAccent ? accent : ink;
        for (let j = 0; j < L - 1; j++) for (let sub = 0; sub < SUB; sub++) {
          const k = ((i * (L - 1) + j) * SUB + sub) * 6;
          c.copy(paper).lerp(base, fade(j + sub / SUB)); col.set([c.r, c.g, c.b], k);
          c.copy(paper).lerp(base, fade(j + (sub + 1) / SUB)); col.set([c.r, c.g, c.b], k + 3);
        }
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('color', new T.BufferAttribute(col, 3));
      g.add(new T.LineSegments(geo, new T.LineBasicMaterial({ vertexColors: true })));
      const hp = new Float32Array(N * 3); hp.set(headsInit);
      const pgeo = new T.BufferGeometry();
      pgeo.setAttribute('position', new T.BufferAttribute(hp, 3));
      g.add(new T.Points(pgeo, new T.PointsMaterial({
        color: ink, size: 0.021 * th, sizeAttenuation: true,
        map: dotTexture(T), alphaTest: 0.5, transparent: true
      })));
      const va = new T.Vector3(), vb = new T.Vector3(), vp = new T.Vector3();
      return {
        push(i, x, y, z) {
          trail.copyWithin(i * L * 3 + 3, i * L * 3, (i + 1) * L * 3 - 3);
          trail[i * L * 3] = x; trail[i * L * 3 + 1] = y; trail[i * L * 3 + 2] = z;
          hp[i * 3] = x; hp[i * 3 + 1] = y; hp[i * 3 + 2] = z;
        },
        // fill the whole trail history with one point — use when a particle teleports,
        // so it doesn't drag a straight streak across the shape from its old position
        reset(i, x, y, z) {
          for (let j = 0; j < L; j++) trail.set([x, y, z], (i * L + j) * 3);
          hp[i * 3] = x; hp[i * 3 + 1] = y; hp[i * 3 + 2] = z;
        },
        commit() {
          for (let i = 0; i < N; i++) for (let j = 0; j < L - 1; j++) {
            const t0 = (i * L + j) * 3;
            va.set(trail[t0], trail[t0 + 1], trail[t0 + 2]);
            vb.set(trail[t0 + 3], trail[t0 + 4], trail[t0 + 5]);
            for (let sub = 0; sub < SUB; sub++) {
              const s = ((i * (L - 1) + j) * SUB + sub) * 6;
              const f0 = sub / SUB, f1 = (sub + 1) / SUB;
              vp.copy(va).lerp(vb, f0); if (project) project(vp); pos[s] = vp.x; pos[s + 1] = vp.y; pos[s + 2] = vp.z;
              vp.copy(va).lerp(vb, f1); if (project) project(vp); pos[s + 3] = vp.x; pos[s + 4] = vp.y; pos[s + 5] = vp.z;
            }
          }
          geo.attributes.position.needsUpdate = true;
          pgeo.attributes.position.needsUpdate = true;
        }
      };
    }
    _gridMat(op) { return new this._T.LineBasicMaterial({ color: this._cols.grid, transparent: true, opacity: op }); }
    // native GL lines are capped at 1px in most browsers, so fake extra weight with a slightly
    // scaled-up, lower-opacity duplicate sitting just outside the base line (~2x visual thickness)
    _gridLines(g, geo, op) {
      const T = this._T;
      g.add(new T.LineSegments(geo, this._gridMat(op)));
      const halo = new T.LineSegments(geo, this._gridMat(Math.min(1, op * 0.75)));
      halo.scale.multiplyScalar(1.012);
      g.add(halo);
    }
    _labelSprite(text) {
      const T = this._T, fs = 30, pad = 12;
      const c = document.createElement('canvas'), m = c.getContext('2d');
      m.font = '500 ' + fs + 'px "IBM Plex Mono", monospace';
      c.width = Math.ceil(m.measureText(text).width) + pad * 2; c.height = fs + pad * 2;
      const x = c.getContext('2d');
      x.font = '500 ' + fs + 'px "IBM Plex Mono", monospace';
      x.fillStyle = '#' + this._cols.ink.getHexString();
      x.textBaseline = 'middle'; x.fillText(text, pad, c.height / 2 + 2);
      const tex = new T.CanvasTexture(c); tex.anisotropy = 4;
      const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      const sc = 0.0042; s.scale.set(c.width * sc, c.height * sc, 1); s.renderOrder = 10;
      return s;
    }
    /* technical-drawing callouts: dot on the shape, leader line to a label. attr annotations="true" */
    get annotationOpacity() { return this._annOpacity ?? 1; }
    set annotationOpacity(v) {
      this._annOpacity = Math.max(0, Math.min(1, v));
      if (this._annGroup) this._annGroup.traverse(o => {
        if (o.material) { o.material.opacity = (o.material.userData.base ?? 1) * this._annOpacity; o.visible = this._annOpacity > 0.01; }
      });
    }
    _addAnnotations(g, list) {
      if (this.getAttribute('annotations') !== 'true') return;
      const T = this._T, pts = [];
      const ag = new T.Group(); g.add(ag); this._annGroup = ag;
      for (const a of list) {
        const elbow = a.p.clone().addScaledVector(a.dir, a.len ?? 0.5);
        const end = elbow.clone(); end.x += a.dx ?? 0.4;
        pts.push(a.p.x, a.p.y, a.p.z, elbow.x, elbow.y, elbow.z, elbow.x, elbow.y, elbow.z, end.x, end.y, end.z);
        const dot = new T.Mesh(new T.SphereGeometry(0.018, 10, 10), new T.MeshBasicMaterial({ color: this._cols.accent, transparent: true }));
        dot.position.copy(a.p); ag.add(dot);
        const s = this._labelSprite(a.text);
        s.position.copy(end); s.position.x += ((a.dx ?? 0.4) >= 0 ? 1 : -1) * (s.scale.x / 2 + 0.06);
        ag.add(s);
      }
      const ge = new T.BufferGeometry();
      ge.setAttribute('position', new T.BufferAttribute(new Float32Array(pts), 3));
      const ln = new T.LineSegments(ge, new T.LineBasicMaterial({ color: this._cols.ink, transparent: true, opacity: 0.65, depthTest: false }));
      ln.renderOrder = 9; ag.add(ln);
      ag.traverse(o => { if (o.material) o.material.userData.base = o.material.opacity; });
      this.annotationOpacity = this._annOpacity ?? 1;
    }
    /* surface attr: grid (default) | none | glass */
    _addSurface(g, gridGeo, solidGeo) {
      const T = this._T, surf = this.getAttribute('surface') || 'grid';
      if (surf === 'none') return;
      if (surf === 'glass') {
        g.add(new T.AmbientLight(0xffffff, 0.75));
        const d1 = new T.DirectionalLight(0xffffff, 0.9); d1.position.set(2, 3, 2); g.add(d1);
        const d2 = new T.DirectionalLight(0xffffff, 0.35); d2.position.set(-2, -1, -2); g.add(d2);
        const dark = document.documentElement.dataset.theme === 'dark';
        g.add(new T.Mesh(solidGeo, new T.MeshPhongMaterial({
          color: this._cols.paper.clone().lerp(this._cols.ink, dark ? 0.18 : 0.06),
          specular: dark ? 0x554d3d : 0x9a9280, shininess: 90,
          transparent: true, opacity: dark ? 0.34 : 0.42, side: T.DoubleSide, depthWrite: false
        })));
        g.add(new T.LineSegments(gridGeo.clone(), this._gridMat(0.18)));
        return;
      }
      this._gridLines(g, gridGeo, 1);
    }
    _NL() {
      return {
        N: Math.round(650 * this._num('density', 1)),
        L: Math.max(4, Math.round(this._num('trail', 16)))
      };
    }

    /* — sphere flows. patterns: mix | zonal | sourcesink — */
    _buildFlow(g) {
      const T = this._T, pat = this.getAttribute('pattern') || 'mix';
      this._addSurface(g, sphereGrid(T, 1), new T.SphereGeometry(0.985, 48, 32));
      const { N, L } = this._NL();
      const heads = new Float32Array(N * 3), P = [];
      for (let i = 0; i < N; i++) {
        const v = new T.Vector3().randomDirection(); P.push(v);
        heads.set([v.x, v.y, v.z], i * 3);
      }
      const tr = this._makeTrails(g, N, L, heads, 8, (v) => v.normalize());
      {
        const A = (lat, lon) => new T.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
        this._addAnnotations(g, [
          { p: A(0.55, 0.9), dir: A(0.55, 0.9), len: 0.45, dx: 0.42, text: 'x ∈ S²' },
          { p: A(-0.35, 2.4), dir: A(-0.35, 2.4), len: 0.4, dx: -0.45, text: 'v(x, t) ∈ TₓS²' }
        ]);
      }
      const a1 = new T.Vector3(0.2, 1, 0.15).normalize();
      const a2 = new T.Vector3(1, -0.35, 0.5).normalize();
      const a3 = new T.Vector3(-0.55, 0.25, 1).normalize();
      const yAxis = new T.Vector3(0, 1, 0);
      const sink = new T.Vector3(0.4, 0.75, 0.53).normalize();
      const tmp = new T.Vector3(), v = new T.Vector3(), aDir = new T.Vector3();
      return (dt, t) => {
        let w1 = 0, w2 = 0, w3 = 0;
        if (pat === 'mix') { w1 = 0.65 + 0.35 * Math.sin(t * 0.21); w2 = 0.5 * Math.sin(t * 0.13 + 1.4); w3 = 0.45 * Math.sin(t * 0.09 + 3.1); }
        for (let i = 0; i < N; i++) {
          const p = P[i];
          if (pat === 'zonal') {
            // banded jets: eastward speed depends on latitude
            const lat = Math.asin(Math.max(-1, Math.min(1, p.y)));
            const jet = Math.cos(3 * lat) * 0.9 + 0.15 * Math.sin(t * 0.3 + lat * 5);
            v.copy(tmp.copy(yAxis).cross(p)).multiplyScalar(jet);
            v.addScaledVector(tmp.copy(a2).cross(p), 0.08 * Math.sin(t * 0.5 + i));
          } else if (pat === 'sourcesink') {
            // flow-matching: everything transported toward a moving target point
            sink.set(Math.sin(t * 0.1) * 0.8, Math.cos(t * 0.07) * 0.6, Math.cos(t * 0.1) * 0.8).normalize();
            v.copy(sink).addScaledVector(p, -sink.dot(p)); // tangent toward sink
            const d = Math.acos(Math.max(-1, Math.min(1, p.dot(sink))));
            v.normalize().multiplyScalar(0.35 + 0.25 * Math.sin(d * 2));
            v.addScaledVector(tmp.copy(sink).cross(p), 0.45); // swirl around it
            if (d < 0.12) {
              p.copy(tmp.copy(sink).negate()).addScaledVector(new T.Vector3().randomDirection(), 0.35).normalize();
              tr.reset(i, p.x, p.y, p.z); // teleport: don't drag the old trail across the sphere
              continue;
            }
          } else {
            v.copy(tmp.copy(a1).cross(p)).multiplyScalar(w1);
            v.addScaledVector(tmp.copy(a2).cross(p), w2);
            v.addScaledVector(tmp.copy(a3).cross(p), w3);
          }
          if (this._attr) {
            aDir.copy(this._attr).normalize();
            const dot = Math.max(-1, Math.min(1, p.dot(aDir)));
            const infl = Math.exp(-(1 - dot) * 3.5) * 1.5;
            v.addScaledVector(tmp.copy(aDir).cross(p), infl);                     // swirl around pointer
            v.addScaledVector(tmp.copy(aDir).addScaledVector(p, -dot), infl * 0.7); // draw toward pointer
          }
          p.addScaledVector(v, dt * 0.6).normalize();
          tr.push(i, p.x, p.y, p.z);
        }
        tr.commit();
        if (this._auto) this._spin += dt * 0.05;
      };
    }

    /* — geodesic landscape (unchanged behaviour) — */
    _buildGeodesic(g) {
      const T = this._T, { ink, accent } = this._cols;
      const f = (x, y) =>
        0.62 * Math.exp(-((x - 0.35) ** 2 + (y - 0.15) ** 2) / 0.6) +
        0.45 * Math.exp(-((x + 0.8) ** 2 + (y + 0.5) ** 2) / 0.45) -
        0.3 * Math.exp(-((x + 0.15) ** 2 + (y - 0.95) ** 2) / 0.5) - 0.18;
      const D = 1.65, n = 25, m = 56, gp = [];
      for (let i = 0; i < n; i++) {
        const a = -D + 2 * D * i / (n - 1);
        for (let j = 0; j < m - 1; j++) {
          const b0 = -D + 2 * D * j / (m - 1), b1 = -D + 2 * D * (j + 1) / (m - 1);
          gp.push(a, f(a, b0), b0, a, f(a, b1), b1);
          gp.push(b0, f(b0, a), a, b1, f(b1, a), a);
        }
      }
      const gg = new T.BufferGeometry();
      gg.setAttribute('position', new T.BufferAttribute(new Float32Array(gp), 3));
      this._gridLines(g, gg, 1);
      const P = 2200, path = new Float32Array(P * 3), shadow = new Float32Array(P * 3), zP = -0.85;
      for (let k = 0; k < P; k++) {
        const s = k * 0.02;
        const x = 1.3 * Math.sin(0.53 * s + 0.7) + 0.18 * Math.sin(1.31 * s);
        const y = 1.3 * Math.sin(0.34 * s) + 0.14 * Math.sin(1.7 * s + 2);
        path.set([x, f(x, y) + 0.015, y], k * 3);
        shadow.set([x, zP, y], k * 3);
      }
      const mk = (arr, colr, op) => {
        const ge = new T.BufferGeometry();
        ge.setAttribute('position', new T.BufferAttribute(arr, 3));
        ge.setDrawRange(0, 0);
        g.add(new T.Line(ge, new T.LineBasicMaterial({ color: colr, transparent: true, opacity: op })));
        return ge;
      };
      const pge = mk(path, accent, 0.95), sge = mk(shadow, this._cols.grid, 0.9);
      const drops = [];
      for (let k = 0; k < P; k += 150) drops.push(path[k * 3], path[k * 3 + 1], path[k * 3 + 2], path[k * 3], zP, path[k * 3 + 2]);
      const dge = new T.BufferGeometry();
      dge.setAttribute('position', new T.BufferAttribute(new Float32Array(drops), 3));
      dge.setDrawRange(0, 0);
      g.add(new T.LineSegments(dge, new T.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.22 })));
      const head = new T.Mesh(new T.SphereGeometry(0.028, 12, 12), new T.MeshBasicMaterial({ color: accent }));
      g.add(head);
      this._addAnnotations(g, [
        { p: new T.Vector3(path[900], path[901], path[902]), dir: new T.Vector3(0, 1, 0), len: 0.5, dx: 0.45, text: 'γ(t)' },
        { p: new T.Vector3(-0.8, f(-0.8, 0.5), 0.5), dir: new T.Vector3(0, 1, 0), len: 0.75, dx: -0.4, text: 'ℳ' }
      ]);
      g.scale.setScalar(0.92); g.position.y = 0.05;
      let idx = 0, hold = 0;
      return (dt, t) => {
        if (hold > 0) { hold -= dt; if (hold <= 0) idx = 0; }
        else { idx += dt * 150; if (idx >= P) { idx = P - 1; hold = 2.5; } }
        const k = Math.floor(idx);
        pge.setDrawRange(0, k); sge.setDrawRange(0, k);
        dge.setDrawRange(0, Math.floor(k / 150) * 2);
        head.position.set(path[k * 3], path[k * 3 + 1], path[k * 3 + 2]);
        if (this._auto) this._baseRot.y = 0.45 + 0.3 * Math.sin(t * 0.07);
      };
    }

    /* — torus flows. patterns: winding | shear | twist — */
    _buildTorus(g) {
      const T = this._T, pat = this.getAttribute('pattern') || 'winding';
      const R = 0.92, r = 0.4;
      const pt = (u, v, out) => out.set((R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u));
      const gp = [], tv = new T.Vector3(), tv2 = new T.Vector3();
      for (let i = 0; i < 18; i++) {
        const u = i / 18 * Math.PI * 2;
        for (let j = 0; j < 24; j++) {
          pt(u, j / 24 * Math.PI * 2, tv); pt(u, (j + 1) / 24 * Math.PI * 2, tv2);
          gp.push(tv.x, tv.y, tv.z, tv2.x, tv2.y, tv2.z);
        }
      }
      for (let i = 0; i < 8; i++) {
        const v = i / 8 * Math.PI * 2;
        for (let j = 0; j < 48; j++) {
          pt(j / 48 * Math.PI * 2, v, tv); pt((j + 1) / 48 * Math.PI * 2, v, tv2);
          gp.push(tv.x, tv.y, tv.z, tv2.x, tv2.y, tv2.z);
        }
      }
      const gg = new T.BufferGeometry();
      gg.setAttribute('position', new T.BufferAttribute(new Float32Array(gp), 3));
      this._addSurface(g, gg, new T.TorusGeometry(R, r - 0.008, 32, 96).rotateX(Math.PI / 2));
      const { N: N0, L } = this._NL(); const N = Math.round(N0 * 0.65);
      const U = new Float32Array(N), V = new Float32Array(N), heads = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        U[i] = Math.random() * Math.PI * 2; V[i] = Math.random() * Math.PI * 2;
        pt(U[i], V[i], tv); heads.set([tv.x, tv.y, tv.z], i * 3);
      }
      const tr = this._makeTrails(g, N, L, heads, 6);
      {
        const ap1 = new T.Vector3(), ap2 = new T.Vector3();
        pt(0.6, 1.1, ap1); pt(3.5, 4.2, ap2);
        this._addAnnotations(g, [
          { p: ap1.clone(), dir: ap1.clone().normalize(), len: 0.4, dx: 0.42, text: 'x = (θ₁, θ₂) ∈ 𝕋²' },
          { p: ap2.clone(), dir: ap2.clone().normalize(), len: 0.35, dx: -0.45, text: 'dθ₂/dθ₁ = p/q' }
        ]);
      }
      this._baseRot.x = 1.02;
      return (dt, t) => {
        for (let i = 0; i < N; i++) {
          let du, dv;
          if (pat === 'shear') {
            // speed along the big circle depends on where you sit on the tube
            du = 0.55 + 0.45 * Math.cos(V[i]); dv = 0.06 * Math.sin(t * 0.4 + i);
          } else if (pat === 'twist') {
            // winding ratio itself breathes over time
            const k = 1.618 + 0.9 * Math.sin(t * 0.08);
            du = 0.34; dv = 0.34 * k * (1 + 0.05 * Math.sin(i * 2.3));
          } else {
            du = (0.34 + 0.1 * Math.sin(t * 0.11)) * (1 + 0.08 * Math.sin(i));
            dv = 0.55 * (1 + 0.06 * Math.cos(i * 2.3));
          }
          U[i] += du * dt; V[i] += dv * dt;
          pt(U[i], V[i], tv);
          tr.push(i, tv.x, tv.y, tv.z);
        }
        tr.commit();
        if (this._auto) this._baseRot.z += dt * 0.04;
      };
    }

    /* — spectral wave-sheet: a manifold surface rippling with travelling waves (time-series / spectra). patterns: ripple | standing | packet — */
    _buildSpectral(g) {
      const T = this._T, pat = this.getAttribute('pattern') || 'ripple';
      const n = 46, D = 1.7, dark = document.documentElement.dataset.theme === 'dark';
      const idx = (i, j) => i * n + j;
      const xz = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
        xz.push(-D + 2 * D * i / (n - 1), -D + 2 * D * j / (n - 1));
      const wave = (x, z, t) => {
        if (pat === 'standing') return 0.32 * Math.sin(2.2 * x + t) * Math.cos(2.2 * z);
        if (pat === 'packet') { const r2 = x * x + z * z; return 0.5 * Math.exp(-r2 * 0.8) * Math.cos(4 * Math.sqrt(r2) - t * 1.4); }
        const r = Math.sqrt(x * x + z * z); return 0.34 * Math.sin(3 * r - t * 1.3) / (1 + r); // ripple
      };
      const surf = this.getAttribute('surface') || 'grid';
      const seg = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (j < n - 1) seg.push(idx(i, j), idx(i, j + 1));
        if (i < n - 1) seg.push(idx(i, j), idx(i + 1, j));
      }
      const pos = new Float32Array(n * n * 3);
      for (let k = 0; k < n * n; k++) { pos[k * 3] = xz[k * 2]; pos[k * 3 + 2] = xz[k * 2 + 1]; }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setIndex(seg);
      if (surf !== 'none') this._gridLines(g, geo, 1);
      let mesh = null;
      if (surf === 'glass') {
        g.add(new T.AmbientLight(0xffffff, 0.8));
        const d1 = new T.DirectionalLight(0xffffff, 0.9); d1.position.set(2, 4, 1.5); g.add(d1);
        const solid = new T.PlaneGeometry(2 * D, 2 * D, n - 1, n - 1); solid.rotateX(-Math.PI / 2);
        mesh = new T.Mesh(solid, new T.MeshPhongMaterial({ color: this._cols.paper.clone().lerp(this._cols.ink, dark ? 0.16 : 0.05), specular: 0x9a9280, shininess: 80, transparent: true, opacity: dark ? 0.35 : 0.4, side: T.DoubleSide, flatShading: true, depthWrite: false }));
        g.add(mesh);
      }
      // a crest-tracer: a point riding the highest wave (feature extraction)
      const cN = Math.round(180 * this._num('density', 1)), cL = Math.max(4, Math.round(this._num('trail', 16)));
      const chs = new Float32Array(cN * 3), cx = new Float32Array(cN), cz = new Float32Array(cN);
      for (let i = 0; i < cN; i++) { cx[i] = (Math.random() * 2 - 1) * D; cz[i] = (Math.random() * 2 - 1) * D; }
      const ctr = this._makeTrails(g, cN, cL, chs, 0);
      this._baseRot.x = 0.62; g.position.y = -0.1;
      this._addAnnotations(g, [
        { p: new T.Vector3(0, wave(0, 0, 0) + 0.02, 0), dir: new T.Vector3(0, 1, 0), len: 0.55, dx: 0.42, text: 'f(x, t)' },
        { p: new T.Vector3(D * 0.7, 0, -D * 0.6), dir: new T.Vector3(0, 1, 0), len: 0.4, dx: -0.45, text: 'ℳ ⊂ ℝⁿ' }
      ]);
      return (dt, t) => {
        for (let k = 0; k < n * n; k++) pos[k * 3 + 1] = wave(pos[k * 3], pos[k * 3 + 2], t);
        geo.attributes.position.needsUpdate = true;
        if (mesh) { const mp = mesh.geometry.attributes.position; for (let k = 0; k < mp.count; k++) mp.setY(k, wave(mp.getX(k), -mp.getZ(k), t)); mp.needsUpdate = true; mesh.geometry.computeVertexNormals(); }
        for (let i = 0; i < cN; i++) {
          const eps = 0.06;
          const gx = (wave(cx[i] + eps, cz[i], t) - wave(cx[i] - eps, cz[i], t)) / (2 * eps);
          const gz = (wave(cx[i], cz[i] + eps, t) - wave(cx[i], cz[i] - eps, t)) / (2 * eps);
          cx[i] += gx * dt * 0.8; cz[i] += gz * dt * 0.8;
          if (Math.abs(cx[i]) > D || Math.abs(cz[i]) > D) { cx[i] = (Math.random() * 2 - 1) * D; cz[i] = (Math.random() * 2 - 1) * D; }
          ctr.push(i, cx[i], wave(cx[i], cz[i], t) + 0.02, cz[i]);
        }
        ctr.commit();
        if (this._auto) this._baseRot.y = 0.2 * Math.sin(t * 0.06);
      };
    }

    /* — flow matching: particles transported between two distributions (WP3). patterns: morph | gaussian2ring | fan — */
    _buildSwarm(g) {
      const T = this._T, pat = this.getAttribute('pattern') || 'morph';
      const N = Math.round(900 * this._num('density', 1)), L = Math.max(4, Math.round(this._num('trail', 16)));
      const src = [], dst = [], P = [], heads = new Float32Array(N * 3);
      const gauss = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      for (let i = 0; i < N; i++) {
        src.push(new T.Vector3(gauss() * 0.42 - 1.15, gauss() * 0.5, gauss() * 0.42));
        let d;
        if (pat === 'fan') { const a = i / N * Math.PI * 2, arm = Math.floor(Math.random() * 3); d = new T.Vector3(1.15 + Math.cos(a) * 0.15, Math.sin(a * 3 + arm * 2.1) * 0.9, Math.sin(a) * 0.6); }
        else { const a = i / N * Math.PI * 2, rr = 0.85 + (Math.random() - 0.5) * 0.12; d = new T.Vector3(1.15, Math.sin(a) * rr, Math.cos(a) * rr); } // ring
        dst.push(d); P.push(src[i].clone()); heads.set([src[i].x, src[i].y, src[i].z], i * 3);
      }
      const tr = this._makeTrails(g, N, L, heads, Math.round(N * 0.12));
      this._addAnnotations(g, [
        { p: new T.Vector3(-1.15, 0.5, 0), dir: new T.Vector3(0, 1, 0), len: 0.45, dx: -0.45, text: 'p₀  (noise)' },
        { p: new T.Vector3(1.15, 0.9, 0), dir: new T.Vector3(0, 1, 0), len: 0.45, dx: 0.42, text: 'p₁  (data)' }
      ]);
      const tmp = new T.Vector3();
      return (dt, t) => {
        const phase = (Math.sin(t * 0.35) * 0.5 + 0.5); // 0..1 ease back and forth
        const s = phase * phase * (3 - 2 * phase);
        for (let i = 0; i < N; i++) {
          tmp.copy(src[i]).lerp(dst[i], s);
          // curved (geodesic-like) transport: bow the straight path
          const bow = Math.sin(s * Math.PI) * 0.35;
          tmp.y += bow * Math.sin(i * 2.4);
          P[i].lerp(tmp, Math.min(1, dt * 6));
          if (this._attr) {
            const d = P[i].distanceTo(this._attr);
            const infl = Math.exp(-d * d * 1.4) * 1.1;
            tmp.copy(P[i]).sub(this._attr); if (tmp.lengthSq() > 1e-6) tmp.normalize();
            P[i].addScaledVector(tmp, infl * dt * 4);
          }
          tr.push(i, P[i].x, P[i].y, P[i].z);
        }
        tr.commit();
        if (this._auto) this._spin += dt * 0.06;
      };
    }
  }

  let _dotTex = null;
  function dotTexture(T) {
    if (_dotTex) return _dotTex;
    const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.72, 'rgba(255,255,255,1)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, s, s);
    _dotTex = new T.CanvasTexture(c);
    return _dotTex;
  }
  function sphereGrid(T, rad) {
    const gp = [];
    const sph = (lat, lon) => ({ x: rad * Math.cos(lat) * Math.cos(lon), y: rad * Math.sin(lat), z: rad * Math.cos(lat) * Math.sin(lon) });
    const push = (a, b) => gp.push(a.x, a.y, a.z, b.x, b.y, b.z);
    for (let i = -2; i <= 2; i++) {
      const lat = i * Math.PI / 6;
      for (let j = 0; j < 48; j++) push(sph(lat, j / 48 * Math.PI * 2), sph(lat, (j + 1) / 48 * Math.PI * 2));
    }
    for (let i = 0; i < 6; i++) {
      const lon = i * Math.PI / 6;
      for (let j = 0; j < 48; j++) push(sph(-Math.PI / 2 + j / 48 * Math.PI * 2, lon), sph(-Math.PI / 2 + (j + 1) / 48 * Math.PI * 2, lon));
    }
    const ge = new T.BufferGeometry();
    ge.setAttribute('position', new T.BufferAttribute(new Float32Array(gp), 3));
    return ge;
  }

  if (!customElements.get('geo-hero')) customElements.define('geo-hero', GeoHero);
})();
