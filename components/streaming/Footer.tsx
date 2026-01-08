'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
    const pathname = usePathname();
    if (pathname === '/login') return null;
    const footerLinks = [
        {
            title: 'Navigation',
            links: [
                { label: 'Home', href: '/' },
                { label: 'Movies', href: '/?filter=movie' },
                { label: 'Series', href: '/?filter=series' },
                { label: 'My List', href: '/my-list' },
            ]
        },
        {
            title: 'Support',
            links: [
                { label: 'Help Center', href: '/' },
                { label: 'Contact Us', href: '/' },
                { label: 'Terms of Use', href: '/' },
                { label: 'Privacy Policy', href: '/' },
            ]
        },
        {
            title: 'Account',
            links: [
                { label: 'Manage Profile', href: '/' },
                { label: 'Settings', href: '/' },
                { label: 'Subscription', href: '/' },
                { label: 'Sign Out', href: '/' },
            ]
        }
    ];

    return (
        <footer className="relative bg-[#121212] border-t border-white/5">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16">
                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black mb-4">
                            <span className="text-white">
                                Spot
                            </span>
                            <span className="text-[#1DB954]">Flix</span>
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Your premier destination for movies and series. Stream unlimited entertainment anytime, anywhere.
                        </p>

                        {/* Social Icons */}
                        <div className="flex gap-3">
                            {[
                                { Icon: Facebook, label: 'Facebook' },
                                { Icon: Twitter, label: 'Twitter' },
                                { Icon: Instagram, label: 'Instagram' },
                                { Icon: Youtube, label: 'YouTube' }
                            ].map(({ Icon, label }) => (
                                <a
                                    key={label}
                                    href="#"
                                    aria-label={label}
                                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#1DB954]/20 border border-white/10 hover:border-[#1DB954]/50 flex items-center justify-center transition-all duration-200 group"
                                >
                                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#1DB954] transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Sections */}
                    {footerLinks.map((section) => (
                        <div
                            key={section.title}
                            className={
                                section.title === 'Navigation' || section.title === 'Account'
                                    ? 'hidden md:block'
                                    : ''
                            }
                        >
                            <h3 className="text-white font-semibold mb-4">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-400 text-sm hover:text-[#1DB954] transition-colors duration-200"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-8" />

                {/* Bottom Section */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-gray-500 text-sm" suppressHydrationWarning>
                            © {new Date().getFullYear()} SpotFlix. All rights reserved.
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                            Developed by Daniel Schafer
                        </p>
                    </div>

                    {/* Language Selector */}
                    <div className="flex items-center gap-2">
                        <select className="bg-white/5 text-gray-400 text-sm rounded-lg px-4 py-2 transition-all cursor-pointer hover:bg-white/10 outline-none border-none focus:ring-0">
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="it">Italiano</option>
                            <option value="pt">Português</option>
                        </select>
                    </div>
                </div>
            </div>
        </footer>
    );
}
