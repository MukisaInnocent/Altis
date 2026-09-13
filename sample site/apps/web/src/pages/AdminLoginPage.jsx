import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function AdminLoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const auth = await login(email.trim(), password);
            if (auth?.record?.role !== 'admin') {
                setError('This account does not have administrator access.');
                return;
            }
            navigate('/admin');
        } catch {
            setError('Invalid email or password.');
        } finally {
            setBusy(false);
        }
    };

    const field =
        'w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent';

    return (
        <>
            <Helmet>
                <title>Staff Sign In — Pearl of Africa Travel</title>
                <meta name="description" content="Administrator sign in for the Pearl of Africa Travel content dashboard." />
            </Helmet>
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="brackets w-full max-w-md border border-border bg-card p-9 text-accent">
                    <div className="flex items-center gap-2">
                        <Compass className="h-6 w-6 text-accent" />
                        <span className="font-display text-lg font-bold text-foreground">Pearl of Africa Travel</span>
                    </div>
                    <h1 className="font-display mt-6 flex items-center gap-2 text-2xl font-bold text-foreground">
                        <Lock className="h-5 w-5 text-accent" /> Staff sign in
                    </h1>
                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="adm-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Email
                            </label>
                            <input
                                id="adm-email"
                                type="email"
                                required
                                className={field}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <label htmlFor="adm-pass" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Password
                            </label>
                            <input
                                id="adm-pass"
                                type="password"
                                required
                                className={field}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" size="lg" disabled={busy}>
                            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign in
                        </Button>
                    </form>
                    <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-accent">
                        ← Back to the site
                    </Link>
                </div>
            </div>
        </>
    );
}
