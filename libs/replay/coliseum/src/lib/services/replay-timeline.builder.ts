import { isBattlegrounds } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import {
	ReplayTimeline,
	ReplayTimelineMarker,
	ReplayTimelineSegment,
	TimelineMarkerKind,
} from './replay-timeline.model';

export interface TimelineGamePlayer {
	playerId: number;
	name: string;
}

export interface TimelineGameAction {
	timestamp?: number;
	activePlayer?: number;
	textRaw?: string;
	newState?: number;
}

export interface TimelineGameTurn {
	actions?: TimelineGameAction[];
}

export interface TimelineGame {
	gameType: number;
	players: readonly TimelineGamePlayer[];
	turns: Map<number, TimelineGameTurn>;
}

export function buildReplayTimeline(game: TimelineGame | null | undefined, totalDuration: number): ReplayTimeline {
	if (!game?.turns?.size || !totalDuration) {
		return { markers: [], segments: [], totalDuration: totalDuration || 0 };
	}

	const markers = isBattlegrounds(game.gameType)
		? buildBattlegroundsMarkers(game, totalDuration)
		: buildConstructedMarkers(game, totalDuration);

	return {
		markers,
		segments: buildSegments(markers),
		totalDuration,
	};
}

export function computeTimelineTotalDuration(game: TimelineGame | null | undefined): number {
	if (!game?.turns?.size) {
		return 0;
	}
	const lastTurn = game.turns.get(game.turns.size - 1);
	if (!lastTurn?.actions?.length) {
		return 0;
	}
	for (let i = lastTurn.actions.length - 1; i >= 0; i--) {
		const timestamp = lastTurn.actions[i].timestamp;
		if (timestamp) {
			return timestamp;
		}
	}
	return 0;
}

export function getBattlegroundsDisplayTurnNumber(turnNumber: number, newState: number): number {
	const adjustedTurnNumber = turnNumber === 3 && newState === 2 ? turnNumber - 1 : turnNumber;
	return Math.ceil(adjustedTurnNumber / 2);
}

function buildConstructedMarkers(game: TimelineGame, totalDuration: number): ReplayTimelineMarker[] {
	const player = game.players[0];
	const opponent = game.players[1] ?? player;
	const markers: ReplayTimelineMarker[] = [];

	game.turns.entrySeq().forEach(([turnNumber, turn]) => {
		if (!turn.actions?.length) {
			if (turnNumber !== 0) {
				markers.push(
					createMarker({
						turnIndex: turnNumber,
						actionIndex: 0,
						timestamp: 0,
						totalDuration,
						kind: 'player_turn',
						label: `Turn ${Math.ceil(turnNumber / 2)}`,
						displayTurnNumber: Math.ceil(turnNumber / 2),
					}),
				);
			}
			return;
		}

		const firstAction = turn.actions[0];
		const isLocalPlayer = firstAction.activePlayer === player.playerId;
		const activePlayerName =
			turnNumber === 0
				? ''
				: firstAction.activePlayer === player.playerId
					? player.name
					: opponent.name;
		const displayTurnNumber = turnNumber === 0 ? undefined : Math.ceil(turnNumber / 2);
		const kind: TimelineMarkerKind = turnNumber === 0 ? 'mulligan' : 'player_turn';
		const label =
			turnNumber === 0
				? firstAction.textRaw ?? 'Mulligan'
				: `Turn ${displayTurnNumber} - ${activePlayerName}`;

		markers.push(
			createMarker({
				turnIndex: turnNumber,
				actionIndex: 0,
				timestamp: firstAction.timestamp ?? 0,
				totalDuration,
				kind,
				label,
				isLocalPlayer: turnNumber === 0 ? undefined : isLocalPlayer,
				displayTurnNumber,
			}),
		);
	});

	return markers.sort((a, b) => a.timestamp - b.timestamp);
}

function buildBattlegroundsMarkers(game: TimelineGame, totalDuration: number): ReplayTimelineMarker[] {
	const markers: ReplayTimelineMarker[] = [];

	game.turns.entrySeq().forEach(([turnNumber, turn]) => {
		if (!turn.actions?.length || turnNumber === 1) {
			return;
		}

		if (turnNumber === 0) {
			markers.push(
				createMarker({
					turnIndex: turnNumber,
					actionIndex: 0,
					timestamp: turn.actions[0].timestamp ?? 0,
					totalDuration,
					kind: 'hero_selection',
					label: 'Hero selection',
				}),
			);
			return;
		}

		turn.actions.forEach((action, actionIndex) => {
			if (!isBaconBoardVisualStateAction(action)) {
				return;
			}

			const displayTurnNumber = getBattlegroundsDisplayTurnNumber(turnNumber, action.newState);
			const kind: TimelineMarkerKind = action.newState === 1 ? 'bg_recruit' : 'bg_combat';
			markers.push(
				createMarker({
					turnIndex: turnNumber,
					actionIndex,
					timestamp: action.timestamp ?? 0,
					totalDuration,
					kind,
					label: `Turn ${displayTurnNumber} - ${action.textRaw ?? (kind === 'bg_recruit' ? 'Recruit' : 'Combat')}`,
					isLocalPlayer: action.newState !== 1,
					displayTurnNumber,
				}),
			);
		});
	});

	return markers.sort((a, b) => a.timestamp - b.timestamp);
}

function buildSegments(markers: ReplayTimelineMarker[]): ReplayTimelineSegment[] {
	if (!markers.length) {
		return [];
	}

	const segments: ReplayTimelineSegment[] = [];

	if (markers[0].positionPercent > 0) {
		segments.push({
			startPercent: 0,
			endPercent: markers[0].positionPercent,
			kind: markers[0].kind,
			isLocalPlayer: markers[0].isLocalPlayer,
			label: markers[0].label,
		});
	}

	for (let i = 0; i < markers.length; i++) {
		const marker = markers[i];
		const endPercent = i + 1 < markers.length ? markers[i + 1].positionPercent : 100;
		if (endPercent <= marker.positionPercent) {
			continue;
		}
		segments.push({
			startPercent: marker.positionPercent,
			endPercent,
			kind: marker.kind,
			isLocalPlayer: marker.isLocalPlayer,
			label: marker.label,
		});
	}

	return segments;
}

function isBaconBoardVisualStateAction(action: TimelineGameAction): action is TimelineGameAction & { newState: number } {
	return action.newState != null;
}

function createMarker(options: {
	turnIndex: number;
	actionIndex: number;
	timestamp: number;
	totalDuration: number;
	kind: TimelineMarkerKind;
	label: string;
	isLocalPlayer?: boolean;
	displayTurnNumber?: number;
}): ReplayTimelineMarker {
	const positionPercent = options.totalDuration > 0 ? (100 * options.timestamp) / options.totalDuration : 0;
	return {
		turnIndex: options.turnIndex,
		actionIndex: options.actionIndex,
		timestamp: options.timestamp,
		positionPercent,
		kind: options.kind,
		label: options.label,
		isLocalPlayer: options.isLocalPlayer,
		displayTurnNumber: options.displayTurnNumber,
	};
}
