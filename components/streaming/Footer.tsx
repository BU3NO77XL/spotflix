'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
    const pathname = usePathname();

    // Don't show footer on auth pages
    if (pathname === '/login' || pathname === '/signup') return null;

    const sections = [
        {
            links: [
                { label: 'Audiodescrição', href: '#' },
                { label: 'Relações com Investidores', href: '#' },
                { label: 'Avisos Legais', href: '#' },
            ]
        },
        {
            links: [
                { label: 'Central de Ajuda', href: '#' },
                { label: 'Carreiras', href: '#' },
                { label: 'Preferências de Cookies', href: '#' },
            ]
        },
        {
            links: [
                { label: 'Vale-presente', href: '#' },
                { label: 'Termos de Uso', href: '#' },
                { label: 'Informações Corporativas', href: '#' },
            ]
        },
        {
            links: [
                { label: 'Central de Imprensa', href: '#' },
                { label: 'Privacidade', href: '#' },
                { label: 'Fale Conosco', href: '#' },
            ]
        }
    ];

    return (
        <footer className="bg-[#141414] pt-20 pb-10">
            <div className="max-w-[1000px] mx-auto px-[38px]">
                {/* Social Media Icons */}
                <div className="flex gap-6 mb-4">
                    <a href="#" className="text-white hover:text-white/80 transition-colors">
                        <Facebook className="w-6 h-6 fill-white" />
                    </a>
                    <a href="#" className="text-white hover:text-white/80 transition-colors">
                        <Instagram className="w-6 h-6" />
                    </a>
                    <a href="#" className="text-white hover:text-white/80 transition-colors">
                        <Twitter className="w-6 h-6 fill-white" />
                    </a>
                    <a href="#" className="text-white hover:text-white/80 transition-colors">
                        <Youtube className="w-6 h-6" />
                    </a>
                </div>

                {/* Footer Links Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                    {sections.map((section, idx) => (
                        <ul key={idx} className="space-y-4">
                            {section.links.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-[#808080] text-[13px] hover:underline transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>

                {/* Service Code Button */}
                <div className="mb-6">
                    <button className="border border-[#808080] text-[#808080] text-[13px] px-2 py-1.5 hover:text-white hover:border-white transition-colors">
                        Código de Serviço
                    </button>
                </div>

                {/* Copyright & Developed By */}
                <div className="text-[#808080] text-[11px] space-y-4">
                    <p>© 2025-{new Date().getFullYear()} WEBFLIX, Inc.</p>
                    <div className="flex items-center gap-2">
                        <span>Desenvolvido a partir de</span>
                        <span className="text-white font-medium">BUENO77XL</span>
                    </div>
                    <p className="text-[#555] text-[11px]">este site não armazena mídias no servidor</p>
                </div>
            </div>
        </footer>
    );
}
