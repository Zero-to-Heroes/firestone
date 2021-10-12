import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { GameEvent } from '../../models/game-event';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { MercenariesBattleState } from '../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../models/preferences';
import { CardsFacadeService } from '../cards-facade.service';
import { FeatureFlags } from '../feature-flags';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { MercenariesOpponentBattleTeamOverlayHandler } from './overlay-handler/mercenaries-opponent-battle-team-overlay-handler';
import { MercenariesOverlayHandler } from './overlay-handler/_mercenaries-overlay-handler';
import { MercenariesAbilityActivatedParser } from './parser/mercenaries-ability-activated-parser';
import { MercenariesAbilityRevealedParser } from './parser/mercenaries-ability-revealed-parser';
import { MercenariesAbilityUpdatedParser } from './parser/mercenaries-ability-updated-parser';
import { MercenariesEquipmentRevealedParser } from './parser/mercenaries-equipment-revealed-parser';
import { MercenariesEquipmentUpdatedParser } from './parser/mercenaries-equipment-updated-parser';
import { MercenariesGameEndParser } from './parser/mercenaries-game-end-parser';
import { MercenariesHeroRevealedParser } from './parser/mercenaries-hero-revealed-parser';
import { MercenariesHeroUpdatedParser } from './parser/mercenaries-hero-updated-parser';
import { MercenariesMatchMetadataParser } from './parser/mercenaries-match-metadata-parser';
import { MercenariesTeamManualCloseParser } from './parser/mercenaries-team-manual-close-parser';
import { MercenariesParser } from './parser/_mercenaries-parser';

@Injectable()
export class MercenariesStoreService {
	public store$ = new BehaviorSubject<MercenariesBattleState>(null);

	private internalStore$ = new BehaviorSubject<MercenariesBattleState>(null);
	private internalEventSubject$ = new BehaviorSubject<GameEvent>(null);

	private preferences$: Observable<Preferences>;
	private mainWindowState$: Observable<MainWindowState>;

	// private mainWindowState: MainWindowState;
	// private battleState: MercenariesBattleState = new MercenariesBattleState();
	private parsers: { [eventType: string]: readonly MercenariesParser[] };
	private eventEmitters: ((state: MercenariesBattleState) => void)[] = [];
	private overlayHandlers: MercenariesOverlayHandler[];

	constructor(
		private readonly events: GameEventsEmitterService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
	) {
		if (!FeatureFlags.ENABLE_MERCENARIES_TEAM_WIDGET) {
			return;
		}

		this.init();

		// So that we're sure that all services have been initialized
		setTimeout(() => {
			this.preferences$ = (this.ow.getMainWindow().preferencesEventBus as BehaviorSubject<any>)
				.asObservable()
				.pipe(map((theEvent) => theEvent.preferences as Preferences));
			this.mainWindowState$ = (this.ow.getMainWindow()
				.mainWindowStore as BehaviorSubject<MainWindowState>).asObservable();

			combineLatest(this.internalEventSubject$.asObservable(), this.mainWindowState$)
				.pipe(
					distinctUntilChanged(),
					filter(([event, mainWindowState]) => !!event),
					concatMap(async ([event, mainWindowState]) => await this.processEvent(event, mainWindowState)),
				)
				.subscribe();
			combineLatest(this.preferences$, this.internalStore$.asObservable())
				.pipe(
					distinctUntilChanged(),
					concatMap(async ([prefs, newState]) => await this.emitState(newState, prefs)),
				)
				.subscribe();

			window['battleStateUpdater'] = this.internalEventSubject$;
			window['mercenariesStore'] = this.store$;
		});
	}

	// Maybe find a way to only emit the state each N milliseconds at the most to limit the
	// redraws in the UI
	private async processEvent(event: GameEvent, mainWindowState: MainWindowState): Promise<void> {
		const battleState = this.internalStore$.value;
		// console.debug('[mercenaries-store] processing event', event.type, event, battleState);
		const parsers = this.getParsersFor(event.type, battleState);
		if (!parsers?.length) {
			return;
		}

		let state = battleState;
		for (const parser of parsers) {
			state = await parser.parse(state, event, mainWindowState);
			console.debug('[mercenaries-store] processed event', event.type, event, state);
		}
		this.internalStore$.next(state);
	}

	private async emitState(newState: MercenariesBattleState, preferences: Preferences): Promise<void> {
		console.debug('[mercenaries-store] emitting state', newState);
		this.eventEmitters.forEach((emitter) => emitter(newState));
		await Promise.all(this.overlayHandlers.map((handler) => handler.updateOverlay(newState, preferences)));
	}

	private init() {
		this.events.allEvents.subscribe((event) => this.internalEventSubject$.next(event));
		this.registerParser();
		this.buildEventEmitters();
		this.buildOverlayHandlers();
	}

	private getParsersFor(type: string, battleState: MercenariesBattleState): readonly MercenariesParser[] {
		const candidates = this.parsers[type];
		return candidates?.filter((parser) => parser.applies(battleState));
	}

	private buildEventEmitters() {
		const result = [(state) => this.store$.next(state)];
		this.eventEmitters = result;
	}

	private buildOverlayHandlers() {
		this.overlayHandlers = [new MercenariesOpponentBattleTeamOverlayHandler(this.prefs, this.ow)];
	}

	private registerParser() {
		const parsers: readonly MercenariesParser[] = [
			new MercenariesMatchMetadataParser(),
			new MercenariesGameEndParser(),

			new MercenariesHeroRevealedParser(this.allCards),
			new MercenariesHeroUpdatedParser(this.allCards),
			new MercenariesAbilityRevealedParser(this.allCards),
			new MercenariesAbilityUpdatedParser(this.allCards),
			new MercenariesAbilityActivatedParser(this.allCards),
			new MercenariesEquipmentRevealedParser(this.allCards),
			new MercenariesEquipmentUpdatedParser(this.allCards),

			new MercenariesTeamManualCloseParser(),
		];
		this.parsers = {};
		for (const parser of parsers) {
			if (!this.parsers[parser.eventType()]) {
				this.parsers[parser.eventType()] = [];
			}
			this.parsers[parser.eventType()] = [...this.parsers[parser.eventType()], parser];
		}
	}
}

// let i = 0;

// const test = async () => {
// 	const internalEventSubject = new BehaviorSubject<string>(null);
// 	internalEventSubject
// 		.asObservable()
// 		.pipe(
// 			distinctUntilChanged(),
// 			filter((event) => !!event),
// 			map(async (event) => await doSomething()),
// 		)
// 		.subscribe(async (info) => console.log(await info));
// 	for (let j = 0; j < 50; j++) {
// 		internalEventSubject.next('glut' + j);
// 	}
// };

// const doSomething = async () => {
// 	await sleep(500 * Math.random());
// 	return 'hop' + i++;
// };
// test();
