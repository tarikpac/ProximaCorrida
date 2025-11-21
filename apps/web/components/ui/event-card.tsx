import { MapPin, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ShareButton } from "@/components/share/share-button";

interface EventCardProps {
    title: string;
    date: { day: string; month: string };
    location: string;
    distances: string[];
    price: string;
    category: string;
    imageUrl?: string;
    slug: string;
}

export function EventCard({
    title,
    date,
    location,
    distances,
    price,
    category,
    imageUrl,
    slug,
}: EventCardProps) {
    return (
        <div className="group block h-full relative">
            <Link href={`/events/${slug}`} className="block h-full">
                <div className="h-full w-full bg-zinc-900 border border-zinc-800 group-hover:border-lime-400 transition-colors duration-200 flex flex-col relative overflow-hidden">

                    {/* Image Container */}
                    <div className="relative h-40 w-full overflow-hidden bg-zinc-800">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-700">
                                <span className="font-mono text-xs uppercase">Sem Imagem</span>
                            </div>
                        )}

                        {/* Category Badge */}
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm border border-zinc-700 px-2 py-1">
                            <span className="font-mono text-xs font-bold text-lime-400 uppercase">
                                {category}
                            </span>
                        </div>

                        {/* Date Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm border border-zinc-700 px-3 py-1 flex flex-col items-center leading-none min-w-[50px]">
                            <span className="font-black text-xl text-white">{date.day}</span>
                            <span className="font-mono text-[10px] text-zinc-400 uppercase">{date.month}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-grow">
                        <h3 className="text-xl font-black italic uppercase text-white mb-3 line-clamp-2 group-hover:text-lime-400 transition-colors">
                            {title}
                        </h3>

                        <div className="flex items-center gap-2 text-zinc-400 mb-4">
                            <MapPin className="w-4 h-4 text-zinc-500" />
                            <span className="text-sm font-medium uppercase truncate">{location}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-auto">
                            {distances.map((dist) => (
                                <span
                                    key={dist}
                                    className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs font-mono font-bold uppercase"
                                >
                                    {dist}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-zinc-800 border-dashed p-3 flex items-center justify-between bg-zinc-900/50">
                        <span className="font-mono text-lime-400 font-bold text-lg">
                            {price}
                        </span>

                        <div className="flex items-center gap-1 text-white text-xs font-mono font-bold uppercase group-hover:underline decoration-lime-400 underline-offset-4">
                            Detalhes
                            <ArrowUpRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </Link>

            <div className="absolute top-2 right-2 z-10">
                <ShareButton
                    eventData={{
                        title: title,
                        date: `${date.day} ${date.month}`,
                        city: location,
                        url: `/events/${slug}`
                    }}
                    variant="card"
                />
            </div>
        </div>
    );
}
