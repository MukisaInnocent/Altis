// Staff sign-in page. Sessions are checked and created by the API; this only drives the form.
(() => {
  const form = document.getElementById('admin-login-form');
  const alertBox = document.getElementById('lg-alert');
  const submit = form.querySelector('.lg-submit');
  const label = form.querySelector('.lg-submit-label');
  const dashboard = '/admin/index.html';

  function showAlert(message, kind = 'error') {
    alertBox.hidden = false;
    alertBox.className = `lg-alert is-${kind}`;
    alertBox.textContent = message;
  }

  // Theme toggle (shares the choice made on the public site)
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => button.addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('altis-theme', next); } catch { /* the choice still applies for this visit */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#f6f3ec' : '#060f1e');
  }));

  const eye = form.querySelector('.lg-eye');
  eye.addEventListener('click', () => {
    const input = form.elements.password;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(show));
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    input.focus();
  });

  if (new URLSearchParams(location.search).get('expired')) showAlert('Your session has ended. Please sign in again.', 'info');

  // Already signed in? Go straight to the dashboard.
  fetch('/api/admin/session?soft=1', { credentials: 'same-origin' })
    .then((res) => res.json())
    .then((data) => { if (data && data.user) location.replace(dashboard); })
    .catch(() => {});

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    alertBox.hidden = true;
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    if (!email || !password) {
      showAlert('Enter your email address and password.');
      (email ? form.elements.password : form.elements.email).focus();
      return;
    }

    submit.disabled = true;
    submit.classList.add('is-loading');
    label.textContent = 'Signing in…';
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        label.textContent = 'Welcome back';
        location.replace(dashboard);
        return;
      }
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) showAlert('That email or password is not correct.');
      else if (res.status === 429) showAlert('Too many attempts. Please wait a few minutes and try again.');
      else showAlert(payload.error || 'We could not sign you in right now. Please try again.');
      form.elements.password.select();
    } catch {
      showAlert('Could not reach the server. Check your connection and try again.');
    }
    submit.disabled = false;
    submit.classList.remove('is-loading');
    label.textContent = 'Sign in';
  });
})();
