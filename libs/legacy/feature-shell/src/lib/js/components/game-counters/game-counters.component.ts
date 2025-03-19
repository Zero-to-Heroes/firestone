import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CounterType, GameState, GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, combineLatest, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { deepEqual } from '../../services/utils';
import { CounterDefinition } from './definitions/_counter-definition';
import { AstralAutomatonCounterDefinition } from './definitions/astral-automaton-counter';
import { AttackCounterDefinition } from './definitions/attack-counter';
import { BgsBloodGemCounterDefinition } from './definitions/bgs-blood-gem-counter';
import { BgsLordOfGainsCounterDefinition } from './definitions/bgs-lord-of-gains-counter';
import { BgsMagmalocCounterDefinition } from './definitions/bgs-magmaloc-counter';
import { BgsMajordomoCounterDefinition } from './definitions/bgs-majordomo-counter';
import { BgsPogoCounterDefinition } from './definitions/bgs-pogo-counter';
import { BgsSouthseaStrongarmCounterDefinition } from './definitions/bgs-southsea-strongarm-counter';
import { BgsTuskarrRaiderCounterDefinition } from './definitions/bgs-tuskarr-raider-counter';
import { GalakrondCounterDefinition } from './definitions/galakrond-counter';
import { JadeCounterDefinition } from './definitions/jade-counter';
import { PogoCounterDefinition } from './definitions/pogo-counter';
import { Si7CounterDefinition } from './definitions/si7-counter';
import { WatchpostCounterDefinition } from './definitions/watchpost-counter';

@Component({
	selector: 'game-counters',
	styleUrls: ['../../../css/component/game-counters/game-counters.component.scss'],
	template: `
		<div
			class="root"
			[ngClass]="{ isBgs: activeCounter?.includes('bgs') }"
			[activeTheme]="'decktracker'"
			*ngIf="definition$ | async as definition"
		>
			<generic-counter
				*ngIf="activeCounter === definition?.type"
				[image]="definition.image"
				[helpTooltipText]="definition.tooltip"
				[value]="definition.value"
				[valueImg]="definition.valueImg"
				[counterClass]="definition.cssClass"
				[standardCounter]="definition.standardCounter"
				[cardTooltip]=""
				[cardTooltipRelatedCardIds]="definition.cardTooltips"
				[side]="side"
			></generic-counter>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCountersComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() activeCounter: CounterType;
	@Input() side: 'player' | 'opponent';

	definition$: Observable<NonFunctionProperties<CounterDefinition<any, any>>>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateFacadeService,
		private readonly bgsState: BgsStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.prefs.isReady(), this.gameState.isReady(), this.bgsState.isReady()]);

		if (!this.activeCounter?.includes('bgs')) {
			const definition = await this.buildDefinition(this.activeCounter, this.side);
			this.definition$ = combineLatest([this.gameState.gameState$$, definition.prefValue$ ?? of(null)]).pipe(
				filter(([state, prefValue]) => !!state),
				map(([state, prefValue]) => ({
					counterInfo: definition.select(state),
					prefValue: prefValue,
				})),
				filter((info) => info?.counterInfo != null),
				this.mapData(
					(info) => definition.emit(info.counterInfo, info.prefValue),
					// Because counters often return an object
					(a, b) => deepEqual(a, b),
				),
			);
		} else {
			const definition = await this.buildBgsDefinition(this.activeCounter, this.side);
			// TODO: have each definition define what it listens to, instead of recomputing
			// everything each time
			this.definition$ = combineLatest([
				this.bgsState.gameState$$,
				this.gameState.gameState$$,
				definition.prefValue$ ?? of(null),
			]).pipe(
				filter(([bgState, deckState, prefValue]) => !!bgState && !!deckState),
				filter(
					([bgState, deckState, prefValue]) =>
						!definition.filter || definition.filter({ bgState, deckState }),
				),
				map(([bgState, deckState, prefValue]) => ({
					counterInfo: definition.select({ deckState, bgState }),
					prefValue: prefValue,
				})),
				filter((info) => info?.counterInfo != null),
				this.mapData(
					(info) => definition.emit(info.counterInfo, info.prefValue),
					// Because counters often return an object
					(a, b) => deepEqual(a, b),
				),
			);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async buildDefinition(
		activeCounter: CounterType,
		side: 'player' | 'opponent',
	): Promise<CounterDefinition<GameState, any>> {
		switch (activeCounter) {
			case 'galakrond':
				return GalakrondCounterDefinition.create(side, this.allCards, this.i18n);
			case 'jadeGolem':
				return JadeCounterDefinition.create(side, this.allCards, this.i18n);
			case 'attack':
				return AttackCounterDefinition.create(side, this.allCards, this.i18n);
			case 'pogo':
				return PogoCounterDefinition.create(side, this.allCards, this.i18n);
			case 'astralAutomaton':
				return AstralAutomatonCounterDefinition.create(side, this.allCards, this.i18n);
			case 'watchpost':
				return WatchpostCounterDefinition.create(side, this.allCards, this.i18n);
			case 'si7Counter':
				return Si7CounterDefinition.create(side, this.allCards, this.i18n);
			default:
				console.error('unexpected activeCounter for non-bgs', activeCounter);
		}
	}

	private async buildBgsDefinition(
		activeCounter: CounterType,
		side: 'player' | 'opponent',
	): Promise<CounterDefinition<{ deckState: GameState; bgState: BattlegroundsState }, any>> {
		switch (activeCounter) {
			case 'bgsPogo':
				return BgsPogoCounterDefinition.create(side, this.allCards, this.i18n);
			case 'bgsSouthsea':
				return BgsSouthseaStrongarmCounterDefinition.create(side, this.allCards, this.i18n);
			case 'bgsMagmaloc':
				return BgsMagmalocCounterDefinition.create(side, this.allCards, this.i18n);
			case 'bgsBloodGem':
				return BgsBloodGemCounterDefinition.create(side, this.allCards, this.i18n);
			case 'bgsMajordomo':
				return BgsMajordomoCounterDefinition.create(side, this.allCards, this.i18n);
			case 'bgsLordOfGains':
				return BgsLordOfGainsCounterDefinition.create(side, this.allCards, this.i18n, this.prefs);
			case 'bgsTuskarrRaider':
				return BgsTuskarrRaiderCounterDefinition.create(side, this.allCards, this.i18n, this.prefs);
			default:
				console.warn('unexpected activeCounter for bgs', activeCounter);
				return null;
		}
	}
}
