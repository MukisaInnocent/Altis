import React from 'react';
import { Helmet } from 'react-helmet';
import { BookOpen, Clock, FileCheck, Phone, Stamp } from 'lucide-react';
import Reveal from '@/components/Reveal';
import InquiryForm from '@/components/InquiryForm';

const DOCS = [
    'Passport valid for at least 6 months beyond travel',
    'Recent passport-size photographs',
    'Bank statements or proof of funds where required',
    'Invitation letter or hotel confirmation',
    'Return flight reservation',
    'Yellow fever vaccination card (Uganda requirement)',
];

export default function InquiryPage() {
    return (
        <>
            <Helmet>
                <title>Plan Your Trip — Pearl of Africa Travel</title>
                <meta
                    name="description"
                    content="Send a travel inquiry: Uganda safaris, international trips, visa assistance, passports and documentation guidance, accommodation and full planning."
                />
            </Helmet>

            <section className="mx-auto max-w-6xl px-4 py-16">
                <p className="caption-num text-accent">Plan your trip</p>
                <h1 className="font-display mt-2 text-4xl font-black sm:text-5xl">Start with a conversation</h1>
                <p className="mt-4 max-w-2xl text-muted-foreground">
                    Tell us where, when and who is travelling. A consultant replies within one working day with
                    routes, dates, honest pricing and documentation guidance.
                </p>

                <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
                    <Reveal>
                        <div className="border border-border bg-card p-7 sm:p-9">
                            <InquiryForm />
                        </div>
                    </Reveal>

                    <div className="space-y-8">
                        <Reveal delay={0.05}>
                            <div className="brackets text-accent border border-border bg-card p-7">
                                <div className="flex items-center gap-3">
                                    <Stamp className="h-6 w-6 text-accent" strokeWidth={1.6} />
                                    <h2 className="font-display text-xl font-bold">Visa assistance, honestly</h2>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    We prepare your application, review every document and book your appointment.
                                    Visa approval is determined by the relevant authorities — no agency can
                                    guarantee an outcome, and we will never pretend otherwise.
                                </p>
                            </div>
                        </Reveal>

                        <Reveal delay={0.1}>
                            <div className="border border-border bg-card p-7">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="h-6 w-6 text-accent" strokeWidth={1.6} />
                                    <h2 className="font-display text-xl font-bold">Documentation checklist</h2>
                                </div>
                                <ul className="mt-4 space-y-2.5">
                                    {DOCS.map((d) => (
                                        <li key={d} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                            <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                                            {d}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>

                        <Reveal delay={0.15}>
                            <div className="border border-border bg-primary p-7 text-primary-foreground">
                                <div className="flex items-center gap-3">
                                    <Phone className="h-6 w-6" strokeWidth={1.6} />
                                    <h2 className="font-display text-xl font-bold">Prefer to talk?</h2>
                                </div>
                                <p className="mt-3 text-sm opacity-85">+256 700 123 456 · hello@pearlofafrica.travel</p>
                                <p className="mt-1 flex items-center gap-2 text-sm opacity-70">
                                    <Clock className="h-4 w-4" /> Mon–Sat, 8:30–18:00 EAT
                                </p>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>
        </>
    );
}
