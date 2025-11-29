// public/js/payments.js
(function () {
    const form              = document.getElementById('paymentForm');
    if (!form) return;

    const reservationInput  = document.getElementById('reservationId');
    const amountInput       = document.getElementById('amount');
    const cardNumberInput   = document.getElementById('cardNumber');
    const cardNameInput     = document.getElementById('cardName');
    const cardExpInput      = document.getElementById('cardExp');
    const cardCvvInput      = document.getElementById('cardCvv');
    const respEl            = document.getElementById('result');

    // ==============================
    // 0) Leer parámetros de la URL
    // ==============================
    const params = new URLSearchParams(window.location.search);
    const urlReservationId = params.get('reservationId');
    const urlAmount        = params.get('amount');

    if (urlReservationId && reservationInput) {
        reservationInput.value = urlReservationId;
    }
    if (urlAmount && amountInput) {
        amountInput.value = urlAmount;
    }

    // ==============================
    // 1) Formateo en vivo: TARJETA
    // ==============================
    function handleCardNumberInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 16) value = value.slice(0, 16);

        const groups = value.match(/.{1,4}/g);
        e.target.value = groups ? groups.join(' ') : '';
    }

    // ==============================
    // 2) Formateo en vivo: EXPIRACIÓN (MM/AA)
    // ==============================
    function handleCardExpInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);

        if (value.length >= 3) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        e.target.value = value;
    }

    // ==============================
    // 3) Formateo en vivo: CVV (3 dígitos)
    // ==============================
    function handleCardCvvInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 3) value = value.slice(0, 3);
        e.target.value = value;
    }

    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', handleCardNumberInput);
    }
    if (cardExpInput) {
        cardExpInput.addEventListener('input', handleCardExpInput);
    }
    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', handleCardCvvInput);
    }

    // ==============================
    // 4) Envío del formulario
    // ==============================
    async function submitPayment(e) {
        e.preventDefault();

        const reservation_id = reservationInput?.value || urlReservationId || 1;
        const amount         = Number(amountInput?.value || urlAmount || 0);

        const rawNumberDigits = (cardNumberInput?.value || '').replace(/\D/g, '');
        const cardName        = (cardNameInput?.value || '').trim();
        const expValue        = (cardExpInput?.value || '').trim();
        const cvvDigits       = (cardCvvInput?.value || '').replace(/\D/g, '');

        // Número de tarjeta: 16 dígitos
        if (!rawNumberDigits || rawNumberDigits.length !== 16) {
            alert('El número de tarjeta debe tener exactamente 16 dígitos.');
            return;
        }

        // Nombre
        if (!cardName) {
            alert('El nombre en la tarjeta es obligatorio.');
            return;
        }

        // Expiración: formato MM/AA y mes válido
        const expRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expRegex.test(expValue)) {
            alert('La fecha de expiración debe tener el formato MM/AA y un mes válido.');
            return;
        }

        // CVV: 3 dígitos
        if (!cvvDigits || cvvDigits.length !== 3) {
            alert('El CVV debe tener exactamente 3 dígitos.');
            return;
        }

        // Monto
        if (!amount || amount <= 0) {
            alert('Monto inválido.');
            return;
        }

        const card = {
            number: rawNumberDigits,
            name  : cardName,
            exp   : expValue,
            cvv   : cvvDigits,
        };

        const payload = { reservation_id, amount, card };

        if (respEl) {
            respEl.innerHTML = 'Procesando...';
        }

        try {
            const res = await fetch('/api/payments/charge', {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                window.location.href =
                    `/payment/resultado.html?status=${data.status}` +
                    `&ref=${encodeURIComponent(data.reference)}` +
                    `&amount=${amount}` +
                    `&rid=${reservation_id}`;
            } else {
                if (respEl) {
                    respEl.innerHTML =
                        `<div class="alert alert-danger">Error: ${data.error || JSON.stringify(data)}</div>`;
                } else {
                    alert(data.error || 'Error procesando el pago');
                }
            }
        } catch (err) {
            if (respEl) {
                respEl.innerHTML = `<div class="alert alert-danger">Error de red</div>`;
            } else {
                alert('Error de red');
            }
        }
    }

    form.addEventListener('submit', submitPayment);
})();
