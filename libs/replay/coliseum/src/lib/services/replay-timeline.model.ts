export type ReplayTimelineMode = 'constructed' | 'battlegrounds';

export type TimelineMarkerKind =
	| 'mulligan'
	| 'player_turn'
	| 'bg_recruit'
	| 'bg_combat'
	| 'hero_selection';

export interface ReplayTimelineMarker {
	turnIndex: number;
	actionIndex: number;
	timestamp: number;
	positionPercent: number;
	kind: TimelineMarkerKind;
	label: string;
	isLocalPlayer?: boolean;
	displayTurnNumber?: number;
}

export interface ReplayTimelineSegment {
	startPercent: number;
	endPercent: number;
	kind: TimelineMarkerKind;
	turnIndex: number;
	actionIndex: number;
	isLocalPlayer?: boolean;
	label?: string;
}

export interface ReplayTimeline {
	markers: ReplayTimelineMarker[];
	segments: ReplayTimelineSegment[];
	totalDuration: number;
}

export interface EventsLogEntry {
	type: 'turn' | 'action';
	turnNumber: number;
	actionNumber: number;
	isPlayer: boolean;
	text: string;
	dimmed?: boolean;
}
