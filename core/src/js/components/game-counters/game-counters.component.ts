import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
} from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../models/decktracker/game-state';
import { CardsFacadeService } from '../../services/cards-facade.service';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
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
			[ngClass]="{ 'isBgs': isBgs }"
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
export class GameCountersComponent extends AbstractSubscriptionComponent implements AfterContentInit, AfterViewInit {
	activeCounter: CounterType;
	side: 'player' | 'opponent';
	isBgs: boolean;

	definition$: Observable<CounterDefinition>;

	private windowId: string;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
		private readonly init_DebugService: DebugService,
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		const nativeElement = el.nativeElement;
		this.activeCounter = nativeElement.getAttribute('counter');
		this.side = nativeElement.getAttribute('side');
		this.isBgs = this.activeCounter.includes('bgs');
		console.log('init counter', this.activeCounter, this.side, this.isBgs);
	}

	ngAfterContentInit() {
		// For some reason, declaring this in ngAfterViewInit doesn't work - the obevrsable is never subscribed
		if (!this.isBgs) {
			this.definition$ = this.store
				.listenDeckState$((state) => state)
				.pipe(
					tap((info) => console.debug('info', info)),
					filter(([state]) => !!state),
					map(([state]) => this.buildDefinition(state, this.activeCounter, this.side)),
					tap((info) => console.debug('def', info)),
					distinctUntilChanged(),
					tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
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
					tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
					tap((filter) => cdLog('emitting definition in ', this.constructor.name, filter)),
					takeUntil(this.destroyed$),
				);
		}
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		await this.restoreWindowPosition();
	}

	@HostListener('mousedown')
	dragMove() {
		this.ow.dragMove(this.windowId, async (result) => {
			const window = await this.ow.getCurrentWindow();
			if (!window) {
				return;
			}
			this.prefs.updateCounterPosition(this.activeCounter, this.side, window.left, window.top);
		});
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
				return BolnerHammerbeakIndicator.create(gameState, side, this.allCards);
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

	private async restoreWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const gameHeight = gameInfo.logicalHeight;

		const trackerPosition = await this.prefs.getCounterPosition(this.activeCounter, this.side);
		const newLeft = Math.min(
			gameWidth - 100,
			Math.max(0, (trackerPosition && trackerPosition.left) || (await this.getDefaultLeft())),
		);
		const newTop = Math.min(
			gameHeight - 100,
			Math.max(0, (trackerPosition && trackerPosition.top) || (await this.getDefaultTop())),
		);
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}

	private async getDefaultLeft() {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (this.activeCounter === 'attack') {
			return gameInfo.logicalWidth * 0.5 + gameInfo.logicalHeight * 0.16;
		} else {
			const offset = this.activeCounter === 'galakrond' ? 0 : 150;
			return gameInfo.logicalWidth * 0.5 + gameInfo.logicalHeight * 0.2 + offset;
		}
	}

	private async getDefaultTop() {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (this.side === 'player') {
			if (this.activeCounter === 'attack') {
				return gameInfo.logicalHeight * 0.65;
			} else {
				return gameInfo.logicalHeight * 0.7;
			}
		} else {
			if (this.activeCounter === 'attack') {
				return gameInfo.logicalHeight * 0.1;
			} else {
				return gameInfo.logicalHeight * 0.1;
			}
		}
	}
}
