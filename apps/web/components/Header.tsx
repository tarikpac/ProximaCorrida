import { Calendar } from 'lucide-react';

export function Header() {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Próxima<span className="text-blue-600">Corrida</span>
                    </h1>
                </div>
            </div>
        </header>
    );
}
