document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email').value || '').trim().toLowerCase();
    const password = document.getElementById('password').value || '';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // <- importante para que la cookie de sesión se guarde
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error de autenticación');
        return;
      }
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      alert('Error de red');
    }
  });
  async function submitLogin(body) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin', // <- importante para cookies
      body: JSON.stringify(body)
    });
    return res;
  }
});