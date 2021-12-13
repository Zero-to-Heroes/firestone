import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { MercenariesOutOfCombatState } from '../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { Preferences } from '../../../models/preferences';
import { CardsFacadeService } from '../../cards-facade.service';
import { BroadcastEvent, Events } from '../../events.service';
import { OverwolfService } from '../../overwolf.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { PreferencesService } from '../../preferences.service';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { MercenariesMemoryCacheService } from '../mercenaries-memory-cache.service';
import { MercenariesOutOfCombatTeamOverlayHandler } from './overlay/mercenaries-out-of-combat-team-overlay-handler';
import { MercenariesOutOfCombatTreasureSelectionOverlayHandler } from './overlay/mercenaries-out-of-combat-treasure-selection-handler';
import { MercenariesOutOfCombatOverlayHandler } from './overlay/_mercenaries-out-of-combat-overlay-handler';
import { MercenariesTreasureSelectionParser } from './parser/mercenaries-treasure-selection-parser';
import { MercenariesOutOfCombatParser } from './parser/_mercenaries-out-of-combat-parser';

@Injectable()
export class MercenariesOutOfCombatService {
	public store$ = new BehaviorSubject<MercenariesOutOfCombatState>(null);

	private internalStore$ = new BehaviorSubject<MercenariesOutOfCombatState>(new MercenariesOutOfCombatState());

	private preferences$: Observable<Preferences>;
	private events$: Observable<BroadcastEvent>;
	private mainWindowState$: Observable<[MainWindowState, NavigationState]>;

	private parsers: { [eventType: string]: readonly MercenariesOutOfCombatParser[] };
	private eventEmitters: ((state: MercenariesOutOfCombatState) => void)[] = [];
	private overlayHandlers: MercenariesOutOfCombatOverlayHandler[];

	constructor(
		private readonly events: Events,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly memoryService: MemoryInspectionService,
		private readonly memoryCache: MercenariesMemoryCacheService,
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.init();
		window['mercenariesOutOfCombatStore'] = this.store$;
	}

	private async processEvent(event: BroadcastEvent, currentScene: SceneMode): Promise<void> {
		try {
			const parsers = this.getParsersFor(event.key, this.internalStore$.value);
			// console.debug('parsers for', event.key, parsers, event);
			if (!parsers?.length) {
				return;
			}

			let state = this.internalStore$.value;
			for (const parser of parsers) {
				state = await parser.parse(state, event, currentScene);
				console.debug('[merc-ooc-store] updated state', state);
			}
			this.internalStore$.next(state);
		} catch (e) {
			console.error('[mercenaries-ooc-store] could not process event', event.key, event, e);
		}
	}

	private async emitState(
		newState: MercenariesOutOfCombatState,
		currentScene: SceneMode,
		preferences: Preferences,
	): Promise<void> {
		this.eventEmitters.forEach((emitter) => emitter(newState));
		await Promise.all(
			this.overlayHandlers.map((handler) => handler.updateOverlay(newState, currentScene, preferences)),
		);
	}

	private async init() {
		this.registerParser();
		this.buildEventEmitters();
		this.buildOverlayHandlers();

		// So that we're sure that all services have been initialized
		await this.store.initComplete();
		// setTimeout(() => {
		this.preferences$ = (this.ow.getMainWindow().preferencesEventBus as BehaviorSubject<any>)
			.asObservable()
			.pipe(map((theEvent) => theEvent.preferences as Preferences));
		this.mainWindowState$ = (this.ow.getMainWindow().mainWindowStoreMerged as BehaviorSubject<
			[MainWindowState, NavigationState]
		>).asObservable();
		this.events$ = this.events.on(Events.MEMORY_UPDATE);

		combineLatest(
			this.events$,
			this.store.listen$(([main, nav, prefs]) => main.currentScene),
		)
			.pipe(
				distinctUntilChanged(),
				filter(([event, currentScene]) => !!event),
				concatMap(async ([event, [currentScene]]) => await this.processEvent(event, currentScene)),
			)
			.subscribe();
		combineLatest(
			this.preferences$,
			this.internalStore$.asObservable(),
			this.store.listen$(([main, nav, prefs]) => main.currentScene),
		)
			.pipe(
				concatMap(
					async ([prefs, newState, [currentScene]]) => await this.emitState(newState, currentScene, prefs),
				),
			)
			.subscribe();
		// });
	}

	private getParsersFor(type: string, state: MercenariesOutOfCombatState): readonly MercenariesOutOfCombatParser[] {
		const candidates = this.parsers[type];
		return candidates?.filter((parser) => parser.applies(state));
	}

	private buildEventEmitters() {
		const result = [(state: MercenariesOutOfCombatState) => this.store$.next(state)];
		this.eventEmitters = result;
	}

	private buildOverlayHandlers() {
		this.overlayHandlers = [
			new MercenariesOutOfCombatTeamOverlayHandler(this.ow),
			new MercenariesOutOfCombatTreasureSelectionOverlayHandler(this.ow),
		];
	}

	private registerParser() {
		const parsers: readonly MercenariesOutOfCombatParser[] = [
			// new MercenariesMemoryInformationParser(this.memoryService, this.memoryCache),
			new MercenariesTreasureSelectionParser(this.allCards),
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
