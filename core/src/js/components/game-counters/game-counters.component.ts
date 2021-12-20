import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../models/decktracker/game-state';
import { CardsFacadeService } from '../../services/cards-facade.service';
import { DebugService } from '../../services/debug.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { OverwolfService } from '../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';
import { AttackCounterDefinition } from './definitions/attack-counter';
import { BgsPogoCounterDefinition } from './definitions/bgs-pogo-counter';
import { BolnerHammerbeakIndicator } from './definitions/bolner-hammerbeak-indicator';
import { CthunCounterDefinition } from './definitions/cthun-counter';
import { ElementalCounterDefinition } from './definitions/elemental-counter';
import { ElwynnBoarCounterDefinition } from './definitions/elwynn-boar-counter';
import { FatigueCounterDefinition } from './definitions/fatigue-counter';
import { GalakrondCounterDefinition } from './definitions/galakrond-counter';
import { HeroPowerDamageCounterDefinition } from './definitions/hero-power-damage-counter';
import { JadeCounterDefinition } from './definitions/jade-counter';
import { LibramCounterDefinition } from './definitions/libram-counter';
import { PogoCounterDefinition } from './definitions/pogo-counter';
import { SpellCounterDefinition } from './definitions/spell-counter';
import { WatchpostCounterDefinition } from './definitions/watchpost-counter';
import { CounterDefinition, CounterType } from './definitions/_counter-definition';

@Component({
	selector: 'game-counters',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		`../../../css/themes/decktracker-theme.scss`,
		'../../../css/component/game-counters/game-counters.component.scss',
	],
	template: `
		<div
			class="root overlay-container-parent"
			[ngClass]="{ 'isBgs': activeCounter?.includes('bgs') }"
			[activeTheme]="'decktracker'"
			*ngIf="definition$ | async as definition"
		>
			<generic-counter
				*ngIf="activeCounter === definition?.type"
				[image]="definition.image"
				[helpTooltipText]="definition.tooltip"
				[value]="definition.value"
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
					tap((info) => console.debug('info', info)),
					filter(([state]) => !!state),
					map(([state]) => this.buildDefinition(state, this.activeCounter, this.side)),
					tap((info) => console.debug('def', info)),
					distinctUntilChanged(),
					tap((filter) =>
						setTimeout(() => {
							if (!(this.cdr as ViewRef)?.destroyed) {
								this.cdr.detectChanges();
							}
						}, 0),
					),
					tap((filter) => cdLog('emitting definition in ', this.constructor.name, filter)),
					takeUntil(this.destroyed$),
				);
			console.debug('built def', this.definition$);
		} else {
			this.definition$ = this.store
				.listenBattlegrounds$(([state, prefs]) => state)
				.pipe(
					filter(([state]) => !!state),
					map(([state]) => this.buildBgsDefinition(state, this.activeCounter, this.side)),
					distinctUntilChanged(),
					tap((filter) =>
						setTimeout(() => {
							if (!(this.cdr as ViewRef)?.destroyed) {
								this.cdr.detectChanges();
							}
						}, 0),
					),
					tap((filter) => cdLog('emitting definition in ', this.constructor.name, filter)),
					takeUntil(this.destroyed$),
				);
		}
	}

	private buildDefinition(gameState: GameState, activeCounter: CounterType, side: string): CounterDefinition {
		switch (activeCounter) {
			case 'galakrond':
				return GalakrondCounterDefinition.create(gameState, side);
			case 'jadeGolem':
				return JadeCounterDefinition.create(gameState, side);
			case 'cthun':
				return CthunCounterDefinition.create(gameState, side);
			case 'fatigue':
				return FatigueCounterDefinition.create(gameState, side);
			case 'attack':
				return AttackCounterDefinition.create(gameState, side);
			case 'pogo':
				return PogoCounterDefinition.create(gameState, side);
			case 'spells':
				return SpellCounterDefinition.create(gameState, side);
			case 'elemental':
				return ElementalCounterDefinition.create(gameState, side);
			case 'watchpost':
				return WatchpostCounterDefinition.create(gameState, side);
			case 'libram':
				return LibramCounterDefinition.create(gameState, side);
			case 'elwynn-boar':
				return ElwynnBoarCounterDefinition.create(gameState, side);
			case 'bolner':
				return BolnerHammerbeakIndicator.create(gameState, side, this.allCards, this.i18n);
			case 'hero-power-damage':
				return HeroPowerDamageCounterDefinition.create(gameState, side);
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
				return BgsPogoCounterDefinition.create(gameState, side);
			default:
				console.warn('unexpected activeCounter for bgs', activeCounter);
		}
	}
}
