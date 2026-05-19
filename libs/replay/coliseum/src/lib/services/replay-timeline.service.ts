import { Injectable } from '@angular/core';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import {
	ActionButtonUsedAction,
	BaconBoardVisualStateAction,
	CardDrawAction,
	CardPlayedFromHandAction,
	Game,
} from '@firestone/replay/replay-parser';
import {
	buildReplayTimeline,
	computeTimelineTotalDuration,
	TimelineGame,
} from './replay-timeline.builder';
import { EventsLogEntry, ReplayTimeline } from './replay-timeline.model';

@Injectable({ providedIn: 'root' })
export class ReplayTimelineService {
	build(game: Game | null | undefined, totalDuration: number): ReplayTimeline {
		return buildReplayTimeline(game as unknown as TimelineGame | null | undefined, totalDuration);
	}

	buildEventsLog(game: Game | null | undefined, totalDuration: number): EventsLogEntry[] {
		if (!game?.turns?.size) {
			return [];
		}

		const timeline = this.build(game, totalDuration);
		const isBg = isBattlegrounds(game.gameType);
		const turnEntries: EventsLogEntry[] = timeline.markers.map((marker) => ({
			type: 'turn' as const,
			turnNumber: marker.turnIndex,
			actionNumber: marker.actionIndex,
			isPlayer: marker.isLocalPlayer ?? marker.kind === 'bg_combat',
			text: marker.label,
		}));
		const actionEntries = isBg ? this.buildBattlegroundsActionEntries(game) : this.buildConstructedActionEntries(game);

		return [...turnEntries, ...actionEntries].sort(
			(a, b) => a.turnNumber - b.turnNumber || a.actionNumber - b.actionNumber,
		);
	}

	computeTotalDuration(game: Game | null | undefined): number {
		return computeTimelineTotalDuration(game as unknown as TimelineGame | null | undefined);
	}

	private buildConstructedActionEntries(game: Game): EventsLogEntry[] {
		const player = game.players[0];
		const entries: EventsLogEntry[] = [];

		game.turns.entrySeq().forEach(([turnNumber, turn]) => {
			if (!turn.actions?.length) {
				return;
			}
			const isPlayer = turn.actions[0].activePlayer === player.playerId;
			turn.actions.forEach((action, actionIndex) => {
				if (action instanceof CardPlayedFromHandAction) {
					entries.push({
						turnNumber,
						actionNumber: actionIndex,
						isPlayer,
						type: 'action',
						text: action.textRaw.split('\t').filter((t) => !!t?.length)[0],
					});
				} else if (action instanceof CardDrawAction && action.textRaw) {
					entries.push({
						turnNumber,
						actionNumber: actionIndex,
						isPlayer,
						type: 'action',
						text: action.textRaw.split('\t').filter((t) => !!t?.length)[0],
					});
				}
			});
		});

		return entries;
	}

	private buildBattlegroundsActionEntries(game: Game): EventsLogEntry[] {
		const entries: EventsLogEntry[] = [];

		game.turns.entrySeq().forEach(([turnNumber, turn]) => {
			if (!turn.actions?.length || turnNumber <= 1) {
				return;
			}
			turn.actions.forEach((action, actionIndex) => {
				if (action instanceof ActionButtonUsedAction) {
					entries.push({
						turnNumber,
						actionNumber: actionIndex,
						isPlayer: false,
						type: 'action',
						text: action.textRaw.split('\t').filter((t) => !!t?.length)[0],
					});
				}
			});
		});

		return entries;
	}
}
