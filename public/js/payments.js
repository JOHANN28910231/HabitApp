
async function submitPayment(e) {
    e.preventDefault();
    const reservation_id = document.getElementById('reservationId').value || 1; // para pruebas
    const amount = Number(document.getElementById('amount').value || 0);
    const card = {
        number: document.getElementById('cardNumber').value.replace(/\s+/g, ''),
        name: document.getElementById('cardName').value,
        exp: document.getElementById('cardExp').value,
        cvv: document.getElementById('cardCvv').value
    };

    // validaciones básicas
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
            window.location.href = `/payment/resultado.html?status=${data.status}&ref=${encodeURIComponent(data.reference)}&amount=${amount}&rid=${reservation_id}`;
        } else {
            respEl.innerHTML = `<div class="alert alert-danger">Error: ${data.error || JSON.stringify(data)}</div>`;
        }
    } catch (err) {
        respEl.innerHTML = `<div class="alert alert-danger">Error de red</div>`;
    }
}

document.getElementById('paymentForm').addEventListener('submit', submitPayment);
