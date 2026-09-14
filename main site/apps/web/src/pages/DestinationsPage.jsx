import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Search } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { img, listCms } from '@/lib/cms';

const REGIONS = [
    { value: 'all', label: 'All' },
    { value: 'uganda', label: 'Uganda' },
    { value: 'east-africa', label: 'East Africa' },
    { value: 'international', label: 'International' },
];

const formatUgx = (n) => (n ? `UGX ${Number(n).toLocaleString('en-US')}` : 'On request');

export default function DestinationsPage() {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [region, setRegion] = useState('all');
    const [query, setQuery] = useState('');

    useEffect(() => {
        listCms('destinations')
            .then(setDestinations)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return destinations.filter(
            (d) =>
                (region === 'all' || d.region === region) &&
                (!q || `${d.name} ${d.country} ${d.tagline}`.toLowerCase().includes(q)),
        );
    }, [destinations, region, query]);

    return (
        <>
            <Helmet>
                <title>Destinations — Altis Voyage</title>
                <meta
                    name="description"
                    content="Uganda safaris, East African escapes and international destinations — Dubai, Paris, Istanbul, London and more, planned by a Ugandan agency."
                />
            </Helmet>

            <section className="mx-auto max-w-6xl px-4 py-16">
                <p className="caption-num text-accent">Destinations</p>
                <h1 className="font-display mt-2 text-4xl font-black sm:text-5xl">The map, our way</h1>
                <p className="mt-4 max-w-2xl text-muted-foreground">
                    From gorilla highlands to Gulf skylines. Filter by region or search — every journey includes
                    planning, documentation guidance and support while you travel.
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {REGIONS.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => setRegion(r.value)}
                                className={`h-10 border px-4 text-sm font-semibold transition-colors ${
                                    region === r.value
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-card hover:bg-secondary'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search destinations…"
                            className="h-11 w-full border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-accent sm:w-64"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-10 w-10 animate-spin text-accent" />
                    </div>
                ) : error ? (
                    <p className="py-24 text-center text-destructive">Could not load destinations: {error}</p>
                ) : filtered.length === 0 ? (
                    <p className="py-24 text-center text-muted-foreground">
                        No destinations match your search. Try another region or keyword.
                    </p>
                ) : (
                    <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((d, i) => (
                            <Reveal key={d.id} delay={(i % 3) * 0.06}>
                                <article className={d.featured ? 'brackets text-accent' : ''}>
                                    <div className="overflow-hidden">
                                        <img
                                            src={img(d.image)}
                                            alt={d.name}
                                            loading="lazy"
                                            className="photo aspect-[3/2] w-full object-cover transition-transform duration-500 hover:scale-105"
                                        />
                                    </div>
                                    <p className="caption-num mt-3 text-muted-foreground">
                                        {String(i + 1).padStart(2, '0')} · {d.country} · {d.region.replace('-', ' ')}
                                    </p>
                                    <h2 className="font-display mt-1 text-2xl font-bold">{d.name}</h2>
                                    <p className="mt-1 text-sm font-medium text-accent">{d.tagline}</p>
                                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{d.description}</p>
                                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                                        <span className="text-sm font-bold">{formatUgx(d.price_from)}</span>
                                        <Link
                                            to="/inquiry"
                                            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
                                        >
                                            Plan this trip <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </article>
                            </Reveal>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
