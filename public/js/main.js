// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const destinoInput = document.getElementById('destino');
    const llegadaInput = document.getElementById('llegada');
    const salidaInput = document.getElementById('salida');
    const huespedesInput = document.getElementById('huespedes');
    const searchForm = document.getElementById('searchForm');
    const suggestionsBox = document.getElementById('destinoSuggestions');
    const resultsContainer = document.getElementById('searchResults');

    if (!searchForm) return;

    // ============================
    // 1) Fechas mínimas y reglas
    // ============================
    const todayISO = new Date().toISOString().slice(0, 10);
    if (llegadaInput) llegadaInput.min = todayISO;
    if (salidaInput) salidaInput.min = todayISO;

    llegadaInput?.addEventListener('change', () => {
        if (!llegadaInput.value) return;
        const d = new Date(llegadaInput.value);
        d.setDate(d.getDate() + 1); // salida mínimo día siguiente
        const minSalida = d.toISOString().slice(0, 10);
        salidaInput.min = minSalida;
        if (salidaInput.value && salidaInput.value < minSalida) {
            salidaInput.value = minSalida;
        }
    });

    // =====================================
    // 2) Autocomplete de destinos
    // =====================================
    let destTimeout = null;

    function clearSuggestions() {
        if (suggestionsBox) {
            suggestionsBox.innerHTML = '';
        }
    }

    destinoInput?.addEventListener('input', () => {
        const q = destinoInput.value.trim();
        clearSuggestions();
        if (q.length < 2) return;

        if (destTimeout) clearTimeout(destTimeout);
        destTimeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/availability/destinos/sugerencias?q=${encodeURIComponent(q)}`, {
                    credentials: 'same-origin',
                });
                if (!res.ok) return;
                const data = await res.json();
                renderSuggestions(data || []);
            } catch (err) {
                console.warn('Error obteniendo sugerencias', err);
            }
        }, 250); // pequeño debounce
    });

    function renderSuggestions(items) {
        clearSuggestions();
        if (!items.length) return;
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'list-group-item list-group-item-action';
            btn.textContent = item.etiqueta || `${item.municipio}, ${item.estado}`;
            btn.addEventListener('click', () => {
                destinoInput.value = btn.textContent;
                clearSuggestions();
            });
            suggestionsBox.appendChild(btn);
        });
    }

    document.addEventListener('click', (e) => {
        if (!suggestionsBox.contains(e.target) && e.target !== destinoInput) {
            clearSuggestions();
        }
    });

    // =====================================
    // 3) Envío del formulario de búsqueda
    // =====================================
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const destino = destinoInput.value.trim();
        const from = llegadaInput.value;
        const to = salidaInput.value;
        const guests = parseInt(huespedesInput.value || '1', 10);

        // Validación básica en front (además del backend)
        if (!from || !to) {
            alert('Selecciona fechas de llegada y salida');
            return;
        }
        const dFrom = new Date(from);
        const dTo = new Date(to);
        const diffDays = (dTo - dFrom) / (1000 * 60 * 60 * 24);
        if (isNaN(diffDays) || diffDays < 1) {
            alert('La salida debe ser al menos un día después de la llegada (mínimo 1 noche).');
            return;
        }
        if (guests < 1) {
            alert('El número de huéspedes debe ser al menos 1.');
            return;
        }

        try {
            const params = new URLSearchParams({
                destino,
                from,
                to,
                guests: String(guests),
            });

            const res = await fetch(`/api/availability/search?${params.toString()}`, {
                credentials: 'same-origin',
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Error en la búsqueda');
                return;
            }

            renderResults(data.resultados || []);
        } catch (err) {
            console.error(err);
            alert('Error de red al buscar alojamientos');
        }
    });

    // =====================================
    // 4) Pintar resultados
    // =====================================
    function renderResults(list) {
        if (!resultsContainer) return;
        if (!list.length) {
            resultsContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning">No se encontraron alojamientos disponibles para esos criterios.</div>
        </div>`;
            return;
        }

        resultsContainer.innerHTML = '';
        list.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-4';

            const precioNoche = item.precio_por_noche
                ? `$${Number(item.precio_por_noche).toLocaleString()} / noche`
                : 'Consulta precios';

            col.innerHTML = `
        <div class="card rounded-4 shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title mb-1">${item.nombre_propiedad}</h5>
            <p class="mb-1 text-muted small">${item.municipio}, ${item.estado}</p>
            <p class="mb-2 small">${item.habitacion_descripcion || 'Habitación disponible'}</p>
            <p class="fw-semibold mb-2">${precioNoche}</p>
            <p class="text-muted small mb-3">Capacidad: ${item.capacidad_maxima} huésped(es)</p>
            <div class="mt-auto">
              <a href="#" class="btn btn-sm btn-accent w-100" disabled>
                Ver detalles (pendiente)
              </a>
            </div>
          </div>
        </div>
      `;
            resultsContainer.appendChild(col);
        });
    }
});

