import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Compass, Loader2, LogOut, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { img } from '@/lib/cms';

const SCHEMAS = {
    destinations: {
        label: 'Destinations',
        display: 'name',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'country', label: 'Country', type: 'text' },
            { name: 'region', label: 'Region', type: 'select', options: ['uganda', 'east-africa', 'international'] },
            { name: 'tagline', label: 'Tagline', type: 'text' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'image', label: 'Image', type: 'image' },
            { name: 'price_from', label: 'Price from (UGX)', type: 'number' },
            { name: 'featured', label: 'Featured on homepage', type: 'bool' },
        ],
    },
    packages: {
        label: 'Packages',
        display: 'title',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'destination', label: 'Destination', type: 'text' },
            { name: 'days', label: 'Days', type: 'number' },
            { name: 'price', label: 'Price (UGX)', type: 'number' },
            { name: 'image', label: 'Image', type: 'image' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'featured', label: 'Featured on homepage', type: 'bool' },
        ],
    },
    services: {
        label: 'Services',
        display: 'title',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'summary', label: 'Summary', type: 'textarea' },
            { name: 'description', label: 'Full description', type: 'textarea' },
            {
                name: 'icon', label: 'Icon', type: 'select',
                options: ['Stamp', 'BookOpen', 'BedDouble', 'Plane', 'Map', 'ShieldCheck'],
            },
            { name: 'image', label: 'Image', type: 'image' },
        ],
    },
    testimonials: {
        label: 'Testimonials',
        display: 'name',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'location', label: 'Location', type: 'text' },
            { name: 'quote', label: 'Quote', type: 'textarea' },
            { name: 'trip', label: 'Trip', type: 'text' },
            { name: 'rating', label: 'Rating (1–5)', type: 'number' },
        ],
    },
    gallery: {
        label: 'Gallery',
        display: 'title',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'image', label: 'Image', type: 'image' },
            { name: 'category', label: 'Category', type: 'select', options: ['safari', 'city', 'beach', 'culture', 'stays'] },
        ],
    },
};

const fieldCls =
    'w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent';
const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground';

function ImageInput({ value, onChange }) {
    const [uploading, setUploading] = useState(false);

    const upload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('title', file.name);
            fd.append('file', file);
            const rec = await pb.collection('media').create(fd);
            onChange(pb.files.getURL(rec, rec.file));
        } catch (err) {
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            {value && <img src={img(value)} alt="" className="photo h-24 w-36 border border-border object-cover" />}
            <input
                className={fieldCls}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Image URL, or upload below"
            />
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 border border-border bg-secondary px-3 text-xs font-bold hover:bg-muted">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading…' : 'Upload image'}
                <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
            </label>
        </div>
    );
}

function CollectionAdmin({ schema, collection }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null | 'new' | record
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        pb.collection(collection)
            .getFullList({ sort: '-created' })
            .then(setRecords)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [collection]);

    useEffect(load, [load]);

    const openNew = () => {
        const blank = {};
        schema.fields.forEach((f) => {
            blank[f.name] = f.type === 'bool' ? false : f.type === 'number' ? 0 : f.type === 'select' ? f.options[0] : '';
        });
        setForm(blank);
        setEditing('new');
    };

    const openEdit = (rec) => {
        const data = {};
        schema.fields.forEach((f) => {
            data[f.name] = rec[f.name] ?? (f.type === 'bool' ? false : '');
        });
        setForm(data);
        setEditing(rec);
    };

    const save = async () => {
        for (const f of schema.fields) {
            if (f.required && !String(form[f.name] ?? '').trim()) {
                alert(`${f.label} is required.`);
                return;
            }
        }
        setSaving(true);
        try {
            const data = { ...form };
            schema.fields.forEach((f) => {
                if (f.type === 'number') data[f.name] = Number(data[f.name]) || 0;
            });
            if (editing === 'new') {
                await pb.collection(collection).create(data);
            } else {
                await pb.collection(collection).update(editing.id, data);
            }
            setEditing(null);
            load();
        } catch (e) {
            alert(`Save failed: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const remove = async (rec) => {
        if (!window.confirm(`Delete "${rec[schema.display]}"? This cannot be undone.`)) return;
        await pb.collection(collection).delete(rec.id);
        load();
    };

    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">{schema.label}</h2>
                <Button onClick={openNew}>
                    <Plus className="mr-2 h-4 w-4" /> New {schema.label.slice(0, -1)}
                </Button>
            </div>

            {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
            ) : records.length === 0 ? (
                <p className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    No records yet — create the first one.
                </p>
            ) : (
                <div className="divide-y divide-border border border-border bg-card">
                    {records.map((rec) => (
                        <div key={rec.id} className="flex items-center gap-4 p-3">
                            {'image' in rec && rec.image ? (
                                <img src={img(rec.image)} alt="" className="photo h-12 w-16 shrink-0 object-cover" />
                            ) : (
                                <div className="h-12 w-16 shrink-0 bg-secondary" />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">{rec[schema.display]}</p>
                                <p className="caption-num text-muted-foreground">{rec.updated?.slice(0, 10)}</p>
                            </div>
                            <button onClick={() => openEdit(rec)} className="flex h-9 w-9 items-center justify-center border border-border hover:bg-secondary" aria-label="Edit">
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => remove(rec)} className="flex h-9 w-9 items-center justify-center border border-border text-destructive hover:bg-secondary" aria-label="Delete">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4">
                    <div className="my-10 w-full max-w-xl border border-border bg-card p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="font-display text-xl font-bold">
                                {editing === 'new' ? `New ${schema.label.slice(0, -1)}` : `Edit ${editing[schema.display]}`}
                            </h3>
                            <button onClick={() => setEditing(null)} className="flex h-9 w-9 items-center justify-center border border-border hover:bg-secondary" aria-label="Close">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {schema.fields.map((f) => (
                                <div key={f.name}>
                                    <label className={labelCls}>
                                        {f.label} {f.required && <span className="text-destructive">*</span>}
                                    </label>
                                    {f.type === 'textarea' ? (
                                        <textarea rows={4} className={fieldCls} value={form[f.name] ?? ''} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
                                    ) : f.type === 'select' ? (
                                        <select className={fieldCls} value={form[f.name]} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}>
                                            {f.options.map((o) => (
                                                <option key={o} value={o}>{o}</option>
                                            ))}
                                        </select>
                                    ) : f.type === 'bool' ? (
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={!!form[f.name]} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.checked }))} className="h-4 w-4 accent-[#6b4423]" />
                                            Yes
                                        </label>
                                    ) : f.type === 'number' ? (
                                        <input type="number" className={fieldCls} value={form[f.name] ?? 0} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
                                    ) : f.type === 'image' ? (
                                        <ImageInput value={form[f.name]} onChange={(url) => setForm((s) => ({ ...s, [f.name]: url }))} />
                                    ) : (
                                        <input className={fieldCls} value={form[f.name] ?? ''} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button onClick={save} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ContentAdmin() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drafts, setDrafts] = useState({});
    const [savingKey, setSavingKey] = useState(null);

    const load = useCallback(() => {
        pb.collection('site_content')
            .getFullList()
            .then((recs) => {
                setRecords(recs);
                const d = {};
                recs.forEach((r) => { d[r.id] = JSON.stringify(r.value, null, 2); });
                setDrafts(d);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const save = async (rec) => {
        let parsed;
        try {
            parsed = JSON.parse(drafts[rec.id]);
        } catch {
            alert('Invalid JSON — please check the format.');
            return;
        }
        setSavingKey(rec.id);
        try {
            await pb.collection('site_content').update(rec.id, { value: parsed });
            load();
        } catch (e) {
            alert(`Save failed: ${e.message}`);
        } finally {
            setSavingKey(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    return (
        <div>
            <h2 className="font-display mb-5 text-2xl font-bold">Site content (hero, contact, about)</h2>
            <div className="space-y-6">
                {records.map((rec) => (
                    <div key={rec.id} className="border border-border bg-card p-5">
                        <p className="caption-num mb-3 text-accent">{rec.key}</p>
                        <textarea
                            rows={8}
                            className={`${fieldCls} font-mono text-xs`}
                            value={drafts[rec.id] ?? ''}
                            onChange={(e) => setDrafts((d) => ({ ...d, [rec.id]: e.target.value }))}
                        />
                        <Button className="mt-3" onClick={() => save(rec)} disabled={savingKey === rec.id}>
                            {savingKey === rec.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save {rec.key}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function InquiriesAdmin() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        pb.collection('inquiries')
            .getFullList({ sort: '-created' })
            .then(setRecords)
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const setStatus = async (rec, status) => {
        await pb.collection('inquiries').update(rec.id, { status });
        load();
    };

    const remove = async (rec) => {
        if (!window.confirm(`Delete inquiry from ${rec.name}?`)) return;
        await pb.collection('inquiries').delete(rec.id);
        load();
    };

    if (loading) {
        return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    return (
        <div>
            <h2 className="font-display mb-5 text-2xl font-bold">Inquiries ({records.length})</h2>
            {records.length === 0 ? (
                <p className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    No inquiries yet. New submissions from the website appear here automatically.
                </p>
            ) : (
                <div className="space-y-4">
                    {records.map((rec) => (
                        <div key={rec.id} className="border border-border bg-card p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="font-bold">{rec.name} <span className="font-normal text-muted-foreground">· {rec.email}</span></p>
                                    <p className="caption-num text-muted-foreground">
                                        {rec.created?.slice(0, 10)} · {rec.interest} {rec.phone ? `· ${rec.phone}` : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={rec.status || 'new'}
                                        onChange={(e) => setStatus(rec, e.target.value)}
                                        className="h-9 border border-input bg-background px-2 text-sm"
                                    >
                                        <option value="new">new</option>
                                        <option value="in-progress">in-progress</option>
                                        <option value="closed">closed</option>
                                    </select>
                                    <button onClick={() => remove(rec)} className="flex h-9 w-9 items-center justify-center border border-border text-destructive hover:bg-secondary" aria-label="Delete inquiry">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">{rec.message}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const TABS = [
    { key: 'destinations', label: 'Destinations' },
    { key: 'packages', label: 'Packages' },
    { key: 'services', label: 'Services' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'content', label: 'Site content' },
    { key: 'inquiries', label: 'Inquiries' },
];

export default function AdminDashboardPage() {
    const { user, logout } = useAuth();
    const [tab, setTab] = useState('destinations');

    const isAdmin = useMemo(() => user?.role === 'admin', [user]);

    if (!isAdmin) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
                <p className="font-display text-2xl font-bold">Administrator access required</p>
                <p className="text-sm text-muted-foreground">Your account is signed in but has no admin role.</p>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={logout}>Sign out</Button>
                    <Link to="/"><Button>Back to site</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Admin Dashboard — Altis Voyage</title>
                <meta name="description" content="Manage destinations, packages, services, gallery, testimonials, site content and inquiries." />
            </Helmet>
            <div className="min-h-screen bg-background">
                <header className="border-b border-border bg-card">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <Compass className="h-6 w-6 text-accent" />
                            <span className="font-display font-bold">Altis Voyage · Admin</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden text-sm text-muted-foreground sm:block">{user?.email}</span>
                            <Link to="/" className="text-sm font-semibold text-accent hover:underline">View site</Link>
                            <button onClick={logout} className="flex h-9 w-9 items-center justify-center border border-border hover:bg-secondary" aria-label="Sign out">
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </header>
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <div className="mb-8 flex flex-wrap gap-2">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`h-10 border px-4 text-sm font-semibold ${
                                    tab === t.key
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-card hover:bg-secondary'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    {SCHEMAS[tab] ? (
                        <CollectionAdmin key={tab} schema={SCHEMAS[tab]} collection={tab} />
                    ) : tab === 'content' ? (
                        <ContentAdmin />
                    ) : (
                        <InquiriesAdmin />
                    )}
                </div>
            </div>
        </>
    );
}
