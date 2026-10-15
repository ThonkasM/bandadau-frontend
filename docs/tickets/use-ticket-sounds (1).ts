import { type AudioPlayer, useAudioPlayer } from 'expo-audio';
import { useEffect, useMemo } from 'react';

// Pon los .wav en src/assets/sounds/ (o ajusta estas rutas).
const FEED = require('@/assets/sounds/print-feed.wav');
const QR = require('@/assets/sounds/print-qr.wav');
const CONFIRM = require('@/assets/sounds/confirm.wav');
const SAVE = require('@/assets/sounds/save.wav');
const ARMED = require('@/assets/sounds/armed.wav');

function replay(player: AudioPlayer) {
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // expo-audio sin enlazar (el dev client necesita reconstruirse) o audio no disponible.
  }
}

function stopPlayer(player: AudioPlayer) {
  try {
    player.pause();
  } catch {
    // idem
  }
}

/**
 * Efectos de sonido del ticket. Por defecto respeta el interruptor de silencio de iOS
 * (expo-audio no reproduce en modo silencio salvo que actives `playsInSilentMode`).
 * Los callbacks son estables, así que pueden ir en dependencias de efectos.
 */
export function useTicketSounds(enabled = true) {
  const feed = useAudioPlayer(FEED);
  const qr = useAudioPlayer(QR);
  const confirm = useAudioPlayer(CONFIRM);
  const save = useAudioPlayer(SAVE);
  const armed = useAudioPlayer(ARMED);

  useEffect(() => {
    try {
      feed.volume = 0.7;
      qr.volume = 0.5;
      confirm.volume = 0.8;
      save.volume = 0.7;
      armed.volume = 0.45;
    } catch {
      // idem
    }
  }, [feed, qr, confirm, save, armed]);

  return useMemo(
    () => ({
      feed: () => enabled && replay(feed),
      qr: () => enabled && replay(qr),
      confirm: () => enabled && replay(confirm),
      save: () => enabled && replay(save),
      armed: () => enabled && replay(armed),
      // Solo detiene los sonidos de impresión: el de guardado debe terminar de sonar al cerrar.
      stop: () => {
        stopPlayer(feed);
        stopPlayer(qr);
        stopPlayer(confirm);
      },
    }),
    [enabled, feed, qr, confirm, save, armed],
  );
}
