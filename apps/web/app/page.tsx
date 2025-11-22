import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/ui/marquee";
import { EventGrid } from "@/components/home/event-grid";
import { OrganizerCTA } from "@/components/home/organizer-cta";

import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      <Suspense fallback={<div className="h-96 bg-zinc-950" />}>
        <Hero />
      </Suspense>
      <Marquee />
      <EventGrid />
      <OrganizerCTA />
    </>
  );
}
