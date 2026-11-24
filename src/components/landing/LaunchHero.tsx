/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Send } from "lucide-react";
import { useTranslation, localizePath } from "@/lib/i18n";
import { goTrack } from "@/lib/analytics";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { PointerGlyphs } from "./PointerGlyphs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Full-bleed golden-mascot hero.
 *
 * The 3D canvas fills the entire section; the copy panel floats over the
 * left side on desktop (centered on mobile) with a glass blur so the mascot
 * and its gaze loop, blink, lock-on ring, bezier route dots, halo, polar
 * grid and road dashes remain the visual anchor while CTAs stay legible.
 *
 * The animator is a direct port of the design-system reference at
 * `ezymap-design-system/assets/3d/preview.html` — same GAZE_KEYS, same
 * ROAD_START/LENGTH, same timing constants — driven from the bundled
 * `three@0.160.0` package.
 *
 * WebGL failure degrades to the static poster. Render loop pauses when the
 * hero is off-screen or the tab is hidden. `?t=<seconds>` freezes a single
 * pose for screenshots. `prefers-reduced-motion: reduce` skips WebGL
 * entirely and shows the poster at the clean lock-on pose.
 */

const GLB_URL = "/assets/3d/mascot.glb";
const POSTER_URL = "/assets/3d/mascot-poster.webp";

// Animator constants — kept bit-for-bit identical to preview.html so any
// future design-system change can be diffed against this file.
const TAU = Math.PI * 2;
const GAZE_LOOP = 8;
const LOCK_AT = 6.9;
const ROAD_START = 0.42;
const ROAD_LENGTH = 1.2;
const CLEAN_POSE_TIME = 0.8;
const GAZE_KEYS: [number, number, number][] = [
  [0, 0, 0.3],
  [1.2, 0, 0.3],
  [2.6, -0.45, 0.12],
  [3.2, -0.45, 0.12],
  [4.8, 0.45, 0.12],
  [5.4, 0.45, 0.12],
  [6.4, 0, 0.18],
  [6.9, 0, 0.4],
  [7.3, 0, 0.3],
  [8, 0, 0.3],
];
const TRADING_PAIRS = [
  { text: "XAUUSD", x: 0.78, y: 0.62, z: 0.25, phase: 0, highlight: true },
  { text: "EURUSD", x: -0.82, y: 0.78, z: 0.1, phase: 1.2, highlight: false },
  { text: "GBPUSD", x: -0.7, y: 0.12, z: 0.35, phase: 2.4, highlight: false },
  { text: "USDJPY", x: 0.8, y: -0.2, z: -0.1, phase: 3.6, highlight: false },
  { text: "BTCUSD", x: -0.2, y: 1.05, z: -0.45, phase: 4.8, highlight: false },
];

const wave = (t: number, period: number) => 0.5 - 0.5 * Math.cos((TAU * t) / period);
const mod = (a: number, b: number) => ((a % b) + b) % b;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

function sampleGaze(c: number, out: { yaw: number; pitch: number }) {
  for (let i = 1; i < GAZE_KEYS.length; i++) {
    const a = GAZE_KEYS[i - 1];
    const b = GAZE_KEYS[i];
    if (c <= b[0]) {
      const k = smooth(clamp01((c - a[0]) / (b[0] - a[0])));
      out.yaw = a[1] + (b[1] - a[1]) * k;
      out.pitch = a[2] + (b[2] - a[2]) * k;
      return out;
    }
  }
  const last = GAZE_KEYS[GAZE_KEYS.length - 1];
  out.yaw = last[1];
  out.pitch = last[2];
  return out;
}

export function LaunchHero() {
  const { t, locale } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const [webglFailed, setWebglFailed] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fixedTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("t");
    const v = raw === null ? NaN : Number(raw);
    fixedTimeRef.current = Number.isFinite(v) ? v : null;
  }, []);

  // Visibility gating: pause the render loop entirely when off-screen.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      ([e]) => root.style.setProperty("--hero-inview", e.isIntersecting ? "1" : "0"),
      { threshold: 0.05 },
    );
    obs.observe(root);
    return () => obs.disconnect();
  }, []);

  // Three.js init + full mascot animator.
  useEffect(() => {
    if (webglFailed || reducedMotion) return;
    const root = containerRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const pointer = { x: 0, y: 0 };
    const smoothPointer = { x: 0, y: 0 };
    let smoothScroll = 0;
    let raf = 0;
    let time = 0;
    let disposed = false;
    const motionOn = fixedTimeRef.current === null;

    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;

    const onMove = (e: PointerEvent) => {
      const b = root.getBoundingClientRect();
      pointer.x = Math.max(-1, Math.min(1, ((e.clientX - b.left) / (b.width || 1)) * 2 - 1));
      pointer.y = Math.max(-1, Math.min(1, ((e.clientY - b.top) / (b.height || 1)) * 2 - 1));
    };
    const onLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);

    const onResize = () => {
      if (!renderer || !camera) return;
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", onResize);

    try {
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(35, w / h, 0.01, 100);
      camera.position.set(0, 0.4, 2.8);

      scene.add(new THREE.HemisphereLight(0xf4dc93, 0x0a0c0b, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(2, 3, 4);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x9fb4d6, 0.5);
      fill.position.set(-3, 1, -2);
      scene.add(fill);

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      renderer.setClearColor(0x0a0c0b, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      new GLTFLoader().load(
        GLB_URL,
        (gltf) => {
          if (disposed) return;
          const mascot = gltf.scene;
          mascot.traverse((n: any) => {
            if (n.isMesh) {
              n.castShadow = true;
              n.receiveShadow = true;
            }
          });

          // Auto-frame the camera to the model's bounding box, matching
          // preview.html's frame() function exactly. This ensures the mascot
          // fills the viewport consistently regardless of GLB scale.
          const box = new THREE.Box3().setFromObject(mascot);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const radius = Math.max(size.x, size.y, size.z) / 2 || 1;

          // Center the model at origin first
          mascot.position.sub(center);

          // Position camera using the same formula as preview.html:
          // offset from center by radius * factor, looking at center.
          // Narrow screens pull the camera further back (and raise it a touch)
          // so the halo, polar grid, road and pair tags all stay in frame.
          const isWide = (root.clientWidth || 0) >= 900;
          const isNarrow = (root.clientWidth || 0) < 900;
          const xOffset = isWide ? radius * 0.6 : 0;
          const zoomOut = isNarrow ? 1.35 : 1;
          camera.position.set(xOffset, radius * (isNarrow ? 0.42 : 0.35), radius * 2.6 * zoomOut);
          camera.lookAt(xOffset, isNarrow ? radius * 0.08 : 0, 0);
          camera.near = radius / 100;
          camera.far = radius * 100;
          camera.updateProjectionMatrix();

          scene.add(mascot);

          const animator = buildAnimator(mascot);
          if (fixedTimeRef.current !== null && animator) {
            animator(fixedTimeRef.current, 0);
          } else if (!motionOn && animator) {
            animator(CLEAN_POSE_TIME, 0);
          }

          let prev = performance.now();
          const tick = (now: number) => {
            if (disposed) return;
            raf = requestAnimationFrame(tick);
            const dt = Math.min((now - prev) / 1000, 0.1);
            prev = now;
            const visible = root.style.getPropertyValue("--hero-inview") === "1";
            if (visible && !document.hidden && motionOn && animator) {
              time += dt;
              animator(time, dt);
            }
            renderer.render(scene, camera);
          };
          raf = requestAnimationFrame(tick);
          setWebglReady(true);
        },
        undefined,
        (err) => {
          if (disposed) return;
          console.error("mascot glb load failed", err);
          setWebglFailed(true);
        },
      );
    } catch (err) {
      console.error("three init failed", err);
      setWebglFailed(true);
    }

    function buildAnimator(object: THREE.Object3D) {
      const named = (prefix: string) => {
        const out: THREE.Mesh[] = [];
        object.traverse((n: any) => {
          if (n.isMesh && n.name.startsWith(prefix)) out.push(n);
        });
        return out;
      };

      // Pivot at the plaque centre: the logo turns in place like the SVG.
      const pivot = new THREE.Group();
      pivot.position.set(0, 0.08, 0.24);
      object.add(pivot);
      named("logo_").forEach((m) => pivot.attach(m));

      // Head carries the green visor wordmark; yaw/pitch follow the gaze story.
      const head = new THREE.Group();
      head.position.set(0, 0.5, 0);
      object.add(head);

      const pixels = named("eye_px");
      let glowMat: THREE.MeshStandardMaterial | null = null;
      if (pixels.length > 0) {
        const src = Array.isArray(pixels[0].material)
          ? (pixels[0].material as THREE.Material[])[0]
          : (pixels[0].material as THREE.Material);
        glowMat = src.clone() as THREE.MeshStandardMaterial;
        glowMat.emissive = new THREE.Color(0x5be39a);
        glowMat.emissiveIntensity = 0.9;
        const merged =
          pixels.length > 1 ? mergeGeometries(pixels.map((m) => m.geometry), false) : null;
        if (merged) {
          const text = new THREE.Mesh(merged, glowMat);
          text.name = "eye_text";
          pixels.forEach((m) => {
            m.removeFromParent();
            m.geometry.dispose();
          });
          object.add(text);
        } else {
          pixels.forEach((m) => {
            m.material = glowMat!;
          });
        }
      }

      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(0, 0.02, 0);
      head.add(eyeGroup);
      named("head").forEach((m) => head.attach(m));
      named("eye_").forEach((m) => eyeGroup.attach(m));

      // Pair tags as sprites around the mascot.
      const makeSprite = (text: string, highlight: boolean) => {
        const scale = 2;
        const font = `600 ${(highlight ? 40 : 32) * scale}px ui-monospace, Menlo, Consolas, monospace`;
        const measure = document.createElement("canvas").getContext("2d")!;
        measure.font = font;
        const padX = 22 * scale;
        const height = (highlight ? 74 : 60) * scale;
        const cv = document.createElement("canvas");
        cv.width = Math.ceil(measure.measureText(text).width + padX * 2);
        cv.height = height;
        const ctx = cv.getContext("2d")!;
        const inset = 3 * scale;
        const r = height / 2 - inset;
        ctx.beginPath();
        ctx.moveTo(inset + r, inset);
        ctx.arcTo(cv.width - inset, inset, cv.width - inset, cv.height - inset, r);
        ctx.arcTo(cv.width - inset, cv.height - inset, inset, cv.height - inset, r);
        ctx.arcTo(inset, cv.height - inset, inset, inset, r);
        ctx.arcTo(inset, inset, cv.width - inset, inset, r);
        ctx.closePath();
        ctx.fillStyle = "rgba(10, 12, 11, 0.84)";
        ctx.fill();
        ctx.lineWidth = 3 * scale;
        ctx.strokeStyle = highlight ? "#e0bc63" : "#5be39a";
        ctx.stroke();
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = highlight ? "#e0bc63" : "#f2f4f2";
        ctx.fillText(text, cv.width / 2, cv.height / 2 + scale);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        const sp = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }),
        );
        const wh = highlight ? 0.17 : 0.13;
        sp.scale.set((wh * cv.width) / cv.height, wh, 1);
        return sp;
      };
      const tags = TRADING_PAIRS.map((p) => {
        const sp = makeSprite(p.text, p.highlight);
        sp.position.set(p.x, p.y, p.z);
        object.add(sp);
        return { sprite: sp, baseY: p.y, phase: p.phase };
      });

      const torso = named("torso")[0] || null;

      const moving: { mesh: THREE.Mesh; z0: number; speed: number }[] = [];
      for (const m of [...named("road_dash_"), ...named("road_traveler")]) {
        const b = new THREE.Box3().setFromObject(m);
        moving.push({
          mesh: m,
          z0: (b.min.z + b.max.z) / 2,
          speed: m.name.startsWith("road_traveler") ? 0.3 : 0.25,
        });
      }

      // Halo behind the mascot.
      const haloCv = document.createElement("canvas");
      haloCv.width = haloCv.height = 256;
      const hctx = haloCv.getContext("2d")!;
      const grad = hctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, "rgba(224, 188, 99, 0.32)");
      grad.addColorStop(1, "rgba(224, 188, 99, 0)");
      hctx.fillStyle = grad;
      hctx.fillRect(0, 0, 256, 256);
      const haloTex = new THREE.CanvasTexture(haloCv);
      haloTex.colorSpace = THREE.SRGBColorSpace;
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 1.6),
        new THREE.MeshBasicMaterial({
          map: haloTex,
          transparent: true,
          depthWrite: false,
          opacity: 0.6,
        }),
      );
      halo.position.set(0, 0.02, -0.5);
      object.add(halo);

      // Polar grid under the feet.
      const grid = new THREE.PolarGridHelper(1.7, 16, 6, 64, 0xe0bc63, 0x5be39a);
      grid.position.y = -0.69;
      (grid.material as any).transparent = true;
      (grid.material as any).opacity = 0.16;
      (grid.material as any).depthWrite = false;
      object.add(grid);

      // Lock-on ring that pulses at LOCK_AT.
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.96, 1, 64),
        new THREE.MeshBasicMaterial({
          color: 0xe0bc63,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, -0.68, 0);
      object.add(ring);

      // Bezier route dots that draw in and fade.
      const DOTS = 14;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0.4, 0.3),
        new THREE.Vector3(0, 0.38, 0.78),
        new THREE.Vector3(0, 0.2, 0.34),
      );
      const dotPoints = Array.from({ length: DOTS }, (_, i) => curve.getPoint(i / (DOTS - 1)));
      const dots = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.014, 8, 6),
        new THREE.MeshBasicMaterial({
          color: 0x5be39a,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
        DOTS,
      );
      dots.frustumCulled = false;
      object.add(dots);
      const dummy = new THREE.Object3D();

      const gaze = { yaw: 0, pitch: 0 };
      const baseY = object.position.y;

      return (t: number, dt: number) => {
        const c = mod(t, GAZE_LOOP);
        const follow = 1 - Math.exp(-dt * 3);
        smoothPointer.x += (pointer.x - smoothPointer.x) * follow;
        smoothPointer.y += (pointer.y - smoothPointer.y) * follow;
        const scrollTarget = clamp01(
          typeof window !== "undefined" ? window.scrollY / Math.max(1, window.innerHeight) : 0,
        );
        smoothScroll += (scrollTarget - smoothScroll) * follow;

        object.position.y = baseY - 0.012 * wave(t, 6);
        // Whole body tilts toward pointer (playful interactivity) + scroll yaw
        object.rotation.y = 0.6 * smoothScroll + 0.35 * smoothPointer.x;
        object.rotation.x = 0.18 * smoothPointer.y;
        if (torso) torso.scale.setScalar(1 + 0.015 * wave(t, 4));

        sampleGaze(c, gaze);
        // Head adds its own gaze on top of body tilt for layered response
        head.rotation.y = gaze.yaw + 0.4 * smoothPointer.x;
        head.rotation.x = gaze.pitch + 0.25 * smoothPointer.y;

        const bp = mod(t, 4.3);
        const blink = bp < 0.18 ? Math.sin((Math.PI * bp) / 0.18) : 0;
        eyeGroup.scale.y = 1 - 0.92 * blink;
        if (glowMat) glowMat.emissiveIntensity = 0.8 + 0.25 * wave(t, 2.4);

        const bump = Math.sin(Math.PI * clamp01((c - LOCK_AT) / 0.5));
        pivot.position.y = 0.08 + 0.025 * bump;
        pivot.rotation.y = 0.25 * Math.sin((TAU * t) / 4.5);

        const ringK = clamp01((c - LOCK_AT) / 1.1);
        ring.scale.setScalar(0.6 + 0.9 * (1 - (1 - ringK) * (1 - ringK)));
        (ring.material as THREE.MeshBasicMaterial).opacity = c >= LOCK_AT ? 0.7 * (1 - ringK) : 0;

        const drawn = clamp01((c - 6.3) / 0.9);
        const fade = c > 7.4 ? clamp01(1 - (c - 7.4) / 0.6) : 1;
        for (let i = 0; i < DOTS; i++) {
          const sz = clamp01(drawn * DOTS - i) * fade;
          dummy.position.copy(dotPoints[i]);
          dummy.scale.setScalar(Math.max(sz, 0.0001));
          dummy.updateMatrix();
          dots.setMatrixAt(i, dummy.matrix);
        }
        dots.instanceMatrix.needsUpdate = true;

        for (const tag of tags)
          tag.sprite.position.y = tag.baseY + 0.025 * Math.sin((TAU * t) / 5 + tag.phase);

        halo.scale.setScalar(0.92 + 0.14 * wave(t, 4));
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.4 * wave(t, 4);
        grid.rotation.y = t * 0.04;
        for (const it of moving) {
          const z = ROAD_START + mod(it.z0 - ROAD_START + t * it.speed, ROAD_LENGTH);
          it.mesh.position.z = z - it.z0;
        }
      };
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      if (scene) {
        scene.traverse((n: any) => {
          if (n.geometry) n.geometry.dispose();
          if (n.material) {
            const mats = Array.isArray(n.material) ? n.material : [n.material];
            mats.forEach((m: any) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          }
        });
      }
      if (renderer) renderer.dispose();
    };
  }, [webglFailed, reducedMotion]);

  return (
    <section id="hero" className="hero-section" ref={containerRef} aria-label="Golden mascot">
      <div className="hero__grain" aria-hidden="true" />
      <div className="hero__spotlight" aria-hidden="true" />
      <PointerGlyphs />

      <div className="hero__stage">
        {webglFailed || reducedMotion ? (
          <div className="hero__fallback" aria-label="Golden mascot">
            <img
              src={POSTER_URL}
              alt="Golden mascot"
              decoding="async"
              loading="eager"
              className="hero__poster"
            />
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className={`hero__canvas ${webglReady ? "hero__canvas--ready" : ""}`}
              aria-hidden="true"
            />
            {!webglReady && (
              <div className="hero__poster-placeholder" aria-hidden="true">
                <img
                  src={POSTER_URL}
                  alt=""
                  decoding="async"
                  loading="eager"
                  className="hero__poster"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="hero__copy">
        <a
          className="hero__announcement"
          href={localizePath("/free-channel", locale)}
          onClick={() => goTrack("hero_announce_zoom")}
        >
          <span className="hero__status" aria-hidden="true" />
          {t("announce_pill")}
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <div className="hero__actions">
          <a
            className="hero__button hero__button--primary"
            href={localizePath("/free-channel", locale)}
            onClick={() => goTrack("hero_join_free")}
          >
            <Send size={17} />
            {t("hero_cta_join")}
          </a>
          <a
            className="hero__button hero__button--secondary"
            href="#packages"
            onClick={() => goTrack("hero_see_packages")}
          >
            {t("hero_cta_packages")}
            <ArrowUpRight size={17} />
          </a>
        </div>
        <a
          className="hero__ebook-link"
          href={localizePath("/ebooks/technical-analysis", locale)}
          onClick={() => goTrack("hero_free_ebook")}
        >
          <BookOpen size={15} />
          {t("hero_cta_ebook")}
        </a>
      </div>
    </section>
  );
}
