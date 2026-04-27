import axios from "axios";

export async function sendBulkSync(model, items) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await axios.post(
      `http://localhost:8000/api/${model}/bulk_sync/`,
      { items },
      {
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    return {
      ok: true,
      data: res.data,
    };
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "CanceledError" || err.name === "AbortError") {
      return {
        ok: false,
        type: "timeout",
        error: "Request timed out",
      };
    }

    return {
      ok: false,
      type: "network",
      error: err.message,
    };
  }
}