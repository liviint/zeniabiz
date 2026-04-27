// sync/api.js

export async function sendBulkSync(model, items) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

  try {
    const res = await fetch(`/api/${model}/bulk_sync/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${token}` // add later if needed
      },
      body: JSON.stringify({ items }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    // 🔴 Server responded but with error status
    if (!res.ok) {
      let errorData = null

      try {
        errorData = await res.json()
      } catch {
        errorData = { detail: "Unknown server error" }
      }

      return {
        ok: false,
        type: "server",
        status: res.status,
        error: errorData
      }
    }

    // ✅ Success
    const data = await res.json()

    return {
      ok: true,
      data
    }

  } catch (err) {
    clearTimeout(timeout)

    if (err.name === "AbortError") {
      return {
        ok: false,
        type: "timeout",
        error: "Request timed out"
      }
    }

    return {
      ok: false,
      type: "network",
      error: err.message
    }
  }
}