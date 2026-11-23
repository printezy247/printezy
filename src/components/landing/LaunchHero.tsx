/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, BookOpen, Send } from "lucide-react";
import { useTranslation, localizePath } from "@/lib/i18n";
import { goTrack } from "@/lib/analytics";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { PointerGlyphs } from "./PointerGlyphs";

/**
 * Golden-mascot hero. The golden mascot 3D asset is the clear focal point.
 * Supporting elements suit a trading brand: floating pair chips (XAUUSD most
 * prominent), cursor-hover trader-problem text fragments scattered as glyphs
 * that push away from the pointer, a soft radial glow behind the mascot, a
 * faint grid texture, a cursor-following spotlight and a fine grain overlay —
 * none of them headline-style text blocks.
 *
 * WebGL failure degrades to a static poster of the mascot. The render loop and
 * all animations pause when the hero is off-screen or under
 * `prefers-reduced-motion: reduce`. All decorative elements carry
 * `aria-hidden="true"`; the trader-problem lines are the only readable text in
 * the hero and use readable contrast.
 */

const GLB_URL = "/assets/3d/mascot.glb";
const POSTER_URL = "/assets/3d/mascot-poster.webp";

const PAIRS = [
  { symbol: "XAUUSD", x: 0, y: 1.18, z: -0.55, scale: 1, prominence: "high" },
  { symbol: "EURUSD", x: 1.05, y: 0.55, z: -0.3, scale: 0.6, prominence: "low" },
  { symbol: "GBPUSD", x: 1.05, y: -0.55, z: -0.3, scale: 0.6, prominence: "low" },
  { symbol: "USDJPY", x: -1.05, y: -0.55, z: -0.3, scale: 0.6, prominence: "low" },
  { symbol: "BTCUSD", x: -1.05, y: 0.55, z: -0.3, scale: 0.6, prominence: "low" },
];

const PROBLEMS = [
  "Chasing the entry again?",
  "Moved your stop too early?",
  "Revenge trade after a loss?",
  "Adding to a loser at the wick?",
  "No plan before the candle closes?",
];

type Pair = (typeof PAIRS)[number];

export function LaunchHero() {
  const { t, locale } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const [webglFailed, setWebglFailed] = useState(false);
  const [webglReady, setWebglReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const problemRef = useRef<HTMLSpanElement>(null);

  // Visible → render; off-screen → skip the render loop entirely.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        root.style.setProperty("--hero-inview", visible ? "1" : "0");
        if (visible) setWebglReady(true);
      },
      { threshold: 0.05 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // Three.js + mascot load (deferred so the page never blocks).
  useEffect(() => {
    if (webglFailed || reducedMotion) return;
    const root = containerRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const width = root.clientWidth || 1;
    const height = root.clientHeight || 1;
    const pointer = { x: 0, y: 0 };
    const smoothPointer = { x: 0, y: 0 };
    let raf = 0;
    let time = 0;

    let three: any;
    let renderer: any; // eslint-disable-line prefer-const
    let scene: any;
    let camera: any;
    let mascot: any;
    let chips: { sprite: any; baseY: number; phase: number }[] = [];
    let glow: any;
    let grid: any;
    let spotLight: any;

    async function init() {
      try {
        const threeUrl = "https://unpkg.com/three@0.160.0/build/three.module.js";
        const gltfUrl = "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
        const dynamicImport = new Function("u", "return import(u)") as (u: string) => Promise<any>;
        three = await dynamicImport(threeUrl);
        const { GLTFLoader } = await dynamicImport(gltfUrl);

        scene = new three.Scene();
        camera = new three.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, 3.6);

        scene.add(new three.AmbientLight(0xffffff, 0.35));

        const key = new three.DirectionalLight(0xffffff, 0.9);
        key.position.set(1.2, 1.6, 2.2);
        scene.add(key);

        const fill = new three.DirectionalLight(0x9fb4d6, 0.35);
        fill.position.set(-1.6, 0.6, -2);
        scene.add(fill);

        // Soft radial glow behind the mascot.
        const glowCanvas = document.createElement("canvas");
        glowCanvas.width = 256;
        glowCanvas.height = 256;
        const gctx = glowCanvas.getContext("2d")!;
        const grad = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        grad.addColorStop(0, "rgba(201, 161, 58, 0.35)");
        grad.addColorStop(1, "rgba(201, 161, 58, 0)");
        gctx.fillStyle = grad;
        gctx.fillRect(0, 0, 256, 256);
        const glowTex = new three.CanvasTexture(glowCanvas);
        glowTex.colorSpace = three.SRGBColorSpace;
        glow = new three.Mesh(
          new three.PlaneGeometry(4.4, 4.4),
          new three.MeshBasicMaterial({
            map: glowTex,
            transparent: true,
            depthWrite: false,
          }),
        );
        glow.position.z = -0.9;
        scene.add(glow);

        // Faint grid texture in the background behind the mascot.
        const gridCanvas = document.createElement("canvas");
        gridCanvas.width = 256;
        gridCanvas.height = 256;
        const gx = gridCanvas.getContext("2d")!;
        gx.fillStyle = "rgba(10, 12, 11, 0.55)";
        gx.fillRect(0, 0, 256, 256);
        gx.strokeStyle = "rgba(201, 161, 58, 0.06)";
        gx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
          const p = (i / 10) * 256;
          gx.beginPath();
          gx.moveTo(p, 0);
          gx.lineTo(p, 256);
          gx.stroke();
          gx.beginPath();
          gx.moveTo(0, p);
          gx.lineTo(256, p);
          gx.stroke();
        }
        const gridTex = new three.CanvasTexture(gridCanvas);
        gridTex.colorSpace = three.SRGBColorSpace;
        grid = new three.Mesh(
          new three.PlaneGeometry(5.6, 4.2),
          new three.MeshBasicMaterial({ map: gridTex, transparent: true, depthWrite: false }),
        );
        grid.position.set(0, 0.6, -1.1);
        scene.add(grid);

        // Cursor-following spotlight.
        spotLight = new three.SpotLight(0xffffff, 3, 12, Math.PI / 6, 0.45, 1);
        spotLight.position.set(0, 0, 4);
        spotLight.lookAt(0, 0, 0);
        scene.add(spotLight);

        const loader = new GLTFLoader();
        loader.load(
          GLB_URL,
          (gltf: any) => {
            mascot = gltf.scene;
            mascot.scale.setScalar(0.9);
            mascot.position.y = -0.12;
            mascot.traverse((node: any) => {
              if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
              }
            });
            scene.add(mascot);

            chips = PAIRS.map((pair) => makeChip(pair));
            setWebglReady(true);
          },
          undefined,
          (err: any) => {
            console.error("mascot glb load failed", err);
            setWebglFailed(true);
          },
        );
      } catch (err: any) {
        console.error("three init failed", err);
        setWebglFailed(true);
      }
    }

    function makeChip(pair: Pair) {
      const canvas = document.createElement("canvas");
      canvas.width = 220;
      canvas.height = 74;
      const c = canvas.getContext("2d")!;
      c.font = `600 ${pair.prominence === "high" ? 34 : 24}px ui-monospace, Menlo, Consolas, monospace`;
      const w = Math.ceil(c.measureText(pair.symbol).width + 34);
      canvas.width = w;
      c.font = `600 ${pair.prominence === "high" ? 34 : 24}px ui-monospace, Menlo, Consolas, monospace`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "rgba(10, 12, 11, 0.72)";
      c.beginPath();
      c.roundRect(0, 0, w, 74, 37);
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle =
        pair.prominence === "high" ? "rgba(201, 161, 58, 0.55)" : "rgba(138, 148, 143, 0.35)";
      c.stroke();
      c.fillStyle = pair.prominence === "high" ? "#e0bc63" : "#a8b0ab";
      c.fillText(pair.symbol, w / 2, 37 + 2);
      const tex = new three.CanvasTexture(canvas);
      tex.colorSpace = three.SRGBColorSpace;
      const sprite = new three.Sprite(
        new three.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }),
      );
      sprite.position.set(pair.x, pair.y, pair.z);
      sprite.scale.set(((pair.scale * w) / 74) * 0.14, pair.scale * 0.14, 1);
      scene.add(sprite);
      return { sprite, baseY: pair.y, phase: pair.x * 1.7 };
    }

    const handleMove = (event: PointerEvent) => {
      const box = root.getBoundingClientRect();
      pointer.x = ((event.clientX - box.left) / box.width) * 2 - 1;
      pointer.y = -((event.clientY - box.top) / box.height) * 2 + 1;
    };
    root.addEventListener("pointermove", handleMove, { passive: true });
    root.addEventListener("pointerleave", () => {
      pointer.x = 0;
      pointer.y = 0;
    });

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const visible = root.style.getPropertyValue("--hero-inview") === "1";
      if (!visible || document.hidden) return;
      time += 0.016;

      smoothPointer.x += (pointer.x - smoothPointer.x) * 0.08;
      smoothPointer.y += (pointer.y - smoothPointer.y) * 0.08;

      if (mascot) {
        mascot.rotation.y = Math.sin(time * 0.35) * 0.06 + smoothPointer.x * 0.12;
        mascot.rotation.x = Math.cos(time * 0.45) * 0.04 + smoothPointer.y * 0.08;
        mascot.position.y = -0.12 + Math.sin(time * 0.9) * 0.03;
      }

      if (glow) {
        glow.material.opacity = 0.35 + Math.sin(time * 0.5) * 0.06;
        glow.scale.setScalar(1 + Math.sin(time * 0.5) * 0.04);
      }

      if (grid) {
        grid.rotation.z = time * 0.02;
      }

      if (spotLight) {
        spotLight.position.x = smoothPointer.x * 2.4;
        spotLight.position.y = smoothPointer.y * 1.6;
        spotLight.lookAt(smoothPointer.x * 0.5, smoothPointer.y * 0.4, 0);
      }

      if (chips.length) {
        chips.forEach((chip) => {
          chip.sprite.position.y = chip.baseY + Math.sin(time * 0.5 + chip.phase) * 0.035;
          chip.sprite.rotation.y = time * 0.15;
        });
      }

      renderer.render(scene, camera);
    };

    renderer = new three.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x0a0c0b, 0);

    raf = requestAnimationFrame(loop);

    const onResize = () => {
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("pointermove", handleMove);
      root.removeEventListener("pointerleave", handleMove);
      if (renderer) renderer.dispose();
    };
  }, [webglFailed, reducedMotion]);

  // Cursor-hover trader problem text: one faded line at a time.
  useEffect(() => {
    if (reducedMotion || webglFailed) return;
    const el = problemRef.current;
    if (!el) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      el.textContent = PROBLEMS[i];
      el.style.opacity = "1";
      i = (i + 1) % PROBLEMS.length;
      timer = setTimeout(hide, 4200);
    };
    const hide = () => {
      el.style.opacity = "0";
      timer = setTimeout(show, 1600);
    };
    el.style.transition = "opacity 900ms ease";
    el.style.opacity = "0";
    timer = setTimeout(show, 2200);
    return () => {
      clearTimeout(timer);
      el.style.opacity = "0";
    };
  }, [reducedMotion, webglFailed]);

  return (
    <section id="hero" className="hero-section" ref={containerRef} aria-label="Golden mascot">
      <div className="hero__grain" aria-hidden="true" />
      <div className="hero__spotlight" aria-hidden="true" />
      <PointerGlyphs />

      <div className="hero__stage">
        {webglFailed ? (
          <div className="hero__fallback" aria-label="Golden mascot">
            <img
              src={POSTER_URL}
              alt="Golden mascot"
              decoding="async"
              loading="lazy"
              className="hero__poster"
              aria-hidden="true"
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
                  alt="Golden mascot"
                  decoding="async"
                  loading="lazy"
                  className="hero__poster"
                  aria-hidden="true"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="hero__chips" aria-hidden="true">
        {PAIRS.map((pair) => (
          <span
            key={pair.symbol}
            className={`hero__chip hero__chip--${pair.prominence}`}
            style={{
              left: pair.prominence === "high" ? "50%" : pair.x > 0 ? 82 : 18,
              top: pair.prominence === "high" ? 18 : pair.y > 0 ? 26 : 62,
              fontSize: pair.prominence === "high" ? 16 : 12,
              letterSpacing: pair.prominence === "high" ? "0.14em" : "0.1em",
            }}
          >
            {pair.symbol}
          </span>
        ))}
      </div>

      <span ref={problemRef} className="hero__problem" aria-hidden={reducedMotion || webglFailed}>
        &nbsp;
      </span>

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

      <a className="hero__explore" href="#signal-demo">
        <span>{t("hero_sample_badge")}</span>
        <ArrowDown size={16} />
      </a>
    </section>
  );
}
