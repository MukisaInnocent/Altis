import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

const INTERESTS = [
    { value: 'safari', label: 'Uganda safari' },
    { value: 'international', label: 'International travel' },
    { value: 'visa', label: 'Visa assistance' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'planning', label: 'Full trip planning' },
    { value: 'other', label: 'Something else' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InquiryForm({ compact = false }) {
    const [form, setForm] = useState({ name: '', email: '', phone: '', interest: 'safari', message: '' });
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('idle'); // idle | sending | done | error

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const validate = () => {
        const next = {};
        if (form.name.trim().length < 2) next.name = 'Please tell us your name.';
        if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.';
        if (form.message.trim().length < 10) next.message = 'Tell us a little more (at least 10 characters).';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setStatus('sending');
        try {
            await pb.collection('inquiries').create({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                interest: form.interest,
                message: form.message.trim(),
                status: 'new',
            });
            setStatus('done');
        } catch (err) {
            console.error('inquiry failed', err);
            setStatus('error');
        }
    };

    if (status === 'done') {
        return (
            <div className="brackets text-accent flex flex-col items-center gap-3 border border-border bg-card p-10 text-center">
                <CheckCircle2 className="h-10 w-10" strokeWidth={1.6} />
                <p className="font-display text-xl font-bold text-foreground">Inquiry received</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                    Thank you, {form.name.split(' ')[0]}. A travel consultant will reply within one working day.
                </p>
            </div>
        );
    }

    const field =
        'w-full border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent';
    const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground';

    return (
        <form onSubmit={submit} className="space-y-4" noValidate>
            <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
                <div>
                    <label className={label} htmlFor="inq-name">Full name *</label>
                    <input id="inq-name" className={field} value={form.name} onChange={set('name')} placeholder="Amina Nansubuga" />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                </div>
                <div>
                    <label className={label} htmlFor="inq-email">Email *</label>
                    <input id="inq-email" type="email" className={field} value={form.email} onChange={set('email')} placeholder="you@example.com" />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
                <div>
                    <label className={label} htmlFor="inq-phone">Phone / WhatsApp</label>
                    <input id="inq-phone" className={field} value={form.phone} onChange={set('phone')} placeholder="+256 7XX XXX XXX" />
                </div>
                <div>
                    <label className={label} htmlFor="inq-interest">I'm interested in</label>
                    <select id="inq-interest" className={field} value={form.interest} onChange={set('interest')}>
                        {INTERESTS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className={label} htmlFor="inq-message">Your plans *</label>
                <textarea
                    id="inq-message"
                    rows={compact ? 4 : 5}
                    className={field}
                    value={form.message}
                    onChange={set('message')}
                    placeholder="Where do you want to go, when, and how many travellers?"
                />
                {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
            </div>
            {status === 'error' && (
                <p className="text-sm text-destructive">
                    Something went wrong sending your inquiry. Please try again or call us directly.
                </p>
            )}
            <Button type="submit" size="lg" disabled={status === 'sending'} className="w-full sm:w-auto">
                {status === 'sending' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Send className="mr-2 h-4 w-4" />
                )}
                {status === 'sending' ? 'Sending…' : 'Send inquiry'}
            </Button>
        </form>
    );
}
