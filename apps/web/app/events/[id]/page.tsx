import { getEvent } from '@/lib/api';
import { Calendar, MapPin, ExternalLink, Share2, ArrowUpRight, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { ShareButton } from '@/components/share/share-button';

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await getEvent(id);

    const formattedDate = format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }).toUpperCase();
    const day = format(new Date(event.date), "dd");
    const month = format(new Date(event.date), "MMM", { locale: ptBR }).toUpperCase().replace('.', '');

    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col">
            <Navbar />

            <div className="flex-1 container mx-auto px-4 py-8 md:py-12">
                {/* Breadcrumb / Back */}
                <div className="mb-8">
                    <Link href="/" className="text-zinc-500 hover:text-lime-400 font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
                        ← Voltar para o calendario
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Column: Image & Title */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Title Section */}
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {event.distances.map((dist) => (
                                    <span key={dist} className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-lime-400 font-mono text-xs font-bold uppercase">
                                        {dist}
                                    </span>
                                ))}
                                <span className="px-3 py-1 bg-lime-400 text-black font-mono text-xs font-bold uppercase">
                                    RUA
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tighter leading-none">
                                {event.title}
                            </h1>
                            <div className="flex items-center gap-2 text-zinc-400">
                                <MapPin className="w-5 h-5 text-lime-400" />
                                <span className="font-mono text-sm uppercase tracking-wide">{event.city}, {event.state}</span>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="relative w-full aspect-video bg-zinc-900 border border-zinc-800 group overflow-hidden">
                            {event.imageUrl ? (
                                <Image
                                    src={event.imageUrl}
                                    alt={event.title}
                                    fill
                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                    <span className="font-mono uppercase">Sem Imagem</span>
                                </div>
                            )}

                            {/* Date Badge Overlay */}
                            <div className="absolute bottom-0 right-0 bg-lime-400 p-4 min-w-[100px] flex flex-col items-center justify-center border-t border-l border-black">
                                <span className="text-4xl font-black text-black leading-none">{day}</span>
                                <span className="text-sm font-mono font-bold text-black uppercase">{month}</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-2xl font-black italic uppercase text-white mb-4 flex items-center gap-2">
                                <div className="w-2 h-8 bg-lime-400 -skew-x-12" />
                                Sobre o Evento
                            </h3>
                            <p className="text-zinc-400 text-lg leading-relaxed">
                                Participe da <span className="text-white font-bold">{event.title}</span> em {event.city}.
                                Um evento imperdível para os amantes da corrida de rua.
                                Desafie-se nas distâncias de {event.distances.join(', ')}.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 flex items-start gap-4">
                                    <Calendar className="w-8 h-8 text-lime-400" />
                                    <div>
                                        <span className="block font-mono text-xs text-zinc-500 uppercase mb-1">Data do Evento</span>
                                        <span className="block text-xl font-bold text-white uppercase">{formattedDate}</span>
                                    </div>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 flex items-start gap-4">
                                    <MapPin className="w-8 h-8 text-lime-400" />
                                    <div>
                                        <span className="block font-mono text-xs text-zinc-500 uppercase mb-1">Localização</span>
                                        <span className="block text-xl font-bold text-white uppercase">{event.city}</span>
                                        <span className="block text-sm text-zinc-400">{event.location || "Local a definir"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sidebar (Desktop) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-zinc-900 border border-zinc-800 p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-lime-400/10 blur-2xl rounded-full pointer-events-none" />

                                <h3 className="font-mono text-sm text-lime-400 uppercase font-bold mb-2">Inscrições Abertas</h3>
                                <div className="text-3xl font-black text-white mb-6">
                                    {event.price || "Sob Consulta"}
                                </div>

                                <a
                                    href={event.regLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-lime-400 hover:bg-lime-300 text-black font-black italic uppercase text-xl py-4 px-6 flex items-center justify-center gap-2 transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                                >
                                    Inscreva-se
                                    <ArrowUpRight className="w-6 h-6" />
                                </a>

                                <p className="mt-4 text-center text-zinc-500 text-xs font-mono uppercase">
                                    Você será redirecionado para o site oficial
                                </p>
                            </div>

                            <div className="bg-zinc-950 border border-zinc-800 p-4">
                                <ShareButton
                                    eventData={{
                                        title: event.title,
                                        date: formattedDate,
                                        city: event.city,
                                        url: `/events/${id}`
                                    }}
                                    className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors font-mono text-sm uppercase py-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Compartilhar Evento
                                </ShareButton>
                                <div className="h-px w-full bg-zinc-900 my-2" />
                                <a
                                    href={event.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-lime-400 transition-colors font-mono text-xs uppercase py-2"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Ver Fonte Original
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 lg:hidden z-50">
                <div className="flex gap-3">
                    <ShareButton
                        eventData={{
                            title: event.title,
                            date: formattedDate,
                            city: event.city,
                            url: `/events/${id}`
                        }}
                        className="p-3 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white"
                    >
                        <Share2 className="w-6 h-6" />
                    </ShareButton>
                    <a
                        href={event.regLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-lime-400 text-black font-black italic uppercase text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        Inscreva-se
                        <ArrowUpRight className="w-5 h-5" />
                    </a>
                </div>
            </div>

            <Footer />
        </main>
    );
}
