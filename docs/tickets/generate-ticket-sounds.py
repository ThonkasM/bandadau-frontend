#!/usr/bin/env python3
"""
Genera los efectos de sonido del ticket (sintéticos, sin licencias):

  print-feed.wav  -> el papel sale de la impresora: 14 "tirones" + zumbido del motor
  print-qr.wav    -> el QR se imprime: ráfaga fina de clicks con tono ascendente
  confirm.wav     -> confirmación: campanita de dos notas

Los tiempos coinciden con ticket-reveal-modal.tsx (FEED_MS=1500, FEED_STEPS=14, QR_MS=800).
Si cambias esas constantes, cambia las de aquí y vuelve a ejecutar:  python3 generate-ticket-sounds.py
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
FEED_MS, FEED_STEPS = 1500, 14
QR_MS, QR_STEPS = 800, 26
# Genera directamente en los assets de la app (src/assets/sounds/).
OUT = Path(__file__).resolve().parents[2] / "src" / "assets" / "sounds"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def bandpass_noise(n, lo, hi):
    spec = np.fft.rfft(rng.standard_normal(n))
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec[(freqs < lo) | (freqs > hi)] = 0
    out = np.fft.irfft(spec, n)
    return out / (np.max(np.abs(out)) + 1e-9)


def add(buf, start_s, snd, gain=1.0):
    i = int(start_s * SR)
    j = min(len(buf), i + len(snd))
    if i < len(buf):
        buf[i:j] += snd[: j - i] * gain


def env_exp(n, tau_s):
    return np.exp(-np.arange(n) / (tau_s * SR))


def fade(buf, in_s=0.004, out_s=0.03):
    a, b = int(in_s * SR), int(out_s * SR)
    buf[:a] *= np.linspace(0, 1, a)
    buf[-b:] *= np.linspace(1, 0, b)
    return buf


def tick(freq_lo, freq_hi, dur_s, thump_hz=0):
    n = int(dur_s * SR)
    s = bandpass_noise(n, freq_lo, freq_hi) * env_exp(n, dur_s / 4)
    if thump_hz:
        t = np.arange(n) / SR
        s += 0.7 * np.sin(2 * np.pi * thump_hz * t) * env_exp(n, dur_s / 3)
    return s


def save(name, buf, peak=0.8):
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * peak
    pcm = (np.clip(buf, -1, 1) * 32767).astype("<i2")
    with wave.open(str(OUT / name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"{name}: {len(buf) / SR:.2f}s")


# --- print-feed.wav ---------------------------------------------------------
def make_feed():
    dur = FEED_MS / 1000 + 0.25
    buf = np.zeros(int(dur * SR))
    t = np.arange(len(buf)) / SR
    # motor: zumbido grave con leve vibrato, solo mientras sale el papel
    motor = (
        np.sign(np.sin(2 * np.pi * 92 * t + 0.6 * np.sin(2 * np.pi * 7 * t)))
        + 0.5 * np.sin(2 * np.pi * 184 * t)
    )
    motor = bandpass_noise(len(buf), 40, 400) * 0.35 + motor * 0.12
    window = np.clip(t / 0.05, 0, 1) * np.clip((FEED_MS / 1000 + 0.05 - t) / 0.12, 0, 1)
    buf += motor * window * 0.5
    # un tirón por paso, justo cuando arranca cada paso de la animación
    for i in range(FEED_STEPS):
        start = i * FEED_MS / 1000 / FEED_STEPS
        add(buf, start, tick(1800, 6500, 0.055, thump_hz=170), gain=0.9)
        add(buf, start + 0.012, tick(900, 3000, 0.03), gain=0.35)
    # "clac" final cuando la ranura suelta el papel
    add(buf, FEED_MS / 1000 + 0.03, tick(600, 4000, 0.09, thump_hz=120), gain=0.8)
    save("print-feed.wav", fade(buf))


# --- print-qr.wav -----------------------------------------------------------
def make_qr():
    dur = QR_MS / 1000 + 0.12
    buf = np.zeros(int(dur * SR))
    t = np.arange(len(buf)) / SR
    for i in range(QR_STEPS):
        start = i * QR_MS / 1000 / QR_STEPS
        f = 2200 + 2600 * i / QR_STEPS  # el tono sube mientras "escanea"
        add(buf, start, tick(f * 0.7, f * 1.3, 0.012), gain=0.7)
    glide = np.sin(2 * np.pi * (500 + 900 * np.clip(t / (QR_MS / 1000), 0, 1)) * t)
    window = np.clip(t / 0.03, 0, 1) * np.clip((QR_MS / 1000 + 0.05 - t) / 0.1, 0, 1)
    buf += glide * window * 0.12
    save("print-qr.wav", fade(buf), peak=0.6)


# --- confirm.wav ------------------------------------------------------------
def bell(freq, dur_s):
    n = int(dur_s * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for ratio, amp, tau in [(1.0, 1.0, 0.30), (2.76, 0.35, 0.16), (5.4, 0.12, 0.08)]:
        s += amp * np.sin(2 * np.pi * freq * ratio * t) * env_exp(n, tau)
    return s


def make_confirm():
    buf = np.zeros(int(1.0 * SR))
    add(buf, 0.0, tick(300, 1800, 0.05, thump_hz=110), gain=0.45)  # golpecito del papel
    add(buf, 0.02, bell(987.77, 0.8), gain=0.8)  # B5
    add(buf, 0.13, bell(1318.51, 0.85), gain=0.9)  # E6
    save("confirm.wav", fade(buf, out_s=0.08), peak=0.7)


if __name__ == "__main__":
    make_feed()
    make_qr()
    make_confirm()
