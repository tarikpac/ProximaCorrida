import { Event } from '@/types/event';
import { Calendar, MapPin, Ruler } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

interface EventCardProps {
    event: Event;
}

export function EventCard({ event }: EventCardProps) {
    const formattedDate = format(new Date(event.date), "dd 'de' MMMM", { locale: ptBR });
    const weekDay = format(new Date(event.date), "EEEE", { locale: ptBR });

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col group">
            <div className="relative h-48 bg-gray-200">
                {event.imageUrl ? (
                    <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <span className="text-sm">Sem imagem</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-blue-700 shadow-sm">
                    {event.distances.join(' • ')}
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                            {weekDay}
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
                            {event.title}
                        </h3>
                    </div>
                    <div className="text-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 min-w-[3.5rem]">
                        <span className="block text-lg font-bold text-gray-900 leading-none">
                            {format(new Date(event.date), 'dd')}
                        </span>
                        <span className="block text-[10px] font-medium text-gray-500 uppercase">
                            {format(new Date(event.date), 'MMM', { locale: ptBR })}
                        </span>
                    </div>
                </div>

                <div className="space-y-2 mt-3">
                    <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{event.city}, {event.state}</span>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                    <a
                        href={event.regLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg text-center transition-colors"
                    >
                        Inscrição
                    </a>
                    <Link
                        href={`/events/${event.id}`}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg text-center transition-colors border border-gray-200"
                    >
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    );
}
