import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface BroadcastEvent {
	key: any;
	data: any[];
}

export class Events {
	public static readonly STORE_READY = 'EVENTS_STORE_READY';
	public static readonly MEMORY_UPDATE = 'MEMORY_UPDATEd';

	public static readonly NO_LOG_FILE = 'no-log-file';
	public static readonly START_LOG_FILE_DETECTION = 'start-log-file-detection';
	public static readonly STREAMING_LOG_FILE = 'streaming-log-file';

	public static readonly NEW_PACK = 'new-pack';

	public static readonly ACHIEVEMENT_COMPLETE = 'achievement-complete';

	public static readonly NEW_GAME_ID = 'new-game-id';
	public static readonly REVIEW_FINALIZED = 'review-finalized';
	// public static readonly GAME_END = 'events-game-end';
	public static readonly REVIEW_INITIALIZED = 'review-initialized';
	public static readonly SCENE_CHANGED = 'scene-changed';
	public static readonly PLAYER_INFO = 'player-info';
	public static readonly OPPONENT_INFO = 'opponent-info';

	public static readonly START_BGS_BATTLE_SIMULATION = 'EVENTS_START_BGS_BATTLE_SIMULATION';
	public static readonly BATTLE_SIMULATION_HISTORY_UPDATED = 'BATTLE_SIMULATION_HISTORY_UPDATED';

	public static readonly GAME_STATS_UPDATED = 'events-game-stats-updated';
	public static readonly GLOBAL_STATS_UPDATED = 'global-stats-updated';

	// An intermediate layer for decktracker, so that we have better control on the display
	public static readonly DECK_SHOW_TOOLTIP = 'deck-show-tooltip';
	public static readonly DECK_HIDE_TOOLTIP = 'deck-hide-tooltip';

	public static readonly SETTINGS_DISPLAY_MODAL = 'settings-display-modal';

	public static readonly FORMAT_SELECTED = 'format-selected'; // For FTUE, will be refactored later
	public static readonly SET_SELECTED = 'set-selected'; // For FTUE, will be refactored later
	public static readonly SET_MOUSE_OVER = 'set-mouse-over'; // For FTUE, will be refactored later

	public static readonly SHOW_MODAL = 'show-modal';
	public static readonly HIDE_MODAL = 'hide-modal';

	public static readonly START_POPULATE_COLLECTION_STATE = 'start-populate-collection-state';
	public static readonly START_BGS_RUN_STATS = 'start-bgs-run-stats';
	public static readonly POPULATE_HERO_DETAILS_FOR_BG = 'POPULATE_HERO_DETAILS_FOR_BG';

	public static readonly DUELS_LOAD_TOP_DECK_RUN_DETAILS = 'DUELS_LOAD_TOP_DECK_RUN_DETAILS';

	public static readonly ACHIEVEMENT_PROGRESSION = 'ACHIEVEMENT_PROGRESSION';

	public static readonly SHOW_SCREEN_CAPTURE_EFFECT = 'SHOW_SCREEN_CAPTURE_EFFECT';

	private _eventBus: Subject<BroadcastEvent>;

	constructor() {
		this._eventBus = new Subject<BroadcastEvent>();
	}

	broadcast(key: any, ...data: any[]) {
		this._eventBus.next({ key, data });
	}

	on(key: any): Observable<BroadcastEvent> {
		return this._eventBus.asObservable().pipe(
			filter((event) => event.key === key),
			map((event) => event),
		);
	}
}
