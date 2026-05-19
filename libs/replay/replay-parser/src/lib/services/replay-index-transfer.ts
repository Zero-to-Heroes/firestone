import { Map } from 'immutable';
import { ActionHistoryItem } from '../models/history/action-history-item';
import { ChangeEntityHistoryItem } from '../models/history/change-entity-history-item';
import { ChoicesHistoryItem } from '../models/history/choices-history-item';
import { ChosenEntityHistoryItem } from '../models/history/chosen-entities-history-item';
import { FullEntityHistoryItem } from '../models/history/full-entity-history-item';
import { GameHistoryItem } from '../models/history/game-history-item';
import { HideEntityHistoryItem } from '../models/history/hide-entity-history-item';
import { HistoryItem } from '../models/history/history-item';
import { MetadataHistoryItem } from '../models/history/metadata-history-item';
import { OptionsHistoryItem } from '../models/history/options-history-item';
import { PlayerHistoryItem } from '../models/history/player-history-item';
import { ShowEntityHistoryItem } from '../models/history/show-entity-history-item';
import { TagChangeHistoryItem } from '../models/history/tag-change-history-item';
import { ReplayIndex } from '../models/replay-index';

const HISTORY_ITEM_CTORS: Record<string, new (...args: never[]) => HistoryItem> = {
	ActionHistoryItem,
	ChangeEntityHistoryItem,
	ChoicesHistoryItem,
	ChosenEntityHistoryItem,
	FullEntityHistoryItem,
	GameHistoryItem,
	HideEntityHistoryItem,
	MetadataHistoryItem,
	OptionsHistoryItem,
	PlayerHistoryItem,
	ShowEntityHistoryItem,
	TagChangeHistoryItem,
};

export interface SerializedReplayIndex {
	readonly meta: ReplayIndex['meta'];
	readonly turnChunks: readonly { readonly __type: string; readonly data: Record<string, unknown> }[][];
	readonly entityCardId: readonly [number, string][];
	readonly turnTimestamps: readonly number[];
	readonly totalDuration: number;
}

/** Stable type id (constructor.name breaks under prod minification in the worker bundle). */
export function getHistoryItemKind(item: HistoryItem): string {
	if (item instanceof ActionHistoryItem) {
		return 'ActionHistoryItem';
	}
	if (item instanceof ChangeEntityHistoryItem) {
		return 'ChangeEntityHistoryItem';
	}
	if (item instanceof ChoicesHistoryItem) {
		return 'ChoicesHistoryItem';
	}
	if (item instanceof ChosenEntityHistoryItem) {
		return 'ChosenEntityHistoryItem';
	}
	if (item instanceof FullEntityHistoryItem) {
		return 'FullEntityHistoryItem';
	}
	if (item instanceof GameHistoryItem) {
		return 'GameHistoryItem';
	}
	if (item instanceof HideEntityHistoryItem) {
		return 'HideEntityHistoryItem';
	}
	if (item instanceof MetadataHistoryItem) {
		return 'MetadataHistoryItem';
	}
	if (item instanceof OptionsHistoryItem) {
		return 'OptionsHistoryItem';
	}
	if (item instanceof PlayerHistoryItem) {
		return 'PlayerHistoryItem';
	}
	if (item instanceof ShowEntityHistoryItem) {
		return 'ShowEntityHistoryItem';
	}
	if (item instanceof TagChangeHistoryItem) {
		return 'TagChangeHistoryItem';
	}
	throw new Error(`[replay-index-transfer] Unrecognized history item: ${item}`);
}

export function serializeReplayIndex(index: ReplayIndex): SerializedReplayIndex {
	return {
		meta: index.meta,
		turnChunks: index.turnChunks.map((chunk) =>
			chunk.map((item) => ({
				__type: getHistoryItemKind(item),
				data: { ...(item as unknown as Record<string, unknown>) },
			})),
		),
		entityCardId: index.entityCardId.toArray(),
		turnTimestamps: index.turnTimestamps,
		totalDuration: index.totalDuration,
	};
}

export function deserializeReplayIndex(serialized: SerializedReplayIndex): ReplayIndex {
	return {
		meta: serialized.meta,
		turnChunks: serialized.turnChunks.map((chunk) => chunk.map(reviveHistoryItem)),
		entityCardId: Map(serialized.entityCardId),
		turnTimestamps: serialized.turnTimestamps,
		totalDuration: serialized.totalDuration,
	};
}

function reviveHistoryItem(item: { readonly __type: string; readonly data: Record<string, unknown> }): HistoryItem {
	const ctor = HISTORY_ITEM_CTORS[item.__type];
	if (!ctor) {
		throw new Error(`[replay-index-transfer] Unknown history item type: ${item.__type}`);
	}
	return Object.assign(Object.create(ctor.prototype), item.data);
}
