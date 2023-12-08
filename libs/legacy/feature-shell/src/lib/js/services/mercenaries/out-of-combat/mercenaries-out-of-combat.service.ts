import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { MemoryUpdate, MemoryUpdatesService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { concatMap, distinctUntilChanged, filter } from 'rxjs/operators';
import { MercenariesOutOfCombatState } from '../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { SceneService } from '../../game/scene.service';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { MercenariesOutOfCombatParser } from './parser/_mercenaries-out-of-combat-parser';
import { MercenariesTreasureSelectionParser } from './parser/mercenaries-treasure-selection-parser';

@Injectable()
export class MercenariesOutOfCombatService {
	public store$ = new BehaviorSubject<MercenariesOutOfCombatState>(null);

	private internalStore$ = new BehaviorSubject<MercenariesOutOfCombatState>(new MercenariesOutOfCombatState());

	private parsers: readonly MercenariesOutOfCombatParser[] = [];
	private eventEmitters: ((state: MercenariesOutOfCombatState) => void)[] = [];

	constructor(
		private readonly memoryUpdates: MemoryUpdatesService,
		private readonly store: AppUiStoreFacadeService,
		private readonly scene: SceneService,
		private readonly prefs: PreferencesService,
	) {
		this.init();
		window['mercenariesOutOfCombatStore'] = this.store$;
	}

	private async processEvent(changes: MemoryUpdate, currentScene: SceneMode): Promise<void> {
		try {
			let state = this.internalStore$.value;
			for (const parser of this.parsers) {
				state = await parser.parse(state, changes, currentScene);
			}
			if (state !== this.internalStore$.value) {
				this.internalStore$.next(state);
			}
		} catch (e) {
			console.error('[mercenaries-ooc-store] could not process event', e);
		}
	}

	private async emitState(
		newState: MercenariesOutOfCombatState,
		// currentScene: SceneMode,
		// preferences: Preferences,
	): Promise<void> {
		this.eventEmitters.forEach((emitter) => emitter(newState));
		console.debug('[mercenaries-ooc-store] emitting new state', newState);
	}

	private async init() {
		this.registerParser();
		this.buildEventEmitters();

		// So that we're sure that all services have been initialized
		await this.store.initComplete();
		await this.scene.isReady();
		await this.prefs.isReady();

		combineLatest([this.memoryUpdates.memoryUpdates$$, this.scene.currentScene$$])
			.pipe(
				distinctUntilChanged(),
				filter(([changes, currentScene]) => !!changes),
				concatMap(async ([changes, currentScene]) => await this.processEvent(changes, currentScene)),
			)
			.subscribe();
		combineLatest([this.internalStore$.asObservable()]).subscribe(
			async ([newState]) => await this.emitState(newState),
		);
		// });
	}

	private buildEventEmitters() {
		const result = [(state: MercenariesOutOfCombatState) => this.store$.next(state)];
		this.eventEmitters = result;
	}

	private registerParser() {
		this.parsers = [new MercenariesTreasureSelectionParser()];
	}
}
