const API = "https://api.mercadopago.com";

function authHeaders() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

export async function createPreference(payload) {
  const response = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MP_CREATE_ERROR: ${text}`);
  }
  return response.json();
}

export async function getPayment(paymentId) {
  const response = await fetch(`${API}/v1/payments/${paymentId}`, {
    headers: authHeaders(),
    cache: "no-store"
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MP_PAYMENT_ERROR: ${text}`);
  }
  return response.json();
}
