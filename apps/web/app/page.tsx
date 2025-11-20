import { Navbar } from "@/components/ui/navbar";
import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/ui/marquee";
import { EventGrid } from "@/components/home/event-grid";
import { OrganizerCTA } from "@/components/home/organizer-cta";
import { Footer } from "@/components/ui/footer";

import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <Suspense fallback={<div className="h-96 bg-zinc-950" />}>
        <Hero />
      </Suspense>
      <Marquee />
      <EventGrid />
      <OrganizerCTA />
      <Footer />
    </main>
  );
}
