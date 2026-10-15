import type { EventDetailViewProps } from '@/features/events/components/event-detail-parts';

/**
 * Event detail view. Platform split (Metro picks `.native`/`.web`):
 * - native → single column with a fixed bottom CTA (one-hand friendly).
 * - web → two columns (hero + info/CTA panel).
 *
 * This base file is a no-op default for TypeScript.
 */
export default function EventDetailView(_props: EventDetailViewProps) {
  return null;
}
