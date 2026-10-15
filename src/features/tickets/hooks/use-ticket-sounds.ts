import { type AudioPlayer, useAudioPlayer } from 'expo-audio';
import { useEffect, useMemo } from 'react';

import ARMED from '@/assets/sounds/armed.wav';
import CONFIRM from '@/assets/sounds/confirm.wav';
import FEED from '@/assets/sounds/print-feed.wav';
import QR from '@/assets/sounds/print-qr.wav';
import SAVE from '@/assets/sounds/save.wav';

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
 * Efectos de sonido del ticket: impresión (`feed`, `qr`, `confirm`), guardado (`save`)
 * y el tick de umbral (`armed`). Respeta el interruptor de silencio de iOS por defecto.
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
