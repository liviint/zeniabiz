

import { generateUUID, nowISO } from "./utils"
import { addToQueue } from "./queue"

export async function enqueue(db, model, payload) {
  const item = {
    id: generateUUID(),
    model,
    operation: payload.deleted_at ? "delete" : "update",
    payload,
    client_request_id: generateUUID(),
    created_at: nowISO()
  }

  await addToQueue(db, item)
}