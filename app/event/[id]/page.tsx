import { Suspense } from 'react';
import { SAMPLE_EVENTS } from '@/lib/constants';
import { EventDetailClient } from '@/components/events/EventDetailClient';


export function generateStaticParams() {
  return SAMPLE_EVENTS.map((event) => ({
    id: event.id,
  }));
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
          Loading event details...
        </div>
      }
    >
      <EventDetailClient id={id} />
    </Suspense>
  );
}
