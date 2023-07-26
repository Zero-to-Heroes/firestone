import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../models/decktracker/game-state';
import { DebugService } from '../../services/debug.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';
import { CounterDefinition, CounterType } from './definitions/_counter-definition';
import { AbyssalCurseCounterDefinition } from './definitions/abyssal-curse-counter';
import { AnachronosCounterDefinition } from './definitions/anachronos-counter';
import { AsvedonCounterDefinition } from './definitions/asvedon-counter';
import { AttackCounterDefinition } from './definitions/attack-counter';
import { BgsMagmalocCounterDefinition } from './definitions/bgs-magmaloc-counter';
import { BgsMajordomoCounterDefinition } from './definitions/bgs-majordomo-counter';
import { BgsPogoCounterDefinition } from './definitions/bgs-pogo-counter';
import { BgsSouthseaStrongarmCounterDefinition } from './definitions/bgs-southsea-strongarm-counter';
import { BolnerHammerbeakIndicator } from './definitions/bolner-hammerbeak-indicator';
import { BonelordFrostwhisperCounterDefinition } from './definitions/bonelord-frostwhisper-counter';
import { BrilliantMacawCounterDefinition } from './definitions/brilliant-macaw-counter';
import { CorpseSpentCounterDefinition } from './definitions/corpse-spent-counter';
import { CthunCounterDefinition } from './definitions/cthun-counter';
import { ElementalCounterDefinition } from './definitions/elemental-counter';
import { ElwynnBoarCounterDefinition } from './definitions/elwynn-boar-counter';
import { FatigueCounterDefinition } from './definitions/fatigue-counter';
import { GalakrondCounterDefinition } from './definitions/galakrond-counter';
import { GreySageParrotCounterDefinition } from './definitions/grey-sage-parrot-counter';
import { HeroPowerDamageCounterDefinition } from './definitions/hero-power-damage-counter';
import { JadeCounterDefinition } from './definitions/jade-counter';
import { LadyDarkveinCounterDefinition } from './definitions/lady-darkvein-counter';
import { LibramCounterDefinition } from './definitions/libram-counter';
import { LightrayCounterDefinition } from './definitions/lightray-counter';
import { MenagerieCounterDefinition } from './definitions/menagerie-counter';
import { MonstrousParrotCounterDefinition } from './definitions/monstrous-parrot-counter';
import { MulticasterCounterDefinition } from './definitions/multicaster-counter';
import { MurozondTheInfiniteCounterDefinition } from './definitions/murozond-the-infinite-counter';
import { NagaGiantCounterDefinition } from './definitions/naga-giant-counter';
import { OverdraftCounterDefinition } from './definitions/overdraft-counter';
import { ParrotMascotCounterDefinition } from './definitions/parrot-mascot-counter';
import { PogoCounterDefinition } from './definitions/pogo-counter';
import { QueensguardCounterDefinition } from './definitions/queensguard-counter';
import { RelicCounterDefinition } from './definitions/relic-counter';
import { ShockspitterCounterDefinition } from './definitions/shockspitter-counter';
import { Si7CounterDefinition } from './definitions/si7-counter';
import { SpectralPillagerCounterDefinition } from './definitions/spectral-pillager-counter';
import { SpellCounterDefinition } from './definitions/spell-counter';
import { VanessaVanCleefCounterDefinition } from './definitions/vanessa-vancleef-counter';
import { VolatileSkeletonCounterDefinition } from './definitions/volatile-skeleton-counter';
import { WatchpostCounterDefinition } from './definitions/watchpost-counter';
import { AstralAutomatonCounterDefinition } from './definitions/astral-automaton-counter';

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

	definition$: Observable<NonFunctionProperties<CounterDefinition<any, any>>>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly init_DebugService: DebugService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		if (!this.activeCounter?.includes('bgs')) {
			const definition = this.buildDefinition(this.activeCounter, this.side);
			this.definition$ = this.store
				.listenDeckState$((state) => state)
				.pipe(
					filter(([state]) => !!state),
					map(([state]) => definition.select(state)),
					filter((info) => info != null),
					this.mapData(
						(info) => definition.emit(info),
						// Because counters often return an object
						(a, b) => deepEqual(a, b),
					),
				);
		} else {
			const definition = this.buildBgsDefinition(this.activeCounter, this.side);
			// TODO: have each definition define what it listens to, instead of recomputing
			// everything each time
			this.definition$ = combineLatest([
				this.store.listenBattlegrounds$(([state, prefs]) => state),
				this.store.listenDeckState$((state) => state),
			]).pipe(
				filter(([[bgState], [deckState]]) => !!bgState && !!deckState),
				map(([[bgState], [deckState]]) => definition.select({ bgState, deckState })),
				filter((info) => info != null),
				this.mapData(
					(info) => definition.emit(info),
					// Because counters often return an object
					(a, b) => deepEqual(a, b),
				),
			);
		}
	}

	private buildDefinition(
		activeCounter: CounterType,
		side: 'player' | 'opponent',
	): CounterDefinition<GameState, any> {
		switch (activeCounter) {
			case 'galakrond':
				return GalakrondCounterDefinition.create(side, this.allCards, this.i18n);
			case 'jadeGolem':
				return JadeCounterDefinition.create(side, this.allCards, this.i18n);
			case 'cthun':
				return CthunCounterDefinition.create(side, this.allCards, this.i18n);
			case 'fatigue':
				return FatigueCounterDefinition.create(side, this.allCards, this.i18n);
			case 'abyssalCurse':
				return AbyssalCurseCounterDefinition.create(side, this.allCards, this.i18n);
			case 'attack':
				return AttackCounterDefinition.create(side, this.allCards, this.i18n);
			case 'pogo':
				return PogoCounterDefinition.create(side, this.allCards, this.i18n);
			case 'astralAutomaton':
				return AstralAutomatonCounterDefinition.create(side, this.allCards, this.i18n);
			case 'spells':
				return SpellCounterDefinition.create(side, this.allCards, this.i18n);
			case 'elemental':
				return ElementalCounterDefinition.create(side, this.allCards, this.i18n);
			case 'watchpost':
				return WatchpostCounterDefinition.create(side, this.allCards, this.i18n);
			case 'libram':
				return LibramCounterDefinition.create(side, this.allCards, this.i18n);
			case 'elwynnBoar':
				return ElwynnBoarCounterDefinition.create(side, this.allCards, this.i18n);
			case 'volatileSkeleton':
				return VolatileSkeletonCounterDefinition.create(side, this.allCards, this.i18n);
			case 'relic':
				return RelicCounterDefinition.create(side, this.allCards, this.i18n);
			case 'bolner':
				return BolnerHammerbeakIndicator.create(side, this.allCards, this.i18n);
			case 'brilliantMacaw':
				return BrilliantMacawCounterDefinition.create(side, this.allCards, this.i18n);
			case 'monstrousParrot':
				return MonstrousParrotCounterDefinition.create(side, this.allCards, this.i18n);
			case 'vanessaVanCleef':
				return VanessaVanCleefCounterDefinition.create(side, this.allCards, this.i18n);
			case 'lightray':
				return LightrayCounterDefinition.create(side, this.allCards, this.i18n);
			case 'menagerie':
				return MenagerieCounterDefinition.create(side, this.allCards, this.i18n);
			case 'corpseSpent':
				return CorpseSpentCounterDefinition.create(side, this.allCards, this.i18n);
			case 'overdraft':
				return OverdraftCounterDefinition.create(side, this.allCards, this.i18n);
			case 'asvedon':
				return AsvedonCounterDefinition.create(side, this.allCards, this.i18n);
			case 'murozondTheInfinite':
				return MurozondTheInfiniteCounterDefinition.create(side, this.allCards, this.i18n);
			case 'nagaGiant':
				return NagaGiantCounterDefinition.create(side, this.allCards, this.i18n);
			case 'anachronos':
				return AnachronosCounterDefinition.create(side, this.allCards, this.i18n);
			case 'bonelordFrostwhisper':
				return BonelordFrostwhisperCounterDefinition.create(side, this.allCards, this.i18n);
			case 'parrotMascot':
				return ParrotMascotCounterDefinition.create(side, this.allCards, this.i18n);
			case 'queensguard':
				return QueensguardCounterDefinition.create(side, this.allCards, this.i18n);
			case 'spectralPillager':
				return SpectralPillagerCounterDefinition.create(side, this.allCards, this.i18n);
			case 'ladyDarkvein':
				return LadyDarkveinCounterDefinition.create(side, this.allCards, this.i18n);
			case 'greySageParrot':
				return GreySageParrotCounterDefinition.create(side, this.allCards, this.i18n);
			case 'multicaster':
				return MulticasterCounterDefinition.create(side, this.allCards, this.i18n);
			case 'heroPowerDamage':
				return HeroPowerDamageCounterDefinition.create(side, this.allCards, this.i18n);
			case 'shockspitter':
				return ShockspitterCounterDefinition.create(side, this.allCards, this.i18n);
			case 'si7Counter':
				return Si7CounterDefinition.create(side, this.allCards, this.i18n);
			default:
				console.error('unexpected activeCounter for non-bgs', activeCounter);
		}
	}

	private buildBgsDefinition(
		activeCounter: CounterType,
		side: 'player' | 'opponent',
	): CounterDefinition<{ deckState: GameState; bgState: BattlegroundsState }, any> {
		switch (activeCounter) {
			case 'bgsPogo':
				return BgsPogoCounterDefinition.create(side, this.allCards, this.i18n);
			case 'bgsSouthsea':
				return BgsSouthseaStrongarmCounterDefinition.create(side, this.allCards, this.i18n);
			case 'bgsMagmaloc':
				return BgsMagmalocCounterDefinition.create(side, this.allCards, this.i18n);
			case 'bgsMajordomo':
				return BgsMajordomoCounterDefinition.create(side, this.allCards, this.i18n);
			default:
				console.warn('unexpected activeCounter for bgs', activeCounter);
				return null;
		}
	}
}
