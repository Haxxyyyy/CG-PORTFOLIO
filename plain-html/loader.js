import * as THREE from 'three';

const screen = document.querySelector('#loading-screen');
const canvas = screen?.querySelector('.loading-feathers');
if (!screen || !canvas) {
  // The portfolio itself remains usable if its optional intro markup is removed.
} else {
  const siteShell = document.querySelector('.site-shell');
  const skipButton = screen.querySelector('.loader-skip');
  const progress = screen.querySelector('.loading-progress i');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const startedAt = performance.now();
  const minDuration = reducedMotion.matches ? 650 : 2350;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  camera.position.set(0, 0, 12);

  let renderer;
  let frame = 0;
  let active = true;
  let dismissed = false;
  let worldWidth = 1;
  let worldHeight = 1;
  let featherItems = [];
  let windLines = [];
  let featherGeometry;
  let vaneTexture;

  screen.classList.add('is-active');
  siteShell?.setAttribute('inert', '');

  const random = (seed) => {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  function makeVaneTexture() {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 1024;
    const context = textureCanvas.getContext('2d');
    const base = context.createLinearGradient(256, 1024, 256, 0);
    base.addColorStop(0, '#b4a66e');
    base.addColorStop(0.18, '#647d53');
    base.addColorStop(0.40, '#206d5b');
    base.addColorStop(0.67, '#155b58');
    base.addColorStop(0.86, '#173c55');
    base.addColorStop(1, '#9b9462');
    context.fillStyle = base;
    context.fillRect(0, 0, 512, 1024);

    const sheen = context.createLinearGradient(0, 0, 512, 0);
    sheen.addColorStop(0, 'rgba(225, 211, 158, .31)');
    sheen.addColorStop(0.32, 'rgba(194, 218, 174, .04)');
    sheen.addColorStop(0.56, 'rgba(63, 190, 170, .22)');
    sheen.addColorStop(1, 'rgba(9, 36, 43, .3)');
    context.fillStyle = sheen;
    context.fillRect(0, 0, 512, 1024);

    // Fine paired barbs give the vane a feathered surface instead of a flat decal.
    for (let y = 92; y < 990; y += 9) {
      const progressAlong = y / 1024;
      const spread = 235 * Math.sin(Math.PI * (0.08 + progressAlong * 0.87));
      const lineAlpha = 0.075 + Math.sin(y * 0.031) * 0.025;
      context.strokeStyle = `rgba(227, 218, 172, ${lineAlpha})`;
      context.lineWidth = y % 27 === 0 ? 1.1 : 0.65;
      context.beginPath();
      context.moveTo(256, y);
      context.quadraticCurveTo(256 - spread * 0.48, y - 10, 256 - spread, y - 27);
      context.moveTo(256, y);
      context.quadraticCurveTo(256 + spread * 0.48, y - 10, 256 + spread, y - 27);
      context.stroke();
    }

    // The peacock eye is built in layered pigments with a restrained gold rim.
    context.save();
    context.translate(256, 204);
    context.scale(0.75, 1.12);
    const eye = [
      [104, 134, '#b49a5a'],
      [90, 119, '#1e4b3d'],
      [73, 99, '#347c68'],
      [58, 81, '#4aa59a'],
      [43, 63, '#235a83'],
      [27, 43, '#182f49'],
      [12, 22, '#091d25'],
    ];
    for (const [rx, ry, color] of eye) {
      const gradient = context.createRadialGradient(-13, -23, 4, 0, 0, ry);
      gradient.addColorStop(0, color === '#091d25' ? '#477c78' : color);
      gradient.addColorStop(0.68, color);
      gradient.addColorStop(1, color);
      context.beginPath();
      context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      context.fillStyle = gradient;
      context.fill();
    }
    context.restore();

    // A slight translucent glaze makes the colored vanes catch the scene lights.
    const glaze = context.createLinearGradient(100, 0, 440, 1024);
    glaze.addColorStop(0, 'rgba(239, 225, 167, .12)');
    glaze.addColorStop(0.45, 'rgba(83, 203, 178, .035)');
    glaze.addColorStop(1, 'rgba(12, 30, 38, .15)');
    context.fillStyle = glaze;
    context.fillRect(0, 0, 512, 1024);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  function makeFeatherGeometry() {
    const rows = 42;
    const columns = 16;
    const positions = [];
    const uvs = [];
    const indices = [];
    const smoothstep = (a, b, value) => {
      const t = THREE.MathUtils.clamp((value - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    };

    for (let row = 0; row <= rows; row += 1) {
      const t = row / rows;
      const baseSpread = 0.012 + 0.34 * Math.sin(Math.PI * Math.pow(t, 0.82)) ** 0.74;
      const eyeBulge = 0.085 * Math.exp(-((t - 0.80) ** 2) / 0.012);
      const tipTaper = 1 - smoothstep(0.91, 1, t) * 0.98;
      const halfWidth = Math.max(0.008, (baseSpread + eyeBulge) * tipTaper);
      const curveZ = 0.085 * Math.sin(t * Math.PI) - 0.035 * t;

      for (let column = 0; column <= columns; column += 1) {
        const u = column / columns;
        const x = (u * 2 - 1) * halfWidth;
        const camber = (1 - Math.abs(u * 2 - 1)) * 0.085;
        positions.push(x, (t - 0.5) * 2.55, curveZ + camber);
        uvs.push(u, 1 - t);
      }
    }

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const a = row * (columns + 1) + column;
        const b = a + columns + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function makeFeather(seed, index, count) {
    const scale = 0.48 + random(seed * 2.13) * 0.72;
    const depth = random(seed * 8.9);
    const material = new THREE.MeshPhysicalMaterial({
      map: vaneTexture,
      color: new THREE.Color().setHSL(0.39 + random(seed * 4.6) * 0.13, 0.38, 0.82),
      roughness: 0.44 + random(seed * 7.1) * 0.18,
      metalness: 0.12,
      clearcoat: 0.58,
      clearcoatRoughness: 0.32,
      transparent: true,
      opacity: 0.34 + random(seed * 5.8) * 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const group = new THREE.Group();
    const vane = new THREE.Mesh(featherGeometry, material);
    group.add(vane);

    const rachisCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -1.3, 0.08),
      new THREE.Vector3(0.025, -0.52, 0.15),
      new THREE.Vector3(-0.008, 0.28, 0.18),
      new THREE.Vector3(0, 1.27, 0.08),
    ]);
    const rachis = new THREE.Mesh(
      new THREE.TubeGeometry(rachisCurve, 24, 0.009, 5, false),
      new THREE.MeshStandardMaterial({
        color: '#d7c68e',
        metalness: 0.38,
        roughness: 0.42,
        transparent: true,
        opacity: material.opacity * 0.72,
      }),
    );
    group.add(rachis);

    group.scale.setScalar(scale);
    group.position.set(
      (random(seed * 3.7) - 0.5) * worldWidth * 1.9,
      (random(seed * 5.3) - 0.5) * worldHeight * 1.9,
      -2.3 + depth * 3.6,
    );
    group.rotation.set(
      (random(seed * 9.4) - 0.5) * 0.48,
      (random(seed * 10.3) - 0.5) * 0.92,
      0.45 + (random(seed * 6.8) - 0.5) * 0.92,
    );
    group.userData = {
      seed,
      phase: random(seed * 11.1) * Math.PI * 2,
      startX: group.position.x,
      startY: group.position.y,
      scale,
      depth,
      index,
      count,
      speed: 0.18 + random(seed * 12.2) * 0.24,
      sway: 0.14 + random(seed * 13.3) * 0.17,
    };
    scene.add(group);
    return group;
  }

  function makeWindLines() {
    const material = new THREE.LineBasicMaterial({
      color: '#c2d0a9',
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
    });
    for (let lineIndex = 0; lineIndex < 5; lineIndex += 1) {
      const points = [];
      for (let step = 0; step <= 24; step += 1) {
        const t = step / 24;
        points.push(new THREE.Vector3(
          (t - 0.5) * worldWidth * 1.4,
          Math.sin(t * Math.PI * 2 + lineIndex * 1.1) * 0.18 + (lineIndex - 2) * 0.78,
          -3.7 - lineIndex * 0.03,
        ));
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        material.clone(),
      );
      line.userData.phase = lineIndex * 1.37;
      line.userData.baseY = (lineIndex - 2) * 0.78;
      scene.add(line);
      windLines.push(line);
    }
  }

  function resize() {
    if (!renderer) return;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const aspect = width / height;
    worldHeight = 7.8;
    worldWidth = worldHeight * aspect;
    camera.left = -worldWidth / 2;
    camera.right = worldWidth / 2;
    camera.top = worldHeight / 2;
    camera.bottom = -worldHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(width, height, false);

    if (featherItems.length) {
      const count = window.innerWidth < 640 ? 15 : Math.min(30, Math.max(22, Math.round(width / 48)));
      while (featherItems.length > count) {
        const item = featherItems.pop();
        scene.remove(item);
        item.traverse((child) => {
          if (child.geometry !== featherGeometry) child.geometry?.dispose();
          if (child.material !== vaneTexture) child.material?.dispose();
        });
      }
      while (featherItems.length < count) {
        featherItems.push(makeFeather(featherItems.length + 1, featherItems.length, count));
      }
    }
  }

  function initScene() {
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch (error) {
      console.warn('The feather intro could not start WebGL:', error);
      return false;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    scene.add(new THREE.HemisphereLight('#dce8c4', '#10261b', 2.05));

    const keyLight = new THREE.DirectionalLight('#fff2cf', 2.3);
    keyLight.position.set(-4, 5, 8);
    scene.add(keyLight);
    const tealLight = new THREE.PointLight('#57c4a4', 20, 18, 2);
    tealLight.position.set(4, 1, 4);
    scene.add(tealLight);
    const blueLight = new THREE.PointLight('#637fc0', 13, 16, 2);
    blueLight.position.set(-3, -3, 2);
    scene.add(blueLight);

    resize();
    vaneTexture = makeVaneTexture();
    featherGeometry = makeFeatherGeometry();
    const count = window.innerWidth < 640 ? 15 : Math.min(30, Math.max(22, Math.round(canvas.clientWidth / 48)));
    featherItems = Array.from({ length: count }, (_, index) => makeFeather(index + 1, index, count));
    makeWindLines();
    return true;
  }

  function render(time) {
    if (!active || !renderer) return;
    const seconds = (time - startedAt) / 1000;

    for (const feather of featherItems) {
      const data = feather.userData;
      const phase = seconds * (0.6 + data.speed) + data.phase;
      const travel = seconds * data.speed;
      const horizontalRange = worldWidth + 4.4;
      let x = ((data.startX + travel + worldWidth / 2 + 2.2) % horizontalRange + horizontalRange) % horizontalRange;
      x -= worldWidth / 2 + 2.2;
      const depthFactor = 0.7 + data.depth * 0.6;
      feather.position.x = x + Math.sin(phase * 0.43) * 0.12;
      feather.position.y = data.startY
        + Math.sin(phase) * data.sway
        + Math.sin(phase * 0.49 + data.index) * 0.19
        + seconds * (0.025 + data.depth * 0.025);
      feather.rotation.x = Math.sin(phase * 0.72) * 0.42;
      feather.rotation.y = Math.sin(phase * 0.54 + data.index) * 0.8;
      feather.rotation.z = 0.44 + Math.sin(phase * 0.66) * 0.22;
      feather.position.z = -2.4 + data.depth * 3.6 + Math.sin(phase * 0.37) * 0.22;
      feather.scale.setScalar(data.scale * depthFactor * (1 + Math.sin(phase * 0.8) * 0.018));
    }

    for (const line of windLines) {
      line.position.x = Math.sin(seconds * 0.12 + line.userData.phase) * 0.8;
      line.position.y = line.userData.baseY + Math.sin(seconds * 0.22 + line.userData.phase) * 0.12;
    }

    renderer.render(scene, camera);
    if (progress) {
      const percent = Math.min(96, 8 + ((time - startedAt) / minDuration) * 88);
      screen.style.setProperty('--loading-progress', `${percent}%`);
    }
    if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(render);
  }

  function cleanup() {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('visibilitychange', handleVisibility);
    skipButton?.removeEventListener('click', beginExit);
    if (renderer) {
      scene.traverse((object) => {
        if (object.geometry && object.geometry !== featherGeometry) object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else if (object.material) object.material.dispose();
      });
      featherGeometry?.dispose();
      vaneTexture?.dispose();
      renderer.dispose();
    }
  }

  function beginExit() {
    if (dismissed) return;
    dismissed = true;
    active = false;
    siteShell?.removeAttribute('inert');
    cleanup();
    screen.classList.add('is-leaving');
    window.setTimeout(() => screen.remove(), 950);
  }

  function finishAfterLoad() {
    const remaining = Math.max(0, minDuration - (performance.now() - startedAt));
    window.setTimeout(beginExit, remaining);
  }

  function handleResize() {
    resize();
    if (reducedMotion.matches && renderer) renderer.render(scene, camera);
  }

  function handleVisibility() {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!document.hidden && active && !reducedMotion.matches && !frame) {
      frame = requestAnimationFrame(render);
    }
  }

  skipButton?.addEventListener('click', beginExit);
  if (initScene()) {
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    if (reducedMotion.matches) renderer.render(scene, camera);
    else frame = requestAnimationFrame(render);
  }

  if (document.readyState === 'complete') finishAfterLoad();
  else window.addEventListener('load', finishAfterLoad, { once: true });
  window.setTimeout(beginExit, 4200);
}
