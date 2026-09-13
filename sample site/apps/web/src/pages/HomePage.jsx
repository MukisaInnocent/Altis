import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
    ArrowRight, BedDouble, BookOpen, Map, Plane, Quote, ShieldCheck, Stamp, Star,
} from 'lucide-react';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import InquiryForm from '@/components/InquiryForm';
import { getContent, img, listCms } from '@/lib/cms';

const ICONS = { Stamp, BookOpen, BedDouble, Plane, Map, ShieldCheck };

const formatUgx = (n) => (n ? `UGX ${Number(n).toLocaleString('en-US')}` : '');

export default function HomePage() {
    const [hero, setHero] = useState(null);
    const [about, setAbout] = useState(null);
    const [destinations, setDestinations] = useState([]);
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [gallery, setGallery] = useState([]);

    useEffect(() => {
        getContent('hero').then(setHero);
        getContent('about').then(setAbout);
        listCms('destinations', { filter: 'featured = true' }).then(setDestinations).catch(() => {});
        listCms('packages', { filter: 'featured = true' }).then(setPackages).catch(() => {});
        listCms('services').then(setServices).catch(() => {});
        listCms('testimonials').then(setTestimonials).catch(() => {});
        listCms('gallery').then(setGallery).catch(() => {});
    }, []);

    return (
        <>
            <Helmet>
                <title>Pearl of Africa Travel — Uganda Safaris & Worldwide Journeys</title>
                <meta
                    name="description"
                    content="Uganda-based travel agency operating worldwide: gorilla safaris, international tours, visa assistance, flights, accommodation and full trip planning."
                />
            </Helmet>

            {/* HERO — full-bleed documentary image with one continuous drift animation */}
            <section className="halftone relative flex min-h-[100dvh] items-end overflow-hidden bg-primary">
                <img
                    src={img(hero?.image)}
                    alt="Elephant herd crossing the savanna at sunset in Uganda"
                    className="photo hero-drift absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/35 to-primary/20" />
                <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-40 text-primary-foreground">
                    <p className="caption-num mb-5 opacity-80">Est. Kampala · Operating worldwide</p>
                    <h1 className="font-display max-w-3xl text-4xl font-black leading-[1.05] sm:text-6xl lg:text-7xl">
                        {hero?.title || 'From the Pearl of Africa to the World'}
                    </h1>
                    <p className="mt-6 max-w-xl text-base opacity-90 sm:text-lg">
                        {hero?.subtitle ||
                            'Uganda-based, worldwide in reach. Safaris at home, journeys abroad — planned, booked and supported by people who answer the phone.'}
                    </p>
                    <div className="mt-9 flex flex-wrap gap-4">
                        <Link
                            to="/destinations"
                            className="brackets inline-flex h-12 items-center gap-2 bg-background px-7 text-sm font-bold text-foreground transition-transform active:scale-[0.98]"
                        >
                            {hero?.ctaPrimary || 'Explore Destinations'} <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            to="/inquiry"
                            className="inline-flex h-12 items-center gap-2 border border-primary-foreground/60 px-7 text-sm font-bold transition-colors hover:bg-primary-foreground/10 active:scale-[0.98]"
                        >
                            {hero?.ctaSecondary || 'Plan Your Trip'}
                        </Link>
                    </div>
                    <div className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-primary-foreground/25 pt-6">
                        <div>
                            <p className="font-display text-3xl font-bold"><CountUp value={12} suffix="+" /></p>
                            <p className="caption-num mt-1 opacity-70">Years operating</p>
                        </div>
                        <div>
                            <p className="font-display text-3xl font-bold"><CountUp value={4800} suffix="+" /></p>
                            <p className="caption-num mt-1 opacity-70">Travellers served</p>
                        </div>
                        <div>
                            <p className="font-display text-3xl font-bold"><CountUp value={40} suffix="+" /></p>
                            <p className="caption-num mt-1 opacity-70">Destinations</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section className="mx-auto max-w-6xl px-4 py-20">
                <Reveal>
                    <div className="grid items-center gap-10 md:grid-cols-[1fr_1.2fr]">
                        <p className="caption-num text-accent">01 / Who we are</p>
                        <div>
                            <h2 className="font-display text-3xl font-bold sm:text-4xl">
                                {about?.heading || 'A Ugandan agency with a global map'}
                            </h2>
                            <p className="mt-4 max-w-2xl text-muted-foreground">
                                {about?.body ||
                                    'We help Ugandans travel internationally, welcome visitors to Uganda, and support journeys everywhere in between — visas, flights, stays, safaris and 24/7 support.'}
                            </p>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* FEATURED DESTINATIONS — documentary sequence with numbered captions */}
            <section className="border-y border-border bg-secondary/60 py-20">
                <div className="mx-auto max-w-6xl px-4">
                    <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="caption-num text-accent">02 / Destinations</p>
                            <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Where we take you</h2>
                        </div>
                        <Link to="/destinations" className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline">
                            All destinations <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Reveal>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {destinations.slice(0, 6).map((d, i) => (
                            <Reveal key={d.id} delay={i * 0.06}>
                                <Link to="/destinations" className="group block">
                                    <figure className={i === 0 ? 'brackets text-accent' : ''}>
                                        <div className="overflow-hidden">
                                            <img
                                                src={img(d.image)}
                                                alt={d.name}
                                                loading="lazy"
                                                className="photo aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <figcaption className="mt-3 flex items-baseline justify-between gap-3">
                                            <span className="caption-num text-muted-foreground">
                                                {String(i + 1).padStart(2, '0')} · {d.country}
                                            </span>
                                            {d.price_from > 0 && (
                                                <span className="text-xs font-semibold text-accent">from {formatUgx(d.price_from)}</span>
                                            )}
                                        </figcaption>
                                        <h3 className="font-display mt-1 text-xl font-bold group-hover:text-accent">{d.name}</h3>
                                        <p className="text-sm text-muted-foreground">{d.tagline}</p>
                                    </figure>
                                </Link>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURED PACKAGES */}
            <section className="mx-auto max-w-6xl px-4 py-20">
                <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="caption-num text-accent">03 / Tour packages</p>
                        <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Signature journeys</h2>
                    </div>
                    <Link to="/store" className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline">
                        Book & pay online <ArrowRight className="h-4 w-4" />
                    </Link>
                </Reveal>
                <div className="grid gap-px border border-border bg-border md:grid-cols-2">
                    {packages.slice(0, 4).map((p, i) => (
                        <Reveal key={p.id} delay={i * 0.05} className="bg-card">
                            <div className="flex h-full flex-col gap-5 p-6 sm:flex-row">
                                <img
                                    src={img(p.image)}
                                    alt={p.title}
                                    loading="lazy"
                                    className="photo h-40 w-full shrink-0 object-cover sm:h-auto sm:w-40"
                                />
                                <div className="flex flex-1 flex-col">
                                    <p className="caption-num text-muted-foreground">
                                        {String(i + 1).padStart(2, '0')} · {p.days} days · {p.destination}
                                    </p>
                                    <h3 className="font-display mt-2 text-xl font-bold">{p.title}</h3>
                                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                                    <div className="mt-auto flex items-center justify-between pt-4">
                                        <span className="font-display text-lg font-bold text-accent">{formatUgx(p.price)}</span>
                                        <Link to="/inquiry" className="text-sm font-bold underline underline-offset-4 hover:text-accent">
                                            Enquire
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* SERVICES */}
            <section className="border-y border-border bg-primary py-20 text-primary-foreground">
                <div className="mx-auto max-w-6xl px-4">
                    <Reveal className="mb-10">
                        <p className="caption-num opacity-70">04 / Services</p>
                        <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Everything between you and departure</h2>
                    </Reveal>
                    <div className="grid gap-px bg-primary-foreground/15 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((s) => {
                            const Icon = ICONS[s.icon] || Map;
                            return (
                                <div key={s.id} className="bg-primary p-7">
                                    <Icon className="h-7 w-7 opacity-80" strokeWidth={1.5} />
                                    <h3 className="font-display mt-4 text-lg font-bold">{s.title}</h3>
                                    <p className="mt-2 text-sm opacity-80">{s.summary}</p>
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-8 max-w-2xl text-sm opacity-70">
                        We prepare, review and submit every application with care. Visa approval is determined by
                        the relevant authorities.
                    </p>
                </div>
            </section>

            {/* GALLERY STRIP */}
            <section className="mx-auto max-w-6xl px-4 py-20">
                <Reveal className="mb-10">
                    <p className="caption-num text-accent">05 / Field notes</p>
                    <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">From recent journeys</h2>
                </Reveal>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {gallery.slice(0, 8).map((g, i) => (
                        <Reveal key={g.id} delay={i * 0.04}>
                            <figure>
                                <img
                                    src={img(g.image)}
                                    alt={g.title}
                                    loading="lazy"
                                    className="photo aspect-square w-full object-cover"
                                />
                                <figcaption className="caption-num mt-2 text-muted-foreground">
                                    {String(i + 1).padStart(2, '0')} · {g.title}
                                </figcaption>
                            </figure>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="border-y border-border bg-secondary/60 py-20">
                <div className="mx-auto max-w-6xl px-4">
                    <Reveal className="mb-10">
                        <p className="caption-num text-accent">06 / Travellers</p>
                        <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Word from the road</h2>
                    </Reveal>
                    <div className="grid gap-8 md:grid-cols-2">
                        {testimonials.map((t) => (
                            <Reveal key={t.id}>
                                <blockquote className="brackets text-accent border border-border bg-card p-8">
                                    <Quote className="h-6 w-6 text-accent" strokeWidth={1.5} />
                                    <p className="font-display mt-4 text-lg leading-relaxed">“{t.quote}”</p>
                                    <footer className="mt-6 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold">{t.name}</p>
                                            <p className="text-xs text-muted-foreground">{t.location} · {t.trip}</p>
                                        </div>
                                        <div className="flex gap-0.5 text-accent">
                                            {Array.from({ length: Math.round(t.rating || 5) }).map((_, i) => (
                                                <Star key={i} className="h-4 w-4 fill-current" />
                                            ))}
                                        </div>
                                    </footer>
                                </blockquote>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* INQUIRY */}
            <section className="mx-auto max-w-6xl px-4 py-20">
                <div className="grid gap-12 md:grid-cols-2">
                    <Reveal>
                        <p className="caption-num text-accent">07 / Start here</p>
                        <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Tell us where you're going</h2>
                        <p className="mt-4 text-muted-foreground">
                            Send an inquiry and a consultant replies within one working day — with routes, dates,
                            honest prices and visa guidance. Prefer to book instantly?{' '}
                            <Link to="/store" className="font-semibold text-accent underline underline-offset-4">
                                Browse bookable tours & consultations
                            </Link>
                            .
                        </p>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <InquiryForm compact />
                    </Reveal>
                </div>
            </section>
        </>
    );
}
