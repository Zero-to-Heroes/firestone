import { Injectable } from '@angular/core';

@Injectable()
export class ModsBootstrapService {
	// constructor(private readonly store: AppUiStoreFacadeService, private readonly gameStatus: GameStatusService) {}

	public init() {
		console.log('Initializing mods services');
		// TODO: the server is only created when the game is running, so we need to handle this properly here

		// const ws = new WebSocket('ws://0.0.0.0:9977/firestone-mods');
		// console.log('WS client created');
		// this.store
		// 	.listenDeckState$((state) => state)
		// 	.pipe(
		// 		debounceTime(2000),
		// 		tap((state) => console.debug('updated state in mods service', state)),
		// 	)
		// 	.subscribe(([state]) => {
		// 		ws.send(JSON.stringify(state));
		// 		console.debug('sent state to websocket');
		// 	});
	}
}
