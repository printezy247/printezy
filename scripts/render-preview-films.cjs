// Offline export of the production reference scenes; no WebGL or GSAP in the client bundle.
// Requires puppeteer-core (local or NODE_PATH), Chromium and FFmpeg. Run from the repo root.
const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn, execFileSync } = require("node:child_process");
const { once } = require("node:events");
const puppeteer = require("puppeteer-core");
const fps = 24;
const root = path.resolve(".");
const design = path.resolve(process.argv[2] || "../ezymap-design-system");
const video = path.resolve(
  process.argv[3] || "../EzyMap/video-system/videos/ezymap-hero-loop-16x9",
);
const mime = {
  ".js": "text/javascript",
  ".html": "text/html",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

async function exportFilm(browser, mascot) {
  const page = await browser.newPage();
  const width = mascot ? 640 : 960,
    height = mascot ? 480 : 600;
  await page.setViewport({ width, height });
  await page.setRequestInterception(true);
  page.on("request", async (req) => {
    const url = new URL(req.url());
    if (url.hostname !== "studio.local") return req.abort();
    const route = decodeURIComponent(url.pathname);
    const base = route.startsWith("/three/")
      ? path.join(root, "node_modules/three")
      : mascot
        ? design
        : video;
    const file = path.resolve(base, "." + route.replace(/^\/three\//, "/"));
    if (!file.startsWith(base + path.sep)) return req.abort();
    try {
      let body = await fs.readFile(file);
      if (mascot && file.endsWith("/preview.html")) {
        // Leave buildAnimator, lighting, materials and framing unchanged. Replace the wall clock
        // with an export clock; each captured frame evaluates the original animation directly.
        let html = body.toString().replaceAll("https://unpkg.com/three@0.160.0/", "/three/");
        const marker = "renderer.setAnimationLoop(() => {";
        if (!html.includes(marker)) throw new Error("Preview clock changed");
        html = html.replace(
          marker,
          `window.drawFrame = t => { animate(t, 1/${fps}); controls.update(); renderer.render(scene,camera); };\n${marker}\nif (fixedTime !== null) return;`,
        );
        body = Buffer.from(
          html.replace("</head>", "<style>header,#fallback{display:none!important}</style></head>"),
        );
      }
      await req.respond({
        status: 200,
        contentType: mime[path.extname(file)] || "application/octet-stream",
        body,
      });
    } catch {
      await req.abort();
    }
  });
  const target = mascot ? "public/assets/3d/mascot-preview" : "public/ezymap-chart-desk";
  await page.goto(`http://studio.local/${mascot ? "assets/3d/preview.html?t=0" : "index.html"}`);
  if (mascot)
    await page.waitForFunction(() =>
      document.querySelector("#status").textContent.includes("meshes"),
    );
  else {
    // Light-theme adaptation. Keep the video system's seeded candle series, gem, chart
    // overlays and 12-second reveal/hold/reset timeline. Captions are localized in HTML.
    await page.addStyleTag({
      content: `html,body{width:960px;height:600px;background:#f5f7f5} #root{transform:scale(.64);transform-origin:center;position:absolute;left:calc(50% - 960px);top:calc(50% - 540px);background:radial-gradient(ellipse at center,#fff,#f5f7f5 78%)} .hud,.hud-tag,#scan,#vignette,#particles{display:none} #gem{filter:drop-shadow(0 20px 26px #233d3022)} #gem-wrap{top:36%} #chart-svg [stroke="#f2f4f2"]{stroke:#324c41} #chart-svg [fill="#2fbf71"]{fill:#147449} #chart-svg [fill="#e8c468"]{fill:#765919} #chart-svg [fill="#7ce8ae"]{fill:#0f6941} #chart-svg text{font-weight:600} #chart-svg rect{filter:none!important}`,
    });
    await page.waitForFunction(() => !!window.__timelines?.main);
  }
  const encoder = spawn(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(fps),
      "-i",
      "-",
      "-an",
      "-c:v",
      "libx264",
      "-crf",
      "22",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      target + ".mp4",
    ],
    { stdio: ["pipe", "ignore", "inherit"] },
  );
  const done = once(encoder, "close");
  try {
    for (let frame = 0; frame < (mascot ? 8 : 12) * fps; frame++) {
      await page.evaluate(
        ({ mascot, t }) => {
          if (mascot) window.drawFrame(t);
          else window.__timelines.main.seek(t, false);
        },
        { mascot, t: frame / fps },
      );
      const png = Buffer.from(await page.screenshot({ type: "png" }));
      if (frame === (mascot ? 0 : 7 * fps))
        execFileSync(
          "ffmpeg",
          [
            "-y",
            "-loglevel",
            "error",
            "-i",
            "pipe:0",
            "-frames:v",
            "1",
            "-quality",
            "88",
            target + ".webp",
          ],
          { input: png },
        );
      if (!encoder.stdin.write(png)) await once(encoder.stdin, "drain");
    }
    encoder.stdin.end();
    if ((await done)[0] !== 0) throw new Error("FFmpeg export failed");
  } finally {
    encoder.kill();
    await page.close();
  }
}
(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  try {
    if (process.env.FILM !== "hero") await exportFilm(browser, true);
    if (process.env.FILM !== "mascot") await exportFilm(browser, false);
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
