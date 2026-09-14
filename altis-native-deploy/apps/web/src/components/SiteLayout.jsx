import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Compass, Menu, Phone, ShoppingCart as CartIcon, X } from 'lucide-react';
import ShoppingCart from '@/components/ShoppingCart';
import { useCart } from '@/hooks/useCart';
import { getContent } from '@/lib/cms';

const NAV = [
    { to: '/', label: 'Home' },
    { to: '/destinations', label: 'Destinations' },
    { to: '/store', label: 'Tours & Bookings' },
    { to: '/inquiry', label: 'Plan Your Trip' },
];

export default function SiteLayout() {
    const [cartOpen, setCartOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [contact, setContact] = useState(null);
    const { cartItems } = useCart();

    useEffect(() => {
        getContent('contact').then(setContact);
    }, []);

    const linkClass = ({ isActive }) =>
        `text-sm font-medium tracking-wide transition-colors hover:text-accent ${
            isActive ? 'text-accent underline underline-offset-8 decoration-2' : 'text-foreground'
        }`;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img src="/logo.jpg" alt="Altis Voyage" className="h-14 w-auto" />
                    </Link>
                    <nav className="hidden items-center gap-7 md:flex">
                        {NAV.map((item) => (
                            <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative flex h-11 w-11 items-center justify-center border border-border bg-card transition-colors hover:bg-secondary"
                            aria-label="Open cart"
                        >
                            <CartIcon className="h-5 w-5" strokeWidth={1.8} />
                            {cartItems.length > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center bg-accent px-1 text-[11px] font-bold text-accent-foreground">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            className="flex h-11 w-11 items-center justify-center border border-border bg-card md:hidden"
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                {menuOpen && (
                    <nav className="border-t border-border bg-background px-4 py-4 md:hidden">
                        <div className="flex flex-col gap-4">
                            {NAV.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/'}
                                    onClick={() => setMenuOpen(false)}
                                    className="py-1 text-base font-medium"
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </nav>
                )}
            </header>

            <main className="flex-1">
                <Outlet />
            </main>

            <footer className="mt-24 bg-primary text-primary-foreground">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Compass className="h-6 w-6" strokeWidth={1.8} />
                            <span className="font-display text-lg font-bold">Altis Voyage</span>
                        </div>
                        <p className="mt-4 text-sm opacity-80">
                            A Ugandan travel agency operating worldwide — safaris at home, journeys abroad,
                            visas, flights and stays.
                        </p>
                    </div>
                    <div>
                        <h4 className="caption-num opacity-70">Explore</h4>
                        <ul className="mt-4 space-y-2 text-sm">
                            {NAV.map((item) => (
                                <li key={item.to}>
                                    <Link to={item.to} className="opacity-80 transition-opacity hover:opacity-100">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="caption-num opacity-70">Contact</h4>
                        <ul className="mt-4 space-y-2 text-sm opacity-80">
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4" /> {contact?.phone || '+256 788 748 128'}
                            </li>
                            <li>{contact?.email || 'info@altistravels.com'}</li>
                            <li>{contact?.address || 'Equatorial Mall, Level 3, Room 342, Bombo Road, Kampala, Uganda'}</li>
                            <li>{contact?.hours || 'Mon–Sat, 8:30–18:00 EAT'}</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="caption-num opacity-70">Good to know</h4>
                        <p className="mt-4 text-sm opacity-80">
                            We prepare and review every application carefully. Visa approval is determined by
                            the relevant authorities.
                        </p>
                    </div>
                </div>
                <div className="border-t border-primary-foreground/15">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs opacity-70">
                        <span>© {new Date().getFullYear()} Altis Voyage Travel Services Ltd. Kampala, Uganda.</span>
                        <Link to="/admin/login" className="underline underline-offset-4 hover:opacity-100">
                            Staff sign in
                        </Link>
                    </div>
                </div>
            </footer>

            <ShoppingCart isCartOpen={cartOpen} setIsCartOpen={setCartOpen} />
        </div>
    );
}
