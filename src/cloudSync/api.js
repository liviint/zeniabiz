import {api} from "../../api"

export async function sendBulkSync(model, items) {
  console.log(model,items,"hello model items")
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await api.post(
      `/core/${model}/bulk_sync/`,
      { items },
      { signal: controller.signal }
    );

    clearTimeout(timeout);
    // console.log(res,"hello res 123...")
    return { ok: true, data: res.data };
  } catch (err) {
    clearTimeout(timeout);

    return {
      ok: false,
      type: err.name === "CanceledError" ? "timeout" : "network",
      error: err.message,
    };
  }
}