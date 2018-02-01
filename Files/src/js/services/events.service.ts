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

	public static NEW_PACK = 'new-pack';
	public static NEW_CARD = 'new-card';
	public static MORE_DUST = 'more-dust';

	public static MODULE_SELECTED = 'module-selected';
	public static FORMAT_SELECTED = 'format-selected';

	public static SET_SELECTED = 'set-selected';

	public static NO_LOG_FILE = 'no-log-file';
	public static START_LOG_FILE_DETECTION = 'start-log-file-detection';
	public static STREAMING_LOG_FILE = 'streaming-log-file';

	public static SHOW_TOOLTIP = 'show-tooltip';
	public static HIDE_TOOLTIP = 'hide-tooltip';

	public static HEARTHHEAD_LOGIN = 'hearthhead-login';

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
