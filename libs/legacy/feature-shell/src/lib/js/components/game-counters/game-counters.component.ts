import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbyssalCurseCounterDefinition } from '@components/game-counters/definitions/abyssal-curse-counter';
import { AnachronosCounterDefinition } from '@components/game-counters/definitions/anachronos-counter';
import { AsvedonCounterDefinition } from '@components/game-counters/definitions/asvedon-counter';
import { BgsMajordomoCounterDefinition } from '@components/game-counters/definitions/bgs-majordomo-counter';
import { BgsSouthseaStrongarmCounterDefinition } from '@components/game-counters/definitions/bgs-southsea-strongarm-counter';
import { BonelordFrostwhisperCounterDefinition } from '@components/game-counters/definitions/bonelord-frostwhisper-counter';
import { CoralKeeperCounterDefinition } from '@components/game-counters/definitions/coral-keeper-counter';
import { GreySageParrotCounterDefinition } from '@components/game-counters/definitions/grey-sage-parrot-counter';
import { ShockspitterCounterDefinition } from '@components/game-counters/definitions/shockspitter-counter';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../models/decktracker/game-state';
import { DebugService } from '../../services/debug.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';
import { AttackCounterDefinition } from './definitions/attack-counter';
import { BgsMagmalocCounterDefinition } from './definitions/bgs-magmaloc-counter';
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
import { LadyDarkveinCounterDefinition } from './definitions/lady-darkvein-counter';
import { LibramCounterDefinition } from './definitions/libram-counter';
import { MonstrousParrotCounterDefinition } from './definitions/monstrous-parrot-counter';
import { MulticasterCounterDefinition } from './definitions/multicaster-counter';
import { MurozondTheInfiniteCounterDefinition } from './definitions/murozond-the-infinite-counter';
import { OverdraftCounterDefinition } from './definitions/overdraft-counter';
import { ParrotMascotCounterDefinition } from './definitions/parrot-mascot-counter';
import { PogoCounterDefinition } from './definitions/pogo-counter';
import { QueensguardCounterDefinition } from './definitions/queensguard-counter';
import { RelicCounterDefinition } from './definitions/relic-counter';
import { Si7CounterDefinition } from './definitions/si7-counter';
import { SpectralPillagerCounterDefinition } from './definitions/spectral-pillager-counter';
import { SpellCounterDefinition } from './definitions/spell-counter';
import { VanessaVanCleefCounterDefinition } from './definitions/vanessa-vancleef-counter';
import { VolatileSkeletonCounterDefinition } from './definitions/volatile-skeleton-counter';
import { WatchpostCounterDefinition } from './definitions/watchpost-counter';
import { CounterDefinition, CounterType } from './definitions/_counter-definition';

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
			></generic-counter>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCountersComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	@Input() activeCounter: CounterType;
	@Input() side: 'player' | 'opponent';

	definition$: Observable<CounterDefinition>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly init_DebugService: DebugService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
		// this.isBgs = this.activeCounter.includes('bgs');
		// console.log('init counter', this.activeCounter, this.side, this.activeCounter?.includes('bgs'));
	}

	ngAfterContentInit() {
		if (!this.activeCounter?.includes('bgs')) {
			this.definition$ = this.store
				.listenDeckState$((state) => state)
				.pipe(
					filter(([state]) => !!state),
					this.mapData(([state]) => this.buildDefinition(state, this.activeCounter, this.side)),
				);
		} else {
			this.definition$ = combineLatest(
				this.store.listenBattlegrounds$(([state, prefs]) => state),
				this.store.listenDeckState$((state) => state),
			).pipe(
				filter(([[bgState], [deckState]]) => !!bgState && !!deckState),
				this.mapData(([[bgState], [deckState]]) =>
					this.buildBgsDefinition(bgState, this.activeCounter, deckState, this.side),
				),
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
			case 'abyssalCurse':
				return AbyssalCurseCounterDefinition.create(gameState, side, this.i18n);
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
			case 'volatileSkeleton':
				return VolatileSkeletonCounterDefinition.create(gameState, side, this.i18n);
			case 'relic':
				return RelicCounterDefinition.create(gameState, side, this.i18n);
			case 'bolner':
				return BolnerHammerbeakIndicator.create(gameState, side, this.allCards, this.i18n);
			case 'brilliantMacaw':
				return BrilliantMacawCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'monstrousParrot':
				return MonstrousParrotCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'vanessaVanCleef':
				return VanessaVanCleefCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'overdraft':
				return OverdraftCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'asvedon':
				return AsvedonCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'murozondTheInfinite':
				return MurozondTheInfiniteCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'anachronos':
				return AnachronosCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'bonelordFrostwhisper':
				return BonelordFrostwhisperCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'parrotMascot':
				return ParrotMascotCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'queensguard':
				return QueensguardCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'spectralPillager':
				return SpectralPillagerCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'ladyDarkvein':
				return LadyDarkveinCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'greySageParrot':
				return GreySageParrotCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'multicaster':
				return MulticasterCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'coralKeeper':
				return CoralKeeperCounterDefinition.create(gameState, side, this.allCards, this.i18n);
			case 'heroPowerDamage':
				return HeroPowerDamageCounterDefinition.create(gameState, side, this.i18n);
			case 'shockspitter':
				return ShockspitterCounterDefinition.create(gameState, side, this.i18n);
			case 'si7Counter':
				return Si7CounterDefinition.create(gameState, side, this.allCards, this.i18n);
			default:
				console.error('unexpected activeCounter for non-bgs', activeCounter);
		}
	}

	private buildBgsDefinition(
		gameState: BattlegroundsState,
		activeCounter: CounterType,
		deckState: GameState,
		side: string,
	): CounterDefinition {
		switch (activeCounter) {
			case 'bgsPogo':
				return BgsPogoCounterDefinition.create(gameState, side, this.i18n);
			case 'bgsSouthsea':
				return BgsSouthseaStrongarmCounterDefinition.create(
					gameState,
					side,
					deckState,
					this.allCards,
					this.i18n,
				);
			case 'bgsMagmaloc':
				return BgsMagmalocCounterDefinition.create(gameState, side, deckState, this.allCards, this.i18n);
			case 'bgsMajordomo':
				return BgsMajordomoCounterDefinition.create(gameState, side, deckState, this.allCards, this.i18n);
			default:
				console.warn('unexpected activeCounter for bgs', activeCounter);
		}
	}
}
