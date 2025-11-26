// public/js/payments.js

async function submitPayment(e) {
    e.preventDefault();

    const reservation_id = document.getElementById('reservationId').value || 0;
    const amount = Number(document.getElementById('amount').value || 0);
    const card = {
        number: document.getElementById('cardNumber').value.replace(/\s+/g, ''),
        name: document.getElementById('cardName').value,
        exp: document.getElementById('cardExp').value,
        cvv: document.getElementById('cardCvv').value
    };

    // validaciones básicas
    if (!reservation_id) return alert('Falta el ID de la reservación');
    if (!card.number || card.number.length < 13) return alert('Número de tarjeta inválido para pruebas');
    if (!card.name) return alert('Nombre en tarjeta requerido');
    if (!amount || amount <= 0) return alert('Monto inválido');

    const payload = { reservation_id, amount, card };

    const respEl = document.getElementById('result');
    respEl.innerHTML = 'Procesando...';

    try {
        const res = await fetch('/api/payments/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
            // redirigir a pantalla de resultado
            window.location.href =
                `/payment/resultado.html?status=${encodeURIComponent(data.status)}` +
                `&ref=${encodeURIComponent(data.reference)}` +
                `&amount=${encodeURIComponent(amount)}` +
                `&rid=${encodeURIComponent(reservation_id)}`;
        } else {
            respEl.innerHTML = `<div class="alert alert-danger">Error: ${data.error || JSON.stringify(data)}</div>`;
        }
    } catch (err) {
        console.error(err);
        respEl.innerHTML = `<div class="alert alert-danger">Error de red</div>`;
    }
}

// === Inicialización al cargar la página de checkout ===
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('paymentForm');
    if (!form) return;

    // Leer parámetros de la URL: ?rid=123&amount=456
    const params = new URLSearchParams(window.location.search);
    const rid = params.get('rid');
    const amount = params.get('amount');

    const reservationInput = document.getElementById('reservationId');
    const amountInput = document.getElementById('amount');

    if (rid && reservationInput) {
        reservationInput.value = rid;
    }

    if (amount && amountInput) {
        amountInput.value = amount;
    }

    form.addEventListener('submit', submitPayment);
});
