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
  let sceneReady = false;
  let pageReady = document.readyState === 'complete';
  let finishScheduled = false;

  screen.classList.add('is-active');
  siteShell?.setAttribute('inert', '');

  const random = (seed) => {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  function makeFeatherGeometry() {
    const rows = 38;
    const columns = 28;
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let row = 0; row <= rows; row += 1) {
      const t = row / rows;

      for (let column = 0; column <= columns; column += 1) {
        const u = column / columns;
        const camber = 0.13 * (1 - Math.abs(u * 2 - 1));
        const sweep = 0.08 * Math.sin(t * Math.PI);
        positions.push((u - 0.5) * 2.267, (t - 0.5) * 2.72, camber + sweep);
        uvs.push(u, t);
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
    const scale = 0.34 + random(seed * 2.13) * 0.55;
    const depth = random(seed * 8.9);
    const material = new THREE.MeshPhysicalMaterial({
      map: vaneTexture,
      color: '#f3f5e9',
      roughness: 0.5 + random(seed * 7.1) * 0.16,
      metalness: 0.04,
      clearcoat: 0.34,
      clearcoatRoughness: 0.42,
      transparent: true,
      opacity: 0.3 + random(seed * 5.8) * 0.32,
      alphaTest: 0.012,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const group = new THREE.Group();
    const vane = new THREE.Mesh(featherGeometry, material);
    group.add(vane);

    group.scale.setScalar(scale);
    group.position.set(
      (random(seed * 3.7) - 0.5) * worldWidth * 1.9,
      (random(seed * 5.3) - 0.5) * worldHeight * 1.9,
      -2.3 + depth * 3.6,
    );
    group.rotation.set(
      (random(seed * 9.4) - 0.5) * 0.48,
      (random(seed * 10.3) - 0.5) * 0.92,
      -0.36 + (random(seed * 6.8) - 0.5) * 0.5,
    );
    group.userData = {
      seed,
      phase: random(seed * 11.1) * Math.PI * 2,
      startX: group.position.x,
      startY: group.position.y,
      scale,
      depth,
      tilt: group.rotation.z,
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
      const count = window.innerWidth < 640 ? 11 : Math.min(18, Math.max(14, Math.round(width / 110)));
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
    const loader = new THREE.TextureLoader();
    loader.load(
      './assets/peacock-feather.png',
      (texture) => {
        if (!active) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        vaneTexture = texture;
        featherGeometry = makeFeatherGeometry();
        const count = window.innerWidth < 640 ? 11 : Math.min(18, Math.max(14, Math.round(canvas.clientWidth / 110)));
        featherItems = Array.from({ length: count }, (_, index) => makeFeather(index + 1, index, count));
        makeWindLines();
        sceneReady = true;
        if (reducedMotion.matches) renderer.render(scene, camera);
        else if (!document.hidden && !frame) frame = requestAnimationFrame(render);
        maybeFinishAfterLoad();
      },
      undefined,
      (error) => {
        console.warn('The supplied peacock feather image could not be loaded:', error);
        sceneReady = true;
        maybeFinishAfterLoad();
      },
    );
    return true;
  }

  function render(time) {
    if (!active || !renderer || !sceneReady) return;
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
      feather.rotation.z = data.tilt + Math.sin(phase * 0.66) * 0.22;
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

  function maybeFinishAfterLoad() {
    if (!pageReady || !sceneReady || finishScheduled) return;
    finishScheduled = true;
    const remaining = Math.max(0, minDuration - (performance.now() - startedAt));
    window.setTimeout(beginExit, remaining);
  }

  function handlePageLoad() {
    pageReady = true;
    maybeFinishAfterLoad();
  }

  function handleResize() {
    resize();
    if (reducedMotion.matches && renderer) renderer.render(scene, camera);
  }

  function handleVisibility() {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!document.hidden && active && sceneReady && !reducedMotion.matches && !frame) {
      frame = requestAnimationFrame(render);
    }
  }

  skipButton?.addEventListener('click', beginExit);
  if (initScene()) {
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
  } else {
    sceneReady = true;
  }

  if (pageReady) maybeFinishAfterLoad();
  else window.addEventListener('load', handlePageLoad, { once: true });
  window.setTimeout(beginExit, 4200);
}
