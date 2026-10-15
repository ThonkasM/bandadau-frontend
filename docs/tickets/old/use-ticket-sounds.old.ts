import { type AudioPlayer, useAudioPlayer } from 'expo-audio';
import { useEffect, useMemo } from 'react';

import CONFIRM from '@/assets/sounds/confirm.wav';
import FEED from '@/assets/sounds/print-feed.wav';
import QR from '@/assets/sounds/print-qr.wav';

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
 * Efectos de sonido del ticket (impresión + confirmación). Respeta el interruptor de
 * silencio de iOS por defecto (expo-audio no reproduce en modo silencio salvo que actives
 * `playsInSilentMode`). Los callbacks son estables, así que pueden ir en dependencias.
 */
export function useTicketSounds(enabled = true) {
  const feed = useAudioPlayer(FEED);
  const qr = useAudioPlayer(QR);
  const confirm = useAudioPlayer(CONFIRM);

  useEffect(() => {
    try {
      feed.volume = 0.7;
      qr.volume = 0.5;
      confirm.volume = 0.8;
    } catch {
      // idem
    }
  }, [feed, qr, confirm]);

  return useMemo(
    () => ({
      feed: () => enabled && replay(feed),
      qr: () => enabled && replay(qr),
      confirm: () => enabled && replay(confirm),
      stop: () => {
        stopPlayer(feed);
        stopPlayer(qr);
        stopPlayer(confirm);
      },
    }),
    [enabled, feed, qr, confirm],
  );
}
