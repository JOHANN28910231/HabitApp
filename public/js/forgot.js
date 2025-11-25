document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("year-forgot").textContent = new Date().getFullYear();

    const form = document.getElementById("forgotForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        if (!email) {
            alert("Por favor ingresa tu correo.");
            return;
        }

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Error, intenta de nuevo.");
                return;
            }

            alert("Si tu correo está registrado, recibirás un enlace para recuperar tu contraseña.");
            form.reset();

        } catch (error) {
            console.error("Error:", error);
            alert("Hubo un problema con la conexión.");
        }
    });
});
