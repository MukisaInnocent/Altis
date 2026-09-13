import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
    return (
        <>
            <Helmet>
                <title>Booking Confirmed — Pearl of Africa Travel</title>
                <meta name="description" content="Your payment was received and your booking is confirmed." />
            </Helmet>
            <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center">
                <div className="brackets text-accent border border-border bg-card p-12">
                    <CheckCircle2 className="mx-auto h-14 w-14 text-accent" strokeWidth={1.4} />
                    <h1 className="font-display mt-6 text-3xl font-black">Thank you — you're booked</h1>
                    <p className="mt-4 text-muted-foreground">
                        Your payment was received. A confirmation is on its way to your email, and our team will
                        reach out with final details before your journey or appointment.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link
                            to="/destinations"
                            className="inline-flex h-11 items-center bg-primary px-6 text-sm font-bold text-primary-foreground"
                        >
                            Keep exploring
                        </Link>
                        <Link
                            to="/inquiry"
                            className="inline-flex h-11 items-center border border-border px-6 text-sm font-bold hover:bg-secondary"
                        >
                            Ask us anything
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
