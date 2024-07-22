import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BattlegroundsState, BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { GameState, GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, combineLatest, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { deepEqual } from '../../services/utils';
import { CounterDefinition, CounterType } from './definitions/_counter-definition';
import { AbyssalCurseCounterDefinition } from './definitions/abyssal-curse-counter';
import { AnachronosCounterDefinition } from './definitions/anachronos-counter';
import { AstralAutomatonCounterDefinition } from './definitions/astral-automaton-counter';
import { AsvedonCounterDefinition } from './definitions/asvedon-counter';
import { AttackCounterDefinition } from './definitions/attack-counter';
import { BgsBloodGemCounterDefinition } from './definitions/bgs-blood-gem-counter';
import { BgsGoldDeltaCounterDefinition } from './definitions/bgs-delta-gold-counter';
import { BgsLordOfGainsCounterDefinition } from './definitions/bgs-lord-of-gains-counter';
import { BgsMagmalocCounterDefinition } from './definitions/bgs-magmaloc-counter';
import { BgsMajordomoCounterDefinition } from './definitions/bgs-majordomo-counter';
import { BgsPogoCounterDefinition } from './definitions/bgs-pogo-counter';
import { BgsSouthseaStrongarmCounterDefinition } from './definitions/bgs-southsea-strongarm-counter';
import { BolnerHammerbeakIndicator } from './definitions/bolner-hammerbeak-indicator';
import { BonelordFrostwhisperCounterDefinition } from './definitions/bonelord-frostwhisper-counter';
import { BrilliantMacawCounterDefinition } from './definitions/brilliant-macaw-counter';
import { CardsDrawnCounterDefinition } from './definitions/cards-drawn-counter';
import { CardsPlayedFromAnotherClassCounterDefinition } from './definitions/cards-played-from-another-class-counter';
import { ChainedGuardianCounterDefinition } from './definitions/chained-guardian-counter';
import { ChaoticTendrilCounterDefinition } from './definitions/chaotic-tendril-counter';
import { CorpseSpentCounterDefinition } from './definitions/corpse-spent-counter';
import { CthunCounterDefinition } from './definitions/cthun-counter';
import { DragonsSummonedCounterDefinition } from './definitions/dragons-summoned-counter';
import { EarthenGolemCounterDefinition } from './definitions/earthen-golem-counter';
import { ElementalCounterDefinition } from './definitions/elemental-counter';
import { ElementalStreakCounterDefinition } from './definitions/elemental-streak-counter';
import { ElwynnBoarCounterDefinition } from './definitions/elwynn-boar-counter';
import { ExcavateCounterDefinition } from './definitions/excavate-counter';
import { FatigueCounterDefinition } from './definitions/fatigue-counter';
import { GalakrondCounterDefinition } from './definitions/galakrond-counter';
import { GardensGraceCounterDefinition } from './definitions/gardens-grace-counter';
import { GreySageParrotCounterDefinition } from './definitions/grey-sage-parrot-counter';
import { HeroPowerDamageCounterDefinition } from './definitions/hero-power-damage-counter';
import { HolySpellsCounterDefinition } from './definitions/holy-spells-counter';
import { JadeCounterDefinition } from './definitions/jade-counter';
import { LadyDarkveinCounterDefinition } from './definitions/lady-darkvein-counter';
import { LibramCounterDefinition } from './definitions/libram-counter';
import { LightrayCounterDefinition } from './definitions/lightray-counter';
import { LocationsUsedCounterDefinition } from './definitions/locations-used-counter';
import { MenagerieCounterDefinition } from './definitions/menagerie-counter';
import { MonstrousParrotCounterDefinition } from './definitions/monstrous-parrot-counter';
import { MulticasterCounterDefinition } from './definitions/multicaster-counter';
import { MurozondTheInfiniteCounterDefinition } from './definitions/murozond-the-infinite-counter';
import { NagaGiantCounterDefinition } from './definitions/naga-giant-counter';
import { OverdraftCounterDefinition } from './definitions/overdraft-counter';
import { ParrotMascotCounterDefinition } from './definitions/parrot-mascot-counter';
import { PiratesSummonedCounterDefinition } from './definitions/pirates-summoned-counter';
import { PogoCounterDefinition } from './definitions/pogo-counter';
import { QueensguardCounterDefinition } from './definitions/queensguard-counter';
import { RelicCounterDefinition } from './definitions/relic-counter';
import { SeaShantyCounterDefinition } from './definitions/sea-shanty-counter';
import { SecretsPlayedCounterDefinition } from './definitions/secrets-played-counter';
import { ShockspitterCounterDefinition } from './definitions/shockspitter-counter';
import { Si7CounterDefinition } from './definitions/si7-counter';
import { SpectralPillagerCounterDefinition } from './definitions/spectral-pillager-counter';
import { SpellCounterDefinition } from './definitions/spell-counter';
import { ThirstyDrifterCounterDefinition } from './definitions/thirsty-drifter-counter';
import { TramHeistCounterDefinition } from './definitions/tram-heist-counter';
import { TreantCounterDefinition } from './definitions/treant-counter';
import { VanessaVanCleefCounterDefinition } from './definitions/vanessa-vancleef-counter';
import { VolatileSkeletonCounterDefinition } from './definitions/volatile-skeleton-counter';
import { WatchpostCounterDefinition } from './definitions/watchpost-counter';
import { WheelOfDeathCounterDefinition } from './definitions/wheel-of-death-counter';

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
			case 'chainedGuardian':
				return ChainedGuardianCounterDefinition.create(side, this.allCards, this.i18n);
			case 'earthenGolem':
				return EarthenGolemCounterDefinition.create(side, this.allCards, this.i18n);
			case 'treant':
				return TreantCounterDefinition.create(side, this.allCards, this.i18n);
			case 'dragonsSummoned':
				return DragonsSummonedCounterDefinition.create(side, this.allCards, this.i18n);
			case 'piratesSummoned':
				return PiratesSummonedCounterDefinition.create(side, this.allCards, this.i18n);
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
			case 'locationsUsed':
				return LocationsUsedCounterDefinition.create(side, this.allCards, this.i18n);
			case 'seaShanty':
				return SeaShantyCounterDefinition.create(side, this.allCards, this.i18n);
			case 'wheelOfDeath':
				return WheelOfDeathCounterDefinition.create(side, this.allCards, this.i18n);
			case 'thirstyDrifter':
				return ThirstyDrifterCounterDefinition.create(side, this.allCards, this.i18n);
			case 'cardsPlayedFromAnotherClass':
				return CardsPlayedFromAnotherClassCounterDefinition.create(side, this.allCards, this.i18n);
			case 'cardsDrawn':
				return CardsDrawnCounterDefinition.create(side, this.allCards, this.i18n);
			case 'elementalStreak':
				return ElementalStreakCounterDefinition.create(side, this.allCards, this.i18n);
			case 'tramHeist':
				return TramHeistCounterDefinition.create(side, this.allCards, this.i18n);
			case 'excavate':
				return ExcavateCounterDefinition.create(side, this.allCards, this.i18n);
			case 'chaoticTendril':
				return ChaoticTendrilCounterDefinition.create(side, this.allCards, this.i18n);
			case 'secretsPlayed':
				return SecretsPlayedCounterDefinition.create(side, this.allCards, this.i18n);
			case 'lightray':
				return LightrayCounterDefinition.create(side, this.allCards, this.i18n);
			case 'holySpells':
				return HolySpellsCounterDefinition.create(side, this.allCards, this.i18n);
			case 'menagerie':
				return MenagerieCounterDefinition.create(side, this.allCards, this.i18n, this.prefs);
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
			case 'gardensGrace':
				return GardensGraceCounterDefinition.create(side, this.allCards, this.i18n);
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
				return MulticasterCounterDefinition.create(side, this.allCards, this.i18n, this.prefs);
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
			case 'bgsGoldDelta':
				return BgsGoldDeltaCounterDefinition.create(side, this.allCards, this.i18n, this.prefs);
			case 'bgsLordOfGains':
				return BgsLordOfGainsCounterDefinition.create(side, this.allCards, this.i18n, this.prefs);
			default:
				console.warn('unexpected activeCounter for bgs', activeCounter);
				return null;
		}
	}
}
