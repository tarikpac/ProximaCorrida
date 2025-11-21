import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Metadata } from "next";
import { MapPin, Calendar, Bell, Calculator } from "lucide-react";

export const metadata: Metadata = {
    title: "Sobre o ProximaCorrida - Nossa Missão",
    description: "Saiba mais sobre o ProximaCorrida, a plataforma que ajuda corredores a encontrar sua próxima corrida de rua.",
};

export default function SobrePage() {
    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4 border-b border-zinc-900">
                <div className="container mx-auto max-w-4xl text-center">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tighter mb-6">
                        Correr é simples. <br />
                        <span className="text-lime-400">Encontrar corridas</span> também deveria ser.
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        O ProximaCorrida nasceu para acabar com a fragmentação de informações e ajudar corredores de rua a planejarem seu calendário com facilidade.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 px-4 bg-zinc-900/30">
                <div className="container mx-auto max-w-3xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-3 h-8 bg-lime-400 -skew-x-12" />
                        <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">
                            Nossa Missão
                        </h2>
                    </div>
                    <div className="prose prose-invert prose-lg text-zinc-300">
                        <p className="mb-4">
                            Somos uma plataforma mobile-first focada em centralizar, padronizar e facilitar o acesso a eventos de corrida de rua.
                        </p>
                        <p>
                            Sabemos que a informação sobre corridas muitas vezes está espalhada em diversos sites de organizadores, portais de ingressos e redes sociais. Nosso objetivo é reunir tudo isso em um só lugar, de forma automatizada e sempre atualizada.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features / Benefits */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-4">
                            Como o ProximaCorrida te ajuda
                        </h2>
                        <p className="text-zinc-400">Tudo o que você precisa para decidir sua próxima prova.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FeatureCard
                            icon={<Calendar className="w-6 h-6 text-lime-400" />}
                            title="Calendário Centralizado"
                            description="Todas as corridas da sua região em uma lista única, organizada por data."
                        />
                        <FeatureCard
                            icon={<MapPin className="w-6 h-6 text-lime-400" />}
                            title="Filtros Inteligentes"
                            description="Encontre provas por cidade, distância (5k, 10k, 21k...) ou data específica."
                        />
                        <FeatureCard
                            icon={<Calculator className="w-6 h-6 text-lime-400" />}
                            title="Calculadora de Pace"
                            description="Planeje seu ritmo e preveja seu tempo de chegada para diferentes distâncias."
                        />
                        <FeatureCard
                            icon={<Bell className="w-6 h-6 text-lime-400" />}
                            title="Notificações (Em Breve)"
                            description="Seja avisado assim que novas corridas forem confirmadas no seu estado."
                        />
                    </div>
                </div>
            </section>

            {/* Target Audience */}
            <section className="py-16 px-4 bg-zinc-900/30 border-y border-zinc-900">
                <div className="container mx-auto max-w-3xl text-center">
                    <h2 className="text-2xl font-bold text-white uppercase mb-8">Para quem é?</h2>
                    <div className="flex flex-col md:flex-row justify-center gap-6">
                        <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-lg flex-1">
                            <h3 className="text-lime-400 font-bold uppercase mb-2">Iniciantes</h3>
                            <p className="text-zinc-400 text-sm">Que buscam sua primeira prova de 5km e querem saber onde começar.</p>
                        </div>
                        <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-lg flex-1">
                            <h3 className="text-lime-400 font-bold uppercase mb-2">Amadores</h3>
                            <p className="text-zinc-400 text-sm">Que correm regularmente e precisam organizar o calendário do ano.</p>
                        </div>
                        <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-lg flex-1">
                            <h3 className="text-lime-400 font-bold uppercase mb-2">Viajantes</h3>
                            <p className="text-zinc-400 text-sm">Que querem unir turismo e corrida em outros estados.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-6">
                        Fale com a gente
                    </h2>
                    <p className="text-zinc-400 mb-8">
                        Tem alguma dúvida, sugestão ou encontrou algum erro em uma corrida?
                        Entre em contato conosco.
                    </p>
                    <a
                        href="mailto:contato@proximacorrida.com.br"
                        className="inline-flex items-center justify-center px-8 py-4 bg-lime-400 text-black font-black uppercase tracking-wider hover:bg-lime-300 transition-colors"
                    >
                        Enviar E-mail
                    </a>
                </div>
            </section>

            <div className="mt-auto">
                <Footer />
            </div>
        </main>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex gap-4 p-6 bg-zinc-900/50 border border-zinc-800 hover:border-lime-400/50 transition-colors">
            <div className="shrink-0 mt-1">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-bold text-white uppercase mb-2">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
