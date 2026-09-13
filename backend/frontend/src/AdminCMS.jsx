import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Check, FileText, Image, LayoutDashboard, LogOut, Mail, MapPin, PackagePlus, Plus, Save, Settings, Sparkles, Trash2, Upload } from 'lucide-react'
import './AdminCMS.css'
import './AdminMediaFix.css'
import './AdminHeroSlideshow.css'

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:4000` : '')
const settingFields = [
  ['company_name', 'Company name'], ['primary_phone', 'Primary phone'], ['secondary_phone', 'Secondary phone'], ['whatsapp_number', 'WhatsApp number'], ['info_email', 'General email'], ['bookings_email', 'Bookings email'], ['address', 'Business address', true], ['footer_tagline', 'Footer message'], ['footer_registration_number', 'Footer registration number'], ['footer_developer_credit', 'Footer developer credit'], ['default_cta_title', 'Default call-to-action heading'], ['default_cta_text', 'Default call-to-action text', true], ['default_cta_label', 'Default call-to-action button'], ['home_seo_title', 'Homepage SEO title'], ['home_seo_description', 'Homepage SEO description', true]
]
const blankPost = { slug: '', title: '', excerpt: '', body: '', image_path: '', seo_title: '', seo_description: '', status: 'draft' }
const blankCatalog = { item_type: 'service', slug: '', title: '', summary: '', country: '', duration: '', image_path: '', seo_title: '', seo_description: '', status: 'draft', sort_order: 0 }
const pagePaths = { Home: '/', About: '/about', Services: '/services', Contact: '/contact', Resources: '/travel-resources', Honeymoon: '/honeymoon', 'Corporate travel': '/corporate-travel', 'Airport transfers': '/airport-transfers', 'Travel insurance': '/travel-insurance', 'Family reunification': '/family-reunification', 'Why choose us': '/why-choose-us', Gallery: '/gallery', FAQ: '/faq', 'Privacy policy': '/privacy-policy', 'Terms and conditions': '/terms-and-conditions' }
const pagePath = (pageName) => pagePaths[pageName] || '/'
const sectionHelp = (sectionKey) => sectionKey === 'faq-items' ? 'Enter one question and answer per line, separated by ||.' : sectionKey === 'home-stats' ? 'Enter one figure per line in Main content as: value || label. Leave it blank to hide this optional section.' : sectionKey === 'home-testimonials' ? 'Enter one verified review per line in Main content as: quote || name || location or trip || rating. Leave it blank to hide this optional section.' : 'This updates the existing public section without changing its layout.'

async function api(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: token ? `Bearer ${token}` : undefined, ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  })
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `Request failed (${response.status}).`)
  return response.json()
}

function Field({ label, value = '', onChange, multiline = false, type = 'text', help = '' }) {
  const Control = multiline ? 'textarea' : 'input'
  return <label className={`cms-field${multiline ? ' cms-field-wide' : ''}`}><span>{label}</span><Control type={type} rows={multiline ? 5 : undefined} value={value} onChange={(event) => onChange(event.target.value)} />{help && <small>{help}</small>}</label>
}

function SelectField({ label, value, onChange, children }) {
  return <label className="cms-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>
}

function ImagePicker({ value, onChange, images, label = 'Image from uploaded media' }) {
  const options = Object.values(images || {}).flat().filter((item) => item.active).map((item) => ({ value: item.url, label: `${item.category} / ${item.filename}` }))
  return <label className="cms-field"><span>{label}</span><select value={value || ''} onChange={(event) => onChange(event.target.value)}><option value="">No image selected</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>External image links are not accepted.</small></label>
}

function HeroImagePicker({ value, onChange, images }) {
  const options = Object.values(images || {}).flat().filter((item) => item.active).map((item) => ({ value: item.url, label: `${item.category} / ${item.filename}` }))
  const values = Array.isArray(value) ? value : []
  const addImage = (next) => { if (next && !values.includes(next)) onChange([...values, next]) }
  const replaceImage = (index, next) => onChange(values.map((value, itemIndex) => itemIndex === index ? next : value).filter((item, itemIndex, list) => item && list.indexOf(item) === itemIndex))
  const moveImage = (index, direction) => { const next = [...values]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; onChange(next) }
  return <div className="cms-field cms-field-wide hero-image-picker"><span>Hero background slideshow</span><small>Add uploaded images in the order they should appear. They change every 5 seconds with a smooth fade.</small>{values.length > 0 && <div className="hero-image-list">{values.map((value, index) => <div className="hero-image-row" key={`${value}-${index}`}><span>{index + 1}</span><select value={value} onChange={(event) => replaceImage(index, event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}>Move up</button><button type="button" onClick={() => moveImage(index, 1)} disabled={index === values.length - 1}>Move down</button><button type="button" className="remove" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}</div>}<select className="hero-image-add" value="" onChange={(event) => addImage(event.target.value)}><option value="">Add a background image…</option>{options.filter((option) => !values.includes(option.value)).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{values.length === 0 && <small>The fallback image below is used until you add slideshow images.</small>}</div>
}

function TextEditor({ value, onChange, title, description, save, cancel, children }) {
  return <section className="cms-card cms-editor"><div className="cms-editor-head"><div><h2>{title}</h2><p>{description}</p></div><div><button className="cms-button quiet" onClick={cancel}>Cancel</button><button className="cms-button primary" onClick={save}><Save size={16} />Save</button></div></div>{children}</section>
}

export default function AdminCMS() {
  const [token, setToken] = useState(localStorage.getItem('altis_token'))
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState({ stats: {}, settings: {}, sections: [], catalog: [], posts: [], images: { images: {}, categories: [] }, inquiries: [] })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingSection, setEditingSection] = useState(null)
  const [editingCatalog, setEditingCatalog] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [catalogType, setCatalogType] = useState('service')

  const load = async () => {
    if (!token) return
    try {
      const [stats, settings, sections, catalog, posts, images, inquiries] = await Promise.all([
        api('/api/admin/stats', token), api('/api/admin/settings', token), api('/api/admin/sections', token), api('/api/admin/catalog', token), api('/api/admin/posts', token), api('/api/admin/images', token), api('/api/admin/inquiries', token)
      ])
      setData({ stats, settings, sections, catalog, posts, images, inquiries })
    } catch (loadError) {
      localStorage.removeItem('altis_token')
      setToken(null)
      setError(loadError.message)
    }
  }
  useEffect(() => { load() }, [token])
  const imageGroups = data.images.images || {}
  const announce = (message) => { setError(''); setNotice(message); window.setTimeout(() => setNotice(''), 3500) }
  const login = async (event) => {
    event.preventDefault(); setError('')
    try { const result = await api('/api/admin/login', '', { method: 'POST', body: JSON.stringify(credentials) }); localStorage.setItem('altis_token', result.token); setToken(result.token) } catch (loginError) { setError(loginError.message) }
  }
  const saveSettings = async () => {
    try { await api('/api/admin/settings', token, { method: 'PUT', body: JSON.stringify({ settings: data.settings }) }); announce('Site settings saved.') } catch (saveError) { setError(saveError.message) }
  }
  const saveSection = async () => {
    try { await api(`/api/admin/sections/${editingSection.id}`, token, { method: 'PUT', body: JSON.stringify(editingSection) }); setEditingSection(null); await load(); announce('Section saved.') } catch (saveError) { setError(saveError.message) }
  }
  const saveCatalog = async () => {
    try { const isNew = !editingCatalog.id; await api(isNew ? '/api/admin/catalog' : `/api/admin/catalog/${editingCatalog.id}`, token, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(editingCatalog) }); setEditingCatalog(null); await load(); announce(isNew ? 'New item created.' : 'Catalog item saved.') } catch (saveError) { setError(saveError.message) }
  }
  const savePost = async () => {
    try { const isNew = !editingPost.id; await api(isNew ? '/api/admin/posts' : `/api/admin/posts/${editingPost.id}`, token, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(editingPost) }); setEditingPost(null); await load(); announce(editingPost.status === 'published' ? 'Post published.' : 'Post draft saved.') } catch (saveError) { setError(saveError.message) }
  }
  const uploadImage = async (category, file) => {
    if (!file) return
    const body = new FormData(); body.append('image', file)
    try { await api(`/api/admin/images/${encodeURIComponent(category)}`, token, { method: 'POST', body }); await load(); announce('Image uploaded.') } catch (uploadError) { setError(uploadError.message) }
  }
  const updateImage = async (image) => {
    try { await api(`/api/admin/images/${image.id}`, token, { method: 'PATCH', body: JSON.stringify({ caption: image.caption || '' }) }); await load(); announce('Image alt text saved.') } catch (updateError) { setError(updateError.message) }
  }
  const imageAction = async (id, action) => {
    if (action === 'delete' && !window.confirm('Delete this uploaded image permanently?')) return
    try { await api(`/api/admin/images/${id}${action === 'toggle' ? '/toggle' : ''}`, token, { method: action === 'toggle' ? 'PATCH' : 'DELETE' }); await load(); announce(action === 'toggle' ? 'Image visibility updated.' : 'Image deleted.') } catch (actionError) { setError(actionError.message) }
  }
  const markRead = async (id) => { try { await api(`/api/admin/inquiries/${id}/read`, token, { method: 'PATCH' }); await load() } catch (readError) { setError(readError.message) } }

  if (!token) return <div className="admin-login"><div className="login-art"><p className="eyebrow">Altis Voyage / private office</p><h1>Keep the<br /><em>journey moving.</em></h1></div><form onSubmit={login}><Link className="brand" to="/"><i>A</i><span>Altis <b>Voyage</b></span></Link><h2>Sign in</h2><p>Manage the images, content and enquiries behind the journeys.</p><label>Username<input required value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} /></label><label>Password<input required type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></label><button className="button" type="submit">Enter dashboard</button>{error && <div className="error">{error}</div>}</form></div>

  const tabs = [['overview', LayoutDashboard, 'Overview'], ['settings', Settings, 'Site settings'], ['sections', FileText, 'Page sections'], ['catalog', PackagePlus, 'Services & travel'], ['posts', BookOpen, 'Travel posts'], ['media', Image, 'Media library'], ['inquiries', Mail, 'Enquiries']]
  const visibleCatalog = data.catalog.filter((item) => item.item_type === catalogType)
  return <div className="cms-shell"><aside className="cms-sidebar"><Link className="cms-brand" to="/"><img src="/logo.jpg" alt="Altis Voyage" /></Link><small>CONTENT STUDIO</small>{tabs.map(([id, Icon, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={17} />{label}</button>)}<button className="cms-logout" onClick={() => { localStorage.removeItem('altis_token'); setToken(null) }}><LogOut size={17} />Sign out</button></aside><main className="cms-main"><header className="cms-header"><div><p className="eyebrow">Altis Voyage Travel Services Ltd</p><h1>{tabs.find(([id]) => id === tab)?.[2]}</h1></div><a className="cms-preview" href="/" target="_blank" rel="noreferrer">View live site</a></header>{notice && <p className="cms-notice"><Check size={16} />{notice}</p>}{error && <p className="cms-error">{error}</p>}
    {tab === 'overview' && <section><div className="cms-stats">{[['Enquiries', data.stats.totalInquiries], ['Unread', data.stats.unreadInquiries], ['Published sections', data.stats.totalSections], ['Posts', data.stats.totalPosts], ['Post drafts', data.stats.draftPosts]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value ?? '—'}</strong></article>)}</div><div className="cms-card cms-intro"><Sparkles /><div><h2>Complete content control, safely.</h2><p>Edit approved fields and choose only images already uploaded to Altis Voyage. Save drafts before publishing a post or catalog item.</p></div></div></section>}
    {tab === 'settings' && <section className="cms-card"><div className="cms-toolbar"><div><h2>Business information & SEO</h2><p>Contact information and homepage metadata used by the public site.</p></div><button className="cms-button primary" onClick={saveSettings}><Save size={16} />Save settings</button></div><div className="cms-fields">{settingFields.map(([key, label, multiline]) => <Field key={key} label={label} value={data.settings[key] || ''} multiline={multiline} onChange={(value) => setData({ ...data, settings: { ...data.settings, [key]: value } })} />)}</div></section>}
    {tab === 'sections' && <section>{editingSection ? <SectionEditor value={editingSection} setValue={setEditingSection} images={imageGroups} save={saveSection} cancel={() => setEditingSection(null)} /> : Object.entries(data.sections.reduce((groups, section) => ({ ...groups, [section.page_name]: [...(groups[section.page_name] || []), section] }), {})).map(([pageName, sections]) => <section className="cms-section-group" key={pageName}><div className="cms-toolbar"><h2>{pageName}</h2><a className="cms-preview" href={pagePath(pageName)} target="_blank" rel="noreferrer">View live page</a></div><div className="cms-list">{sections.map((section) => <button className="cms-list-row" key={section.id} onClick={() => setEditingSection(section)}><strong>{section.section_name}</strong><span>{section.status}</span><small>{section.title}</small></button>)}</div></section>)}</section>}
    {tab === 'catalog' && <section>{editingCatalog ? <CatalogEditor value={editingCatalog} setValue={setEditingCatalog} images={imageGroups} save={saveCatalog} cancel={() => setEditingCatalog(null)} /> : <><div className="cms-toolbar"><div className="cms-filter">{['service', 'destination', 'tour'].map((type) => <button className={catalogType === type ? 'selected' : ''} key={type} onClick={() => setCatalogType(type)}>{type}s</button>)}</div><button className="cms-button primary" onClick={() => setEditingCatalog({ ...blankCatalog, item_type: catalogType, sort_order: visibleCatalog.length + 1 })}><Plus size={16} />Add {catalogType}</button></div><div className="cms-list">{visibleCatalog.map((item) => <button className="cms-list-row" key={item.id} onClick={() => setEditingCatalog(item)}><strong>{item.title}</strong><span>{item.slug}</span><span>{item.status}</span><small>Order {item.sort_order}</small></button>)}</div></>}</section>}
    {tab === 'posts' && <section>{editingPost ? <PostEditor value={editingPost} setValue={setEditingPost} images={imageGroups} save={savePost} cancel={() => setEditingPost(null)} /> : <><div className="cms-toolbar"><p>Create useful travel content. Drafts remain private until you publish them.</p><button className="cms-button primary" onClick={() => setEditingPost(blankPost)}><Plus size={16} />New post</button></div><div className="cms-list">{data.posts.length ? data.posts.map((post) => <button className="cms-list-row" key={post.id} onClick={() => setEditingPost(post)}><strong>{post.title}</strong><span>{post.slug}</span><span>{post.status}</span><small>{post.updated_at}</small></button>) : <div className="cms-card">No posts yet.</div>}</div></>}</section>}
    {tab === 'media' && <section className="cms-card"><div className="cms-toolbar"><div><h2>Uploaded media</h2><p>Upload, manage visibility and enter image alt text. All content images are selected from this library.</p></div></div>{Object.entries(imageGroups).map(([category, images]) => <MediaCategory key={category} category={category} images={images} uploadImage={uploadImage} updateImage={updateImage} imageAction={imageAction} />)}</section>}
    {tab === 'inquiries' && <section className="cms-list">{data.inquiries.length ? data.inquiries.map((item) => <article className="cms-inquiry" key={item.id}><div><strong>{item.name}</strong><span>{new Date(item.created_at).toLocaleDateString()}</span></div><p>{item.message}</p><small>{item.email || 'No email'} · {item.phone || 'No phone'} · {item.destination || 'General enquiry'}</small>{(item.service || item.whatsapp || item.travel_date || item.return_date || item.travellers) && <small className="cms-trip-details">{item.service && <>Service: {item.service}</>}{item.whatsapp && <> · WhatsApp: {item.whatsapp}</>}{(item.travel_date || item.return_date || item.travellers) && <> · Travel: {item.travel_date || 'Flexible'}{item.return_date ? ` to ${item.return_date}` : ''}{item.travellers ? ` · ${item.travellers} traveller${Number(item.travellers) === 1 ? '' : 's'}` : ''}</>}</small>}{!item.read && <button className="cms-button quiet" onClick={() => markRead(item.id)}>Mark as read</button>}</article>) : <div className="cms-card">No enquiries yet.</div>}</section>}
  </main></div>
}

function SectionEditor({ value, setValue, images, save, cancel }) { const update = (key, next) => setValue({ ...value, [key]: next }); const hasHero = value.section_key === 'home-hero' || value.section_key.endsWith('-hero') || value.section_key.endsWith('-page'); return <TextEditor title={`${value.page_name}: ${value.section_name}`} description={sectionHelp(value.section_key)} save={save} cancel={cancel}><p><a className="cms-preview" href={pagePath(value.page_name)} target="_blank" rel="noreferrer">View this page on the live site</a></p><div className="cms-fields"><Field label="Eyebrow" value={value.eyebrow} onChange={(next) => update('eyebrow', next)} /><SelectField label="Publication status" value={value.status} onChange={(next) => update('status', next)}><option value="published">Published</option><option value="draft">Draft</option></SelectField><Field label="Heading" value={value.title} onChange={(next) => update('title', next)} />{hasHero && <HeroImagePicker value={value.hero_images} onChange={(next) => update('hero_images', next)} images={images} />}<ImagePicker value={value.image_path} onChange={(next) => update('image_path', next)} images={images} label={hasHero ? 'Fallback hero image' : 'Image from uploaded media'} /><Field label="Summary" value={value.summary} multiline onChange={(next) => update('summary', next)} /><Field label="Main content" value={value.body} multiline onChange={(next) => update('body', next)} /><Field label="SEO title" value={value.seo_title} onChange={(next) => update('seo_title', next)} /><Field label="SEO description" value={value.seo_description} multiline onChange={(next) => update('seo_description', next)} /></div></TextEditor> }
function CatalogEditor({ value, setValue, images, save, cancel }) { const update = (key, next) => setValue({ ...value, [key]: next }); return <TextEditor title={value.id ? `Edit ${value.item_type}` : `New ${value.item_type}`} description="Changes appear in the current services, destinations and tour layouts." save={save} cancel={cancel}><div className="cms-fields"><SelectField label="Type" value={value.item_type} onChange={(next) => update('item_type', next)}><option value="service">Service</option><option value="destination">Destination</option><option value="tour">Tour</option></SelectField><SelectField label="Publication status" value={value.status} onChange={(next) => update('status', next)}><option value="published">Published</option><option value="draft">Draft</option></SelectField><Field label="Title" value={value.title} onChange={(next) => update('title', next)} /><Field label="URL slug" value={value.slug} onChange={(next) => update('slug', next)} help="Lowercase words separated by hyphens." /><Field label={value.item_type === 'destination' ? 'Country' : 'Location'} value={value.country} onChange={(next) => update('country', next)} /><Field label="Duration (tours only)" value={value.duration} onChange={(next) => update('duration', next)} /><ImagePicker value={value.image_path} onChange={(next) => update('image_path', next)} images={images} /><Field label="Display order" type="number" value={String(value.sort_order || 0)} onChange={(next) => update('sort_order', next)} /><Field label="Description" value={value.summary} multiline onChange={(next) => update('summary', next)} /><Field label="SEO title" value={value.seo_title} onChange={(next) => update('seo_title', next)} /><Field label="SEO description" value={value.seo_description} multiline onChange={(next) => update('seo_description', next)} /></div></TextEditor> }
function PostEditor({ value, setValue, images, save, cancel }) { const update = (key, next) => setValue({ ...value, [key]: next }); return <TextEditor title={value.id ? 'Edit travel post' : 'New travel post'} description="Only published posts appear in the Travel Resources section." save={save} cancel={cancel}><div className="cms-fields"><Field label="Post title" value={value.title} onChange={(next) => update('title', next)} /><Field label="URL slug" value={value.slug} onChange={(next) => update('slug', next)} help="Lowercase words separated by hyphens." /><SelectField label="Publication status" value={value.status} onChange={(next) => update('status', next)}><option value="draft">Draft</option><option value="published">Published</option></SelectField><ImagePicker value={value.image_path} onChange={(next) => update('image_path', next)} images={images} /><Field label="Short excerpt" value={value.excerpt} multiline onChange={(next) => update('excerpt', next)} /><Field label="Post body" value={value.body} multiline onChange={(next) => update('body', next)} /><Field label="SEO title" value={value.seo_title} onChange={(next) => update('seo_title', next)} /><Field label="SEO description" value={value.seo_description} multiline onChange={(next) => update('seo_description', next)} /></div></TextEditor> }
function MediaCategory({ category, images, uploadImage, updateImage, imageAction }) { const [expanded, setExpanded] = useState(false); const initialCount = 6; const visibleImages = expanded ? images : images.slice(0, initialCount); const hasMore = images.length > initialCount; return <section className="cms-media-section"><div className="cms-media-head"><h3>{category}</h3><label className="cms-button upload"><Upload size={15} />Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" onChange={(event) => uploadImage(category, event.target.files?.[0])} /></label></div><div className="cms-media-grid">{visibleImages.map((image) => <MediaCard key={image.id} image={image} update={updateImage} action={imageAction} />)}</div>{hasMore && <button className="cms-show-more" type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? 'Show less' : `Show ${images.length - initialCount} more`}</button>}</section> }
function MediaCard({ image, update, action }) { const [caption, setCaption] = useState(image.caption || ''); const usage = image.usage || []; const liveUsage = usage.filter((item) => item.status === 'published'); const usageLabel = usage.map((item) => `${item.label} (${item.status})`).join(', '); return <article className="cms-media-card"><img src={`${API}${image.url}`} alt={caption || image.filename} /><span>{image.active ? 'Visible' : 'Hidden'}</span><strong>{image.filename}</strong><small className={liveUsage.length ? 'cms-media-usage live' : usage.length ? 'cms-media-usage' : 'cms-media-usage'} title={usageLabel}>{liveUsage.length ? `Used on live site: ${liveUsage.length}` : usage.length ? `Used in draft: ${usage.length}` : 'Not used by content'}</small><label>Alt text<input value={caption} onChange={(event) => setCaption(event.target.value)} onBlur={() => caption !== (image.caption || '') && update({ ...image, caption })} /></label><div><button onClick={() => action(image.id, 'toggle')}>{image.active ? 'Hide' : 'Show'}</button><button onClick={() => action(image.id, 'delete')}><Trash2 size={14} />Delete</button></div></article> }
