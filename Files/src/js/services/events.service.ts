import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

interface BroadcastEvent {
	key: any;
	data: any[];
}

export class Events {
	public static readonly NO_LOG_FILE = 'no-log-file';
	public static readonly START_LOG_FILE_DETECTION = 'start-log-file-detection';
	public static readonly STREAMING_LOG_FILE = 'streaming-log-file';

	public static readonly NEW_PACK = 'new-pack';
	public static readonly NEW_CARD = 'new-card';
	public static readonly MORE_DUST = 'more-dust';

	public static readonly NEW_ACHIEVEMENT = 'new-achievement';
	public static readonly ACHIEVEMENT_COMPLETE = 'achievement-complete';
	public static readonly ACHIEVEMENT_RECORDED = 'achievement-recorded';
	public static readonly ACHIEVEMENT_RECORD_END = 'achievement-record-end';

	public static readonly SCENE_CHANGED = "scene-changed";

	public static readonly SHOW_TOOLTIP = 'show-tooltip';
	public static readonly HIDE_TOOLTIP = 'hide-tooltip';

	// An intermediate layer for decktracker, so that we have better control on the display
	public static readonly DECK_SHOW_TOOLTIP = 'deck-show-tooltip';
	public static readonly DECK_HIDE_TOOLTIP = 'deck-hide-tooltip';

	public static readonly SETTINGS_DISPLAY_MODAL = 'settings-display-modal';	

	public static readonly FORMAT_SELECTED = 'format-selected'; // For FTUE, will be refactored later
	public static readonly SET_SELECTED = 'set-selected'; // For FTUE, will be refactored later
	public static readonly SHOWING_FTUE = 'showing-ftue'; // For FTUE, will be refactored later
	public static readonly DISMISS_FTUE = 'dismiss-ftue'; // For FTUE, will be refactored later
	public static readonly SET_MOUSE_OVER = 'set-mouse-over'; // For FTUE, will be refactored later

	private _eventBus: Subject<BroadcastEvent>;

	constructor() {
		this._eventBus = new Subject<BroadcastEvent>();
	}

	broadcast(key: any, ...data: any[]) {
		this._eventBus.next({key, data});
	}

	on(key: any): Observable<BroadcastEvent> {
		return this._eventBus.asObservable()
			.filter(event => event.key === key)
			.map(event => event);
	}
}
