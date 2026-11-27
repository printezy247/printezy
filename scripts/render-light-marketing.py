#!/usr/bin/env python3
"""Render light marketing media from the local EzyMap design-system meshes.

Usage: python3 scripts/render-light-marketing.py ../ezymap-design-system
Requires NumPy, Pillow and FFmpeg. The signal stack follows the motion studio's
four-second fan-out, with a small turn so the layers are legible on a web hero.
"""

import math
from pathlib import Path
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


PUBLIC = Path(__file__).resolve().parents[1] / "public"


def read_model(path):
    materials = {}
    for line in path.with_suffix(".mtl").read_text().splitlines():
        if line.startswith("newmtl "):
            material = line.split()[1]
        if line.startswith("Kd "):
            materials[material] = np.array(line.split()[1:], dtype=float) * 255
    vertices, faces, colors, objects = [], [], [], []
    for line in path.read_text().splitlines():
        fields = line.split()
        if not fields:
            continue
        match fields[0]:
            case "o":
                name = fields[1]
            case "usemtl":
                material = fields[1]
            case "v":
                vertices.append([float(value) for value in fields[1:]])
            case "f":
                faces.append([int(value.split("/")[0]) - 1 for value in fields[1:]])
                colors.append(materials[material])
                objects.append(name)
    return np.array(vertices)[faces], np.array(colors), np.array(objects)


def render(model, size, scale, angle, pitch, center, fan=0):
    triangles, colors, objects = model
    triangles = triangles.copy()
    for layer in range(2):
        triangles[objects == f"plate_{layer}", :, 1] -= fan * (2 - layer)
    a, b = math.radians(angle), math.radians(pitch)
    yaw = np.array([[math.cos(a), 0, -math.sin(a)], [0, 1, 0], [math.sin(a), 0, math.cos(a)]])
    tilt = np.array([[1, 0, 0], [0, math.cos(b), -math.sin(b)], [0, math.sin(b), math.cos(b)]])
    view = triangles @ yaw @ tilt
    normals = np.cross(view[:, 1] - view[:, 0], view[:, 2] - view[:, 0])
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-8)
    lighting = 0.68 + 0.32 * np.clip(normals @ np.array([-0.34, 0.64, 0.69]), 0, 1)
    face_colors = (colors * lighting[:, None] + 255 * 0.04).clip(0, 255).astype("uint8")

    w, h = size
    # Draw at 2× resolution so the poster and video have clean silhouette edges.
    scene = Image.new("RGB", (2 * w, 2 * h), "#f5f7f5")
    shadow = Image.new("L", scene.size)
    sx, sy = w, h * 1.59
    ImageDraw.Draw(shadow).ellipse((sx - scale, sy - scale * .18, sx + scale, sy + scale * .18), fill=48)
    scene.paste("#26382f", mask=shadow.filter(ImageFilter.GaussianBlur(scale * .10)))
    xy = view[:, :, :2].copy() - np.array(center)
    xy *= [2 * scale, -2 * scale]
    xy += [w, h]
    draw = ImageDraw.Draw(scene)
    for index in np.argsort(view[:, :, 2].mean(axis=1)):
        if normals[index, 2] > 0:
            draw.polygon([tuple(point) for point in xy[index]], fill=tuple(face_colors[index]))
    return scene.resize(size, Image.Resampling.LANCZOS)


def main(source):
    source = Path(source) / "assets/3d"
    stack = read_model(source / "ezymap-signal-stack.obj")
    mascot = read_model(source / "ezymap-set-1-golden-mascot.obj")
    render(mascot, (768, 768), 410, 8, 9, (0, -0.085)).save(
        PUBLIC / "assets/3d/mascot-poster-light.webp", quality=88
    )
    size = (1280, 720)
    output = PUBLIC / "ezymap-signal-stack-light.mp4"
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pixel_format", "rgb24",
           "-video_size", "1280x720", "-framerate", "30", "-i", "-", "-c:v", "libx264",
           "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output)]
    with subprocess.Popen(cmd, stdin=subprocess.PIPE) as encoder:
        for frame in range(120):
            phase = frame / 120 * math.tau
            image = render(stack, size, 490, 29 + 9 * math.sin(phase), 33,
                           (0, 0.15), fan=0.17 * (1 - math.cos(phase)) / 2)
            if frame == 0:
                image.save(PUBLIC / "ezymap-signal-stack-light.webp", quality=88)
            encoder.stdin.write(image.tobytes())
        encoder.stdin.close()
        if encoder.wait():
            raise SystemExit("FFmpeg could not encode the signal stack")


if __name__ == "__main__":
    main(sys.argv[1])
