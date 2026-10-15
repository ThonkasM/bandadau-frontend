/**
 * Event cover images (mockups). Topic-related Unsplash photos keyed by event id;
 * falls back to a seeded picsum image for unknown events.
 */
const COVER_PARAMS = '?w=1200&h=675&fit=crop&q=80';

const EVENT_COVERS: Record<string, string> = {
  // Charla de arquitectura hexagonal → código en pantalla
  '0192f3d0-0000-7000-8000-000000000001': `https://images.unsplash.com/photo-1461749280684-dccba630e2f6${COVER_PARAMS}`,
  // Taller de SAGA de inscripción → equipo trabajando con laptops
  '0192f3d0-0000-7000-8000-000000000002': `https://images.unsplash.com/photo-1519389950473-47ba0277781c${COVER_PARAMS}`,
  // Clase intensiva de microfrontends → código en laptop
  '0192f3d0-0000-7000-8000-000000000003': `https://images.unsplash.com/photo-1517180102446-f3ece451e9d8${COVER_PARAMS}`,
  // Hackathon Bandada U → espacio de trabajo
  '0192f3d0-0000-7000-8000-000000000004': `https://images.unsplash.com/photo-1504384308090-c894fdcc538d${COVER_PARAMS}`,
};

export function eventCoverUrl(eventId: string): string {
  return EVENT_COVERS[eventId] ?? `https://picsum.photos/seed/bandada-event-${eventId}/1200/675`;
}
