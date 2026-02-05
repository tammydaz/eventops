import {
  AIRTABLE_EVENTS_TABLE_ID_ENV,
  AIRTABLE_EVENTS_VIEW_ID_ENV,
  EVENT_NAME_FIELD_ID,
  optionalEnv,
  requiredEnv,
} from "../config/airtable";
import { airtableFetch, AirtableListResponse } from "./airtableClient";

export type EventFields = Record<string, unknown> & {
  [EVENT_NAME_FIELD_ID]?: string;
};

export type EventRecord = {
  id: string;
  fields: EventFields;
};

const EVENTS_TABLE_ID = () => requiredEnv(AIRTABLE_EVENTS_TABLE_ID_ENV);

const buildEventsQuery = () => {
  const viewId = optionalEnv(AIRTABLE_EVENTS_VIEW_ID_ENV);
  const params = new URLSearchParams({
    maxRecords: "200",
    cellFormat: "json",
    returnFieldsByFieldId: "true",
  });

  if (viewId) {
    params.set("view", viewId);
  }

  return params.toString();
};

export const listEvents = async (): Promise<EventRecord[]> => {
  const query = buildEventsQuery();
  const data = await airtableFetch<AirtableListResponse<EventFields>>(
    `/${EVENTS_TABLE_ID()}?${query}`
  );

  return data.records.map((record) => ({
    id: record.id,
    fields: record.fields,
  }));
};
