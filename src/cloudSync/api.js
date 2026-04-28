import axios from "axios";
let BASE_URL = "http://192.168.8.95:8000/api"

export async function sendBulkSync(model, items) {
  console.log(model,items,"hello model items sync")
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await axios.post(
      `${BASE_URL}/core/${model}/bulk_sync/`,
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