import { JsonEvent } from './json-event';
import { JsonEventsMetadata } from './json-events-metadata';

export interface JsonEventsResult {
	readonly events: {
		readonly events: readonly JsonEvent[];
		readonly metadata: JsonEventsMetadata;
	};
}
