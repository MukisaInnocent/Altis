import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, Minus, Plus, ShoppingCart, XCircle } from 'lucide-react';
import { getProduct, getProductQuantities } from '@/api/EcommerceApi';
import BookingSlotPicker from '@/components/BookingSlotPicker';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { img } from '@/lib/cms';

export default function ProductDetailPage() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [imageIndex, setImageIndex] = useState(0);
    const { addToCart } = useCart();
    const { toast } = useToast();

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const p = await getProduct(id);
                const qty = await getProductQuantities({
                    fields: 'inventory_quantity',
                    product_ids: [p.id],
                });
                const map = new Map(qty.variants.map((v) => [v.id, v.inventory_quantity]));
                const withQty = {
                    ...p,
                    variants: p.variants.map((v) => ({
                        ...v,
                        inventory_quantity: map.get(v.id) ?? v.inventory_quantity,
                    })),
                };
                setProduct(withQty);
                if (withQty.variants.length > 0) setSelectedVariant(withQty.variants[0]);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleAddToCart = useCallback(async () => {
        if (!product || !selectedVariant) return;
        try {
            await addToCart(product, selectedVariant, quantity, selectedVariant.inventory_quantity);
            toast({ title: 'Added to cart', description: `${quantity} × ${product.title}` });
        } catch (e) {
            toast({ title: 'Could not add to cart', description: e.message, variant: 'destructive' });
        }
    }, [product, selectedVariant, quantity, addToCart, toast]);

    if (loading) {
        return (
            <div className="flex justify-center py-40">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <XCircle className="mx-auto h-12 w-12 text-destructive" />
                <p className="mt-4 text-destructive">Could not load this product: {error}</p>
                <Link to="/store" className="mt-6 inline-flex items-center gap-2 font-bold text-accent hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to tours & bookings
                </Link>
            </div>
        );
    }

    const isBooking = product.type?.value === 'booking';
    const price = selectedVariant?.sale_price_formatted ?? selectedVariant?.price_formatted;
    const isStockManaged = selectedVariant?.manage_inventory ?? false;
    const available = selectedVariant?.inventory_quantity ?? 0;
    const canAdd = !isStockManaged || quantity <= available;
    const currentImage = product.images[imageIndex];

    return (
        <>
            <Helmet>
                <title>{product.title} — Altis Voyage</title>
                <meta name="description" content={product.subtitle || product.title} />
            </Helmet>

            <section className="mx-auto max-w-6xl px-4 py-12">
                <Link to="/store" className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to tours & bookings
                </Link>

                <div className="mt-8 grid gap-10 md:grid-cols-2">
                    <div>
                        <div className="brackets text-accent">
                            <img
                                src={img(currentImage?.url || product.image)}
                                alt={product.title}
                                className="photo aspect-[3/2] w-full object-cover"
                            />
                        </div>
                        {product.images.length > 1 && (
                            <div className="mt-6 flex gap-2 overflow-x-auto">
                                {product.images.map((im, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setImageIndex(i)}
                                        className={`h-16 w-20 shrink-0 overflow-hidden border-2 ${
                                            i === imageIndex ? 'border-accent' : 'border-transparent opacity-70'
                                        }`}
                                    >
                                        <img src={img(im.url)} alt="" className="photo h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="caption-num text-muted-foreground">
                            {isBooking ? 'Bookable appointment' : 'Tour / service'}
                        </p>
                        <h1 className="font-display mt-2 text-3xl font-black sm:text-4xl">{product.title}</h1>
                        {product.subtitle && <p className="mt-2 text-muted-foreground">{product.subtitle}</p>}
                        <p className="font-display mt-5 text-3xl font-bold text-accent">{price}</p>

                        {product.description && (
                            <div
                                className="prose prose-sm mt-6 max-w-none text-muted-foreground"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        )}

                        {product.additional_info?.length > 0 && (
                            <div className="mt-6 space-y-4">
                                {product.additional_info
                                    .slice()
                                    .sort((a, b) => a.order - b.order)
                                    .map((info) => (
                                        <div key={info.id} className="border-l-2 border-accent pl-4">
                                            <h3 className="font-display font-bold">{info.title}</h3>
                                            <div
                                                className="prose prose-sm max-w-none text-muted-foreground"
                                                dangerouslySetInnerHTML={{ __html: info.description }}
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}

                        {product.variants.length > 1 && (
                            <div className="mt-6">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    Options
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`h-10 border px-4 text-sm font-semibold ${
                                                selectedVariant?.id === v.id
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-border bg-card hover:bg-secondary'
                                            }`}
                                        >
                                            {v.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 border-t border-border pt-8">
                            {isBooking ? (
                                <BookingSlotPicker product={product} variant={selectedVariant} />
                            ) : (
                                <>
                                    <div className="mb-5 flex items-center gap-4">
                                        <div className="flex items-center border border-border">
                                            <button
                                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                                className="flex h-11 w-11 items-center justify-center hover:bg-secondary"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-12 text-center font-bold">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity((q) => q + 1)}
                                                className="flex h-11 w-11 items-center justify-center hover:bg-secondary"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleAddToCart}
                                        size="lg"
                                        className="w-full"
                                        disabled={!canAdd || !product.purchasable}
                                    >
                                        <ShoppingCart className="mr-2 h-5 w-5" /> Add to cart
                                    </Button>
                                    {isStockManaged && canAdd && product.purchasable && (
                                        <p className="mt-3 flex items-center gap-2 text-sm text-accent">
                                            <CheckCircle className="h-4 w-4" /> {available} places available
                                        </p>
                                    )}
                                    {isStockManaged && !canAdd && (
                                        <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
                                            <XCircle className="h-4 w-4" /> Only {available} left.
                                        </p>
                                    )}
                                    {!product.purchasable && (
                                        <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
                                            <XCircle className="h-4 w-4" /> Currently unavailable
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
