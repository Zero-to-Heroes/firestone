import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../models/decktracker/game-state';
import { CardsFacadeService } from '../../services/cards-facade.service';
import { DebugService } from '../../services/debug.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { OverwolfService } from '../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';
import { AttackCounterDefinition } from './definitions/attack-counter';
import { BgsPogoCounterDefinition } from './definitions/bgs-pogo-counter';
import { BolnerHammerbeakIndicator } from './definitions/bolner-hammerbeak-indicator';
import { BrilliantMacawCounterDefinition } from './definitions/brilliant-macaw-counter';
import { CthunCounterDefinition } from './definitions/cthun-counter';
import { ElementalCounterDefinition } from './definitions/elemental-counter';
import { ElwynnBoarCounterDefinition } from './definitions/elwynn-boar-counter';
import { FatigueCounterDefinition } from './definitions/fatigue-counter';
import { GalakrondCounterDefinition } from './definitions/galakrond-counter';
import { HeroPowerDamageCounterDefinition } from './definitions/hero-power-damage-counter';
import { JadeCounterDefinition } from './definitions/jade-counter';
import { LibramCounterDefinition } from './definitions/libram-counter';
import { MulticasterCounterDefinition } from './definitions/multicaster-counter';
import { PogoCounterDefinition } from './definitions/pogo-counter';
import { Si7CounterDefinition } from './definitions/si7-counter';
import { SpellCounterDefinition } from './definitions/spell-counter';
import { WatchpostCounterDefinition } from './definitions/watchpost-counter';
import { CounterDefinition, CounterType } from './definitions/_counter-definition';

@Component({
	selector: 'game-counters',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/game-counters/game-counters.component.scss',
	],
	template: `
		<div
			class="root"
			[ngClass]="{ 'isBgs': activeCounter?.includes('bgs') }"
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
			></generic-counter>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCountersComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() activeCounter: CounterType;
	@Input() side: 'player' | 'opponent';

	definition$: Observable<CounterDefinition>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly init_DebugService: DebugService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		// this.isBgs = this.activeCounter.includes('bgs');
		console.log('init counter', this.activeCounter, this.side, this.activeCounter?.includes('bgs'));
	}

	ngAfterContentInit() {
		// For some reason, declaring this in ngAfterViewInit doesn't work - the obevrsable is never subscribed
		if (!this.activeCounter?.includes('bgs')) {
			this.definition$ = this.store
				.listenDeckState$((state) => state)
				.pipe(
					tap((info) => this.activeCounter === 'brilliantMacaw' && console.debug('info', info)),
					filter(([state]) => !!state),
					this.mapData(([state]) => this.buildDefinition(state, this.activeCounter, this.side)),
				);
			console.debug('built def', this.definition$);
		} else {
			this.definition$ = this.store
				.listenBattlegrounds$(([state, prefs]) => state)
				.pipe(
					filter(([state]) => !!state),
					this.mapData(([state]) => this.buildBgsDefinition(state, this.activeCounter, this.side)),
				);
		}
	}

	private buildDefinition(
		gameState: GameState,
		activeCounter: CounterType,
		side: 'player' | 'opponent',
	): CounterDefinition {
		switch (activeCounter) {
			case 'galakrond':
				return GalakrondCounterDefinition.create(gameState, side, this.i18n);
			case 'jadeGolem':
				return JadeCounterDefinition.create(gameState, side, this.i18n);
			case 'cthun':
				return CthunCounterDefinition.create(gameState, side, this.i18n);
			case 'fatigue':
				return FatigueCounterDefinition.create(gameState, side, this.i18n);
			case 'attack':
				return AttackCounterDefinition.create(gameState, side, this.i18n);
			case 'pogo':
				return PogoCounterDefinition.create(gameState, side, this.i18n);
			case 'spells':
				return SpellCounterDefinition.create(gameState, side, this.i18n);
			case 'elemental':
				return ElementalCounterDefinition.create(gameState, side, this.i18n);
			case 'watchpost':
				return WatchpostCounterDefinition.create(gameState, side, this.i18n);
			case 'libram':
				return LibramCounterDefinition.create(gameState, side, this.i18n);
			case 'elwynnBoar':
				return ElwynnBoarCounterDefinition.create(gameState, side, this.i18n);
			case 'bolner':
				return BolnerHammerbeakIndicator.create(gameState, side, this.allCards, this.i18n);
			case 'brilliantMacaw':
				return BrilliantMacawCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'multicaster':
				return MulticasterCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'heroPowerDamage':
				return HeroPowerDamageCounterDefinition.create(gameState, side, this.i18n);
			case 'si7Counter':
				return Si7CounterDefinition.create(gameState, side, this.allCards, this.i18n);
			default:
				console.error('unexpected activeCounter for non-bgs', activeCounter);
		}
	}

	private buildBgsDefinition(
		gameState: BattlegroundsState,
		activeCounter: CounterType,
		side: string,
	): CounterDefinition {
		switch (activeCounter) {
			case 'bgsPogo':
				return BgsPogoCounterDefinition.create(gameState, side, this.i18n);
			default:
				console.warn('unexpected activeCounter for bgs', activeCounter);
		}
	}
}
