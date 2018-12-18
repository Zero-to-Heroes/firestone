import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';

interface BroadcastEvent {
	key: any;
	data: any[];
}

// https://blog.lacolaco.net/post/event-broadcasting-in-angular-2/
export class Events {
	public static readonly NO_LOG_FILE = 'no-log-file';
	public static readonly START_LOG_FILE_DETECTION = 'start-log-file-detection';
	public static readonly STREAMING_LOG_FILE = 'streaming-log-file';

	public static readonly NEW_PACK = 'new-pack';
	public static readonly NEW_CARD = 'new-card';
	public static readonly MORE_DUST = 'more-dust';
	public static readonly MODULE_SELECTED = 'module-selected';
	public static readonly UPDATE_CURRENT_MENU = 'update-current-menu';
	public static readonly MODULE_IN_VIEW = 'module-in-view';
	public static readonly FORMAT_SELECTED = 'format-selected';
	public static readonly SHOW_CARDS = 'show-cards';
	public static readonly SET_SELECTED = 'set-selected';

	public static readonly ACHIEVEMENT_SET_SELECTED = 'achievement-set-selected';
	public static readonly NEW_ACHIEVEMENT = 'new-achievement';
	public static readonly ACHIEVEMENT_COMPLETE = 'achievement-complete';
	public static readonly ACHIEVEMENT_RECORD_STARTED = 'achievement-record-started';
	public static readonly ACHIEVEMENT_RECORDED = 'achievement-recorded';
	public static readonly ACHIEVEMENT_RECORD_END = 'achievement-record-end';
	public static readonly ACHIEVEMENT_RECORD_SAVED = 'achievement-record-saved';
	public static readonly ACHIEVEMENT_UPDATED = 'achievement-updated';
	public static readonly SHOW_ACHIEVEMENT = 'show-achievement';

	public static readonly SCENE_CHANGED = "scene-changed";

	public static readonly SHOW_CARD_MODAL = 'show-card-modal';
	public static readonly SHOW_TOOLTIP = 'show-tooltip';
	public static readonly HIDE_TOOLTIP = 'hide-tooltip';

	public static readonly SET_MOUSE_OVER = 'set-mouse-over';
	public static readonly SHOWING_FTUE = 'showing-ftue';
	public static readonly DISMISS_FTUE = 'dismiss-ftue';
	
	public static readonly SETTINGS_DISPLAY_MODAL = 'settings-display-modal';	

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
