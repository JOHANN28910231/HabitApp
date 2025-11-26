// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const destinoInput       = document.getElementById('destino');
    const llegadaInput       = document.getElementById('llegada');
    const salidaInput        = document.getElementById('salida');
    const huespedesInput     = document.getElementById('huespedes');
    const searchForm         = document.getElementById('searchForm');
    const suggestionsBox     = document.getElementById('destinoSuggestions');
    const resultsContainer   = document.getElementById('searchResults');
    const resultsSection     = document.getElementById('resultsSection');

    // Elementos del modal de reservación
    const resModalEl         = document.getElementById('reservationModal');
    const resPropName        = document.getElementById('resPropName');
    const resLocation        = document.getElementById('resLocation');
    const resRoomDesc        = document.getElementById('resRoomDesc');
    const resDates           = document.getElementById('resDates');
    const resGuests          = document.getElementById('resGuests');
    const resTotal           = document.getElementById('resTotal');
    const resTipoAlojamiento = document.getElementById('resTipoAlojamiento');
    const resError           = document.getElementById('resError');
    const resConfirmBtn      = document.getElementById('resConfirmBtn');

    if (!searchForm) return;

    let lastSearch = { destino: '', from: '', to: '', guests: 1 };
    let currentRoom = null;
    let resModalInstance = null;

    // Instancia del modal de Bootstrap (si existe)
    if (resModalEl && window.bootstrap && window.bootstrap.Modal) {
        resModalInstance = new bootstrap.Modal(resModalEl);
    }

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
        if (suggestionsBox && !suggestionsBox.contains(e.target) && e.target !== destinoInput) {
            clearSuggestions();
        }
    });

    // =====================================
    // 3) Envío del formulario de búsqueda
    // =====================================
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const destino = destinoInput.value.trim();
        const from    = llegadaInput.value;
        const to      = salidaInput.value;
        const guests  = parseInt(huespedesInput.value || '1', 10);

        // Validación básica en front (además del backend)
        if (!from || !to) {
            alert('Selecciona fechas de llegada y salida');
            return;
        }
        const dFrom = new Date(from);
        const dTo   = new Date(to);
        const diffDays = (dTo - dFrom) / (1000 * 60 * 60 * 24);
        if (isNaN(diffDays) || diffDays < 1) {
            alert('La salida debe ser al menos un día después de la llegada (mínimo 1 noche).');
            return;
        }
        if (guests < 1) {
            alert('El número de huéspedes debe ser al menos 1.');
            return;
        }

        // Guardamos la búsqueda actual para usarla al reservar
        lastSearch = { destino, from, to, guests };

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
    // 4) Abrir modal de reservación
    // =====================================
    function openReservationModal(room) {
        if (!resModalInstance) {
            alert('No se pudo abrir el modal de reservación.');
            return;
        }

        currentRoom = room;

        if (resError) {
            resError.textContent = '';
            resError.classList.add('d-none');
        }

        if (resPropName)  resPropName.textContent  = room.nombre_propiedad || 'Propiedad';
        if (resLocation)  resLocation.textContent  = `${room.municipio || ''}, ${room.estado || ''}`;
        if (resRoomDesc)  resRoomDesc.textContent  = room.habitacion_descripcion || room.descripcion || 'Habitación disponible';

        const { from, to, guests } = lastSearch;
        if (resDates)   resDates.textContent  = (from && to) ? `${from} → ${to}` : '—';
        if (resGuests)  resGuests.textContent = guests || 1;

        let totalText = 'Se calculará al confirmar';
        if (room.precio_por_noche && from && to) {
            const dFrom = new Date(from);
            const dTo   = new Date(to);
            const diff  = (dTo - dFrom) / (1000 * 60 * 60 * 24);
            if (!isNaN(diff) && diff > 0) {
                const total = Number(room.precio_por_noche) * diff;
                totalText = `$${total.toLocaleString()} MXN (aprox.)`;
            }
        }
        if (resTotal) resTotal.textContent = totalText;

        if (resTipoAlojamiento) resTipoAlojamiento.value = 'noche';

        resModalInstance.show();
    }

    // =====================================
    // 5) Confirmar reservación (POST /api/reservations) + REDIRECCIÓN A PAGO
    // =====================================
    if (resConfirmBtn) {
        resConfirmBtn.addEventListener('click', async () => {
            if (!currentRoom) return;

            const { from, to } = lastSearch;
            if (!from || !to) {
                if (resError) {
                    resError.textContent = 'Faltan las fechas de la reservación.';
                    resError.classList.remove('d-none');
                }
                return;
            }

            const tipo = resTipoAlojamiento ? resTipoAlojamiento.value : 'noche';

            try {
                const body = {
                    id_habitacion: currentRoom.id_habitacion,
                    fecha_inicio : from,
                    fecha_salida : to,
                    tipo_alojamiento: tipo,
                };

                const res = await fetch('/api/reservations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(body),
                });

                const data = await res.json().catch(() => ({}));

                // --- LÓGICA 401 (ya iniciada sesión o no) ---
                if (res.status === 401) {
                    try {
                        // Verificamos si REALMENTE no hay sesión
                        const meRes = await fetch('/api/auth/me', {
                            credentials: 'same-origin',
                        });

                        if (meRes.ok) {
                            // Hay sesión, pero el backend bloqueó la reserva por otra razón
                            if (resError) {
                                resError.textContent = data.error || 'No tienes permiso para realizar esta reservación.';
                                resError.classList.remove('d-none');
                            }
                            return;
                        }
                    } catch (e) {
                        console.warn('Error verificando sesión en /api/auth/me', e);
                    }

                    // Aquí SÍ asumimos que no hay sesión y redirigimos al login
                    if (resError) {
                        resError.textContent = 'Debes iniciar sesión para reservar. Te redirigiremos al inicio de sesión.';
                        resError.classList.remove('d-none');
                    }
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 1500);
                    return;
                }
                // --- FIN LÓGICA 401 ---

                if (!res.ok) {
                    if (resError) {
                        resError.textContent = data.error || 'No se pudo crear la reservación.';
                        resError.classList.remove('d-none');
                    }
                    return;
                }

                // Aquí ya tenemos la reserva creada correctamente
                const reservaId = data.id_reservacion;
                const monto     = data.monto_total;

                if (!reservaId || !monto) {
                    if (resError) {
                        resError.textContent = 'La reservación se creó, pero faltan datos para continuar con el pago.';
                        resError.classList.remove('d-none');
                    }
                    return;
                }

                // Cerrar el modal
                if (resModalInstance) {
                    resModalInstance.hide();
                }
                currentRoom = null;

                // Redirigir al checkout de pago con los datos necesarios
                window.location.href = `/payment/checkout.html?rid=${encodeURIComponent(
                    reservaId
                )}&amount=${encodeURIComponent(monto)}`;
            } catch (err) {
                console.error(err);
                if (resError) {
                    resError.textContent = 'Error de red al crear la reservación.';
                    resError.classList.remove('d-none');
                }
            }
        });
    }

    // =====================================
    // 6) Pintar resultados
    // =====================================
    function renderResults(list) {
        if (!resultsContainer) return;

        // Mostrar la sección de resultados cuando ya hubo una búsqueda
        if (resultsSection) {
            resultsSection.classList.remove('d-none');
        }

        if (!list.length) {
            resultsContainer.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning">
            No se encontraron alojamientos disponibles para esos criterios.
          </div>
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
              <button 
                type="button"
                class="btn btn-sm btn-accent w-100 btn-reservar"
                data-room-id="${item.id_habitacion}">
                Ver detalles y reservar
              </button>
            </div>
          </div>
        </div>
      `;
            resultsContainer.appendChild(col);
        });

        // Conectar los botones "Ver detalles y reservar"
        const buttons = resultsContainer.querySelectorAll('.btn-reservar');
        buttons.forEach(btn => {
            const roomId = Number(btn.dataset.roomId);
            const room = list.find(r => Number(r.id_habitacion) === roomId);
            if (!room) return;

            btn.addEventListener('click', () => openReservationModal(room));
        });
    }
});
