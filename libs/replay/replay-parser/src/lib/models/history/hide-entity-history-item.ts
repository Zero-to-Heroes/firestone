import { Zone } from '@firestone-hs/reference-data';
import { HistoryItem } from './history-item';

export class HideEntityHistoryItem extends HistoryItem {
	readonly entity: number;
	readonly zone: Zone;
}
