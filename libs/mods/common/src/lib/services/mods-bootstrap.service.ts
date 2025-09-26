import { Injectable } from '@angular/core';
import { GameStatusService, PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';

@Injectable()
export class ModsBootstrapService {
	private ws: WebSocket | null;

	constructor(
		private readonly gameStatus: GameStatusService,
		private readonly prefs: PreferencesService,
	) {}

	public async init() {
		await waitForReady(this.prefs);

		// this.prefs.preferences$$
		// 	.pipe(
		// 		map((prefs) => prefs.modsEnabled),
		// 		distinctUntilChanged(),
		// 	)
		// 	.pipe(
		// 		filter((enabled) => enabled),
		// 		take(1),
		// 	)
		// 	.subscribe(() => {
		// 		console.log('[mods-boostrap] Initializing mods services');
		// 		this.gameStatus.onGameExit(() => this.inGame$$.next(false));
		// 		this.gameStatus.onGameStart(() => this.inGame$$.next(true));
		// 		combineLatest([
		// 			this.prefs.preferences$$.pipe(
		// 				map((prefs) => prefs.modsEnabled),
		// 				distinctUntilChanged(),
		// 			),
		// 			this.inGame$$,
		// 		])
		// 			.pipe(
		// 				filter(([enabled, inGame]) => enabled),
		// 				distinctUntilChanged(),
		// 			)
		// 			.subscribe(([enabled, inGame]) => {
		// 				if (inGame) {
		// 					this.connectWebSocket();
		// 				} else {
		// 					this.disconnectWebSocket();
		// 				}
		// 			});

		// this.store
		// 	.listenDeckState$((state) => state)
		// 	.pipe(
		// 		filter(() => this.ws?.readyState === this.ws?.OPEN),
		// 		debounceTime(1000),
		// 		distinctUntilChanged(),
		// 		map(([state]) => JSON.stringify(state)),
		// 		distinctUntilChanged(),
		// 	)
		// 	.subscribe((state) => {
		// 		this.sendToWs(state);
		// 		// console.debug('[mods-boostrap] sent state to websocket');
		// 	});
		// });
	}

	// private async sendToWs(msg: string) {
	// 	await this.wsReady();
	// 	try {
	// 		this.ws?.send(msg);
	// 	} catch (e) {
	// 		console.warn('[mods-boostrap] could not send message to websocket', e);
	// 	}
	// }

	// private wsReady(): Promise<void> {
	// 	return new Promise<void>((resolve) => {
	// 		const dbWait = () => {
	// 			if (this.ws?.readyState === this.ws?.OPEN) {
	// 				resolve();
	// 			} else {
	// 				setTimeout(() => dbWait(), 150);
	// 			}
	// 		};
	// 		dbWait();
	// 	});
	// }

	// private async connectWebSocket() {
	// 	if (!!this.ws && this.ws.readyState === this.ws?.OPEN) {
	// 		// console.debug('[mods-boostrap] websocket already open');
	// 		return;
	// 	}
	// 	let retriesLeft = 30;
	// 	while (retriesLeft >= 0) {
	// 		try {
	// 			this.ws = new WebSocket('ws://127.0.0.1:9977/firestone-mods');
	// 			console.log('[mods-boostrap] WS client created');
	// 			return;
	// 		} catch (e) {
	// 			// console.debug('[mods-boostrap] could not connect to websocket, retrying', e);
	// 			retriesLeft--;
	// 		}
	// 		await sleep(2000);
	// 	}
	// }

	// private async disconnectWebSocket() {
	// 	this.ws?.close();
	// 	this.ws = null;
	// }
}
