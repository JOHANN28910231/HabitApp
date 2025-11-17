document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileForm');
  const result = document.getElementById('result');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    result.textContent = 'Enviando...';
    const id = document.getElementById('userId').value;
    const nombre = document.getElementById('nombre').value;
    const fotoInput = document.getElementById('foto');

    const fd = new FormData();
    if (nombre) fd.append('nombre_completo', nombre);
    if (fotoInput && fotoInput.files && fotoInput.files.length > 0) fd.append('foto', fotoInput.files[0]);

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        credentials: 'same-origin',
        body: fd
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        result.textContent = `Error ${res.status}: ${JSON.stringify(data)}`;
        return;
      }
      result.textContent = JSON.stringify(data, null, 2);
      alert('Perfil actualizado');
    } catch (err) {
      console.error(err);
      result.textContent = 'Error de red: ' + err.message;
    }
  });
});
