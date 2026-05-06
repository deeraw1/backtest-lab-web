export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backtest-lab-api.onrender.com";

export async function api<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
