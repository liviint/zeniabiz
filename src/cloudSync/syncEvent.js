import { addToQueue } from "./queue";
import { generateUUID } from "./utils";
import { triggerSync } from "./triggerSync";

export async function syncEvent(db, {
  model,
  operation = "upsert", // upsert | delete | update
  payload
}) {
  const now = new Date().toISOString();

  const event = {
    id: generateUUID(),
    model,
    operation,
    payload,
    client_request_id: generateUUID(),
    created_at: now,
    status: "pending"
  };

  await addToQueue(db, event);
  triggerSync(db);

  return event.id;
}