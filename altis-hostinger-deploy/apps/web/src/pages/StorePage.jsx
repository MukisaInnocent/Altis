import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, Loader2, ShoppingCart } from 'lucide-react';
import { getProducts, getProductQuantities } from '@/api/EcommerceApi';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import Reveal from '@/components/Reveal';
import { img } from '@/lib/cms';

export default function StorePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart } = useCart();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const res = await getProducts({ limit: 48 });
                if (res.products.length === 0) {
                    setProducts([]);
                    return;
                }
                const qty = await getProductQuantities({
                    fields: 'inventory_quantity',
                    product_ids: res.products.map((p) => p.id),
                });
                const map = new Map(qty.variants.map((v) => [v.id, v.inventory_quantity]));
                setProducts(
                    res.products.map((p) => ({
                        ...p,
                        variants: p.variants.map((v) => ({
                            ...v,
                            inventory_quantity: map.get(v.id) ?? v.inventory_quantity,
                        })),
                    })),
                );
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleAction = async (product) => {
        const isBooking = product.type?.value === 'booking';
        if (isBooking || product.variants.length !== 1) {
            navigate(`/product/${product.id}`);
            return;
        }
        const variant = product.variants[0];
        try {
            await addToCart(product, variant, 1, variant.inventory_quantity);
            toast({ title: 'Added to cart', description: `${product.title} is in your cart.` });
        } catch (e) {
            toast({ title: 'Could not add to cart', description: e.message, variant: 'destructive' });
        }
    };

    return (
        <>
            <Helmet>
                <title>Tours & Bookings — Altis Voyage</title>
                <meta
                    name="description"
                    content="Book tours, safaris and travel consultations online. Pick a date and time for appointments and pay securely."
                />
            </Helmet>

            <section className="mx-auto max-w-6xl px-4 py-16">
                <p className="caption-num text-accent">Tours & bookings</p>
                <h1 className="font-display mt-2 text-4xl font-black sm:text-5xl">Book it. Pay for it. Go.</h1>
                <p className="mt-4 max-w-2xl text-muted-foreground">
                    Tours, safaris and one-to-one travel consultations — bookable online with secure payment.
                    Appointments let you pick an exact date and time at checkout.
                </p>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-10 w-10 animate-spin text-accent" />
                    </div>
                ) : error ? (
                    <p className="py-24 text-center text-destructive">Could not load the store: {error}</p>
                ) : products.length === 0 ? (
                    <div className="brackets mx-auto mt-16 max-w-lg border border-border bg-card p-10 text-center text-accent">
                        <p className="font-display text-xl font-bold text-foreground">New journeys are being prepared</p>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Our bookable tours and consultations are being added right now. Meanwhile, send us an
                            inquiry and we'll plan it with you directly.
                        </p>
                        <Link
                            to="/inquiry"
                            className="mt-6 inline-flex h-11 items-center bg-primary px-6 text-sm font-bold text-primary-foreground"
                        >
                            Send an inquiry
                        </Link>
                    </div>
                ) : (
                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((p, i) => {
                            const isBooking = p.type?.value === 'booking';
                            const v = p.variants?.[0];
                            const price = v?.sale_price_formatted || v?.price_formatted || p.price_formatted;
                            return (
                                <Reveal key={p.id} delay={(i % 3) * 0.06}>
                                    <article className="flex h-full flex-col border border-border bg-card">
                                        <Link to={`/product/${p.id}`} className="block overflow-hidden">
                                            <img
                                                src={img(p.image)}
                                                alt={p.title}
                                                loading="lazy"
                                                className="photo aspect-[3/2] w-full object-cover transition-transform duration-500 hover:scale-105"
                                            />
                                        </Link>
                                        <div className="flex flex-1 flex-col p-5">
                                            <p className="caption-num text-muted-foreground">
                                                {String(i + 1).padStart(2, '0')} · {isBooking ? 'Appointment' : 'Tour / service'}
                                            </p>
                                            <Link to={`/product/${p.id}`}>
                                                <h2 className="font-display mt-1 text-xl font-bold hover:text-accent">{p.title}</h2>
                                            </Link>
                                            {p.subtitle && (
                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.subtitle}</p>
                                            )}
                                            <div className="mt-auto flex items-center justify-between pt-5">
                                                <span className="font-display text-lg font-bold text-accent">{price}</span>
                                                <button
                                                    onClick={() => handleAction(p)}
                                                    className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.97]"
                                                >
                                                    {isBooking ? (
                                                        <><CalendarClock className="h-4 w-4" /> Book now</>
                                                    ) : (
                                                        <><ShoppingCart className="h-4 w-4" /> Add to cart</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                </Reveal>
                            );
                        })}
                    </div>
                )}
            </section>
        </>
    );
}
