import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Metadata } from "next";
import { CheckCircle, Users, MapPin, FileText, CheckSquare, Calendar } from "lucide-react";
import { GOOGLE_FORM_URL } from "../../src/config/constants";

export const metadata: Metadata = {
    title: "Área do Organizador - Divulgue sua Corrida | ProximaCorrida",
    description: "Divulgue sua corrida de rua gratuitamente no ProximaCorrida. Alcance corredores de todo o Brasil.",
};

export default function OrganizadorPage() {
    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4 border-b border-zinc-900">
                <div className="container mx-auto max-w-4xl text-center">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tighter mb-6">
                        Divulgue sua corrida no <br />
                        <span className="text-lime-400">ProximaCorrida</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Centralize as informações do seu evento e alcance corredores de todo o Brasil gratuitamente.
                    </p>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 px-4 bg-zinc-900/30">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <BenefitCard
                            icon={<Users className="w-8 h-8 text-lime-400" />}
                            title="Alcance Mais Atletas"
                            description="Sua corrida visível para milhares de corredores que buscam provas no nosso calendário."
                        />
                        <BenefitCard
                            icon={<MapPin className="w-8 h-8 text-lime-400" />}
                            title="Divulgação Gratuita"
                            description="Cadastre seu evento sem custo algum e aumente a visibilidade da sua prova."
                        />
                        <BenefitCard
                            icon={<CheckCircle className="w-8 h-8 text-lime-400" />}
                            title="Informação Centralizada"
                            description="Mantenha os dados oficiais do seu evento organizados e fáceis de encontrar."
                        />
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter text-center mb-12">
                        Como Funciona
                    </h2>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -z-10 -translate-y-1/2" />

                        <StepCard
                            icon={<FileText className="w-6 h-6 text-black" />}
                            step="1"
                            title="Preencha o formulário"
                            description="Envie os dados completos da sua corrida."
                        />
                        <StepCard
                            icon={<CheckSquare className="w-6 h-6 text-black" />}
                            step="2"
                            title="Nossa equipe valida"
                            description="Revisamos as informações para garantir qualidade."
                        />
                        <StepCard
                            icon={<Calendar className="w-6 h-6 text-black" />}
                            step="3"
                            title="Corrida publicada"
                            description="Seu evento aparece no calendário oficial."
                        />
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section className="py-16 px-4 bg-zinc-900/30 border-y border-zinc-900" id="formulario">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-8">
                        Cadastre sua Corrida
                    </h2>

                    <div className="bg-white rounded-lg overflow-hidden shadow-xl mx-auto max-w-3xl h-[800px] hidden md:block">
                        <iframe
                            src={GOOGLE_FORM_URL}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            marginHeight={0}
                            marginWidth={0}
                            title="Formulário de Cadastro de Corrida"
                        >
                            Carregando…
                        </iframe>
                    </div>

                    {/* Mobile Fallback / CTA */}
                    <div className="md:hidden flex flex-col items-center">
                        <p className="text-zinc-400 mb-6">
                            Para melhor experiência em dispositivos móveis, abra o formulário diretamente.
                        </p>
                        <a
                            href={GOOGLE_FORM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-8 py-4 bg-lime-400 text-black font-black uppercase tracking-wider hover:bg-lime-300 transition-colors rounded w-full max-w-xs"
                        >
                            Preencher Formulário
                        </a>
                    </div>

                    {/* Desktop Fallback Link */}
                    <div className="hidden md:block mt-4">
                        <a
                            href={GOOGLE_FORM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-lime-400 text-sm underline transition-colors"
                        >
                            Problemas com o formulário? Abra em uma nova aba.
                        </a>
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-2xl text-center">
                    <p className="text-zinc-400 mb-8">
                        Dúvidas sobre o processo de cadastro?
                    </p>
                    <a
                        href="mailto:contato@proximacorrida.com.br"
                        className="text-lime-400 font-bold hover:underline"
                    >
                        Fale conosco
                    </a>
                </div>
            </section>

            <div className="mt-auto">
                <Footer />
            </div>
        </main>
    );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center text-center p-6 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-lime-400/50 transition-colors">
            <div className="mb-4 p-3 bg-zinc-900 rounded-full">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white uppercase mb-2">{title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

function StepCard({ icon, step, title, description }: { icon: React.ReactNode, step: string, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center text-center bg-zinc-950 p-6 rounded-lg border border-zinc-800 relative z-10 w-full md:w-64">
            <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center mb-4 font-black text-black text-xl shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                {step}
            </div>
            <h3 className="text-lg font-bold text-white uppercase mb-2">{title}</h3>
            <p className="text-zinc-400 text-sm">{description}</p>
        </div>
    );
}
