import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { MercenariesOutOfCombatState } from '../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { Preferences } from '../../../models/preferences';
import { CardsFacadeService } from '../../cards-facade.service';
import { BroadcastEvent, Events } from '../../events.service';
import { OverwolfService } from '../../overwolf.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { PreferencesService } from '../../preferences.service';
import { MercenariesOutOfCombatTeamOverlayHandler } from './overlay/mercenaries-out-of-combat-team-overlay-handler';
import { MercenariesOutOfCombatTreasureSelectionOverlayHandler } from './overlay/mercenaries-out-of-combat-treasure-selection-handler';
import { MercenariesOutOfCombatOverlayHandler } from './overlay/_mercenaries-out-of-combat-overlay-handler';
import { MercenariesMemoryInformationParser } from './parser/mercenaries-memory-information-parser';
import { MercenariesTreasureSelectionParser } from './parser/mercenaries-treasure-selection-parser';
import { MercenariesOutOfCombatParser } from './parser/_mercenaries-out-of-combat-parser';

@Injectable()
export class MercenariesOutOfCombatService {
	public store$ = new BehaviorSubject<MercenariesOutOfCombatState>(null);

	private internalStore$ = new BehaviorSubject<MercenariesOutOfCombatState>(new MercenariesOutOfCombatState());

	private preferences$: Observable<Preferences>;
	private events$: Observable<BroadcastEvent>;
	private mainWindowState$: Observable<MainWindowState>;

	private parsers: { [eventType: string]: readonly MercenariesOutOfCombatParser[] };
	private eventEmitters: ((state: MercenariesOutOfCombatState) => void)[] = [];
	private overlayHandlers: MercenariesOutOfCombatOverlayHandler[];

	constructor(
		private readonly events: Events,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly memoryService: MemoryInspectionService,
		private readonly ow: OverwolfService,
	) {
		this.init();

		// So that we're sure that all services have been initialized
		setTimeout(() => {
			this.preferences$ = (this.ow.getMainWindow().preferencesEventBus as BehaviorSubject<any>)
				.asObservable()
				.pipe(map((theEvent) => theEvent.preferences as Preferences));
			this.mainWindowState$ = (this.ow.getMainWindow()
				.mainWindowStore as BehaviorSubject<MainWindowState>).asObservable();
			this.events$ = this.events.on(Events.MEMORY_UPDATE);

			combineLatest(this.events$, this.mainWindowState$)
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

			window['mercenariesOutOfCombatStore'] = this.store$;
		});
	}

	private async processEvent(event: BroadcastEvent, mainWindowState: MainWindowState): Promise<void> {
		try {
			const parsers = this.getParsersFor(event.key, this.internalStore$.value);
			if (!parsers?.length) {
				return;
			}

			let state = this.internalStore$.value;
			for (const parser of parsers) {
				state = await parser.parse(state, event, mainWindowState);
				console.debug('[merc-ooc-store] updated state', state);
			}
			this.internalStore$.next(state);
		} catch (e) {
			console.error('[mercenaries-ooc-store] could not process event', event.key, event, e);
		}
	}

	private async emitState(newState: MercenariesOutOfCombatState, preferences: Preferences): Promise<void> {
		this.eventEmitters.forEach((emitter) => emitter(newState));
		await Promise.all(this.overlayHandlers.map((handler) => handler.updateOverlay(newState, preferences)));
	}

	private init() {
		this.registerParser();
		this.buildEventEmitters();
		this.buildOverlayHandlers();
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
			new MercenariesMemoryInformationParser(this.memoryService),
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
