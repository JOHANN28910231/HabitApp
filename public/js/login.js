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
      // Guardar información útil en sessionStorage para uso inmediato en el UI
      try {
        const user = data.user || data;
        if (user) {
          // id del usuario
          if (user.id) sessionStorage.setItem('user_id', String(user.id));
          if (user.id_usuario) sessionStorage.setItem('user_id', String(user.id_usuario));
          // nombre completo
          if (user.nombre_completo) sessionStorage.setItem('user_name', user.nombre_completo);
          // roles (guardar como JSON)
          if (user.roles) sessionStorage.setItem('user_roles', JSON.stringify(user.roles));
          // si es anfitrión, guardar host_id para scripts que lo esperan
          const roles = user.roles || [];
          if (Array.isArray(roles) && roles.some(r => String(r).toLowerCase().includes('anfitri'))) {
            // usar id_usuario o id
            const hostId = user.id_usuario || user.id;
            if (hostId) sessionStorage.setItem('host_id', String(hostId));
          }
        }
      } catch (e) { console.warn('No se pudo guardar sessionStorage tras login', e); }

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