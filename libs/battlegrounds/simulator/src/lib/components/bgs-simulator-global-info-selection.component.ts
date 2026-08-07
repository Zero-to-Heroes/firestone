/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import type { BgsPlayerGlobalInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'bgs-simulator-global-info-selection',
	styleUrls: [`./bgs-selection-popup.scss`, `./bgs-simulator-global-info-selection.component.scss`],
	template: `
		<div class="container">
			<button class="i-30 close-button" (mousedown)="close()">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#window-control_close"
					></use>
				</svg>
			</button>

			<div class="title" [fsTranslate]="'battlegrounds.sim.global-info-title'"></div>
			<div class="inputs-list">
				<fs-numeric-input-with-arrows
					class="input eternal-knights-dead-this-game"
					[label]="'battlegrounds.sim.eternal-legion' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.eternal-legion-tooltip' | fsTranslate"
					[value]="eternalKnightsDeadThisGame"
					[minValue]="0"
					(fsModelUpdate)="onEternalKnightsDeadThisGameChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input eternal-knight-attack-buff"
					[label]="'battlegrounds.sim.eternal-knight-attack-buff' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.eternal-knight-attack-buff-tooltip' | fsTranslate"
					[value]="eternalKnightAttackBuff"
					[minValue]="0"
					(fsModelUpdate)="onEternalKnightAttackBuffChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input eternal-knight-health-buff"
					[label]="'battlegrounds.sim.eternal-knight-health-buff' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.eternal-knight-health-buff-tooltip' | fsTranslate"
					[value]="eternalKnightHealthBuff"
					[minValue]="0"
					(fsModelUpdate)="onEternalKnightHealthBuffChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input undead-army"
					[label]="'battlegrounds.sim.undead-army' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.undead-army-tooltip' | fsTranslate"
					[value]="undeadAttackBonus"
					[minValue]="0"
					(fsModelUpdate)="onUndeadAttackBonusChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input undead-army-health"
					[label]="'battlegrounds.sim.undead-army-health' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.undead-army-health-tooltip' | fsTranslate"
					[value]="undeadHealthBonus"
					[minValue]="0"
					(fsModelUpdate)="onUndeadHealthBonusChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input haunted-carapace-attack"
					[label]="'battlegrounds.sim.haunted-carapace-attack' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.haunted-carapace-attack-tooltip' | fsTranslate"
					[value]="hauntedCarapaceAttackBonus"
					[minValue]="0"
					(fsModelUpdate)="onHauntedCarapaceAttackBonusChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input haunted-carapace-health"
					[label]="'battlegrounds.sim.haunted-carapace-health' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.haunted-carapace-health-tooltip' | fsTranslate"
					[value]="hauntedCarapaceHealthBonus"
					[minValue]="0"
					(fsModelUpdate)="onHauntedCarapaceHealthBonusChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input deep-blues"
					[label]="'battlegrounds.sim.deep-blues' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.deep-blues-tooltip' | fsTranslate"
					[value]="deepBluesPlayed"
					[minValue]="0"
					(fsModelUpdate)="onDeepBluesPlayedChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input volumizer-attack"
					[label]="'battlegrounds.sim.volumizer-attack' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.volumizer-attack-tooltip' | fsTranslate"
					[value]="volumizerAttackBuff"
					[minValue]="0"
					(fsModelUpdate)="onVolumizerAttackBuffChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input volumizer-health"
					[label]="'battlegrounds.sim.volumizer-health' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.volumizer-health-tooltip' | fsTranslate"
					[value]="volumizerHealthBuff"
					[minValue]="0"
					(fsModelUpdate)="onVolumizerHealthBuffChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input whelp-attack"
					[label]="'battlegrounds.sim.whelp-attack' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.whelp-attack-tooltip' | fsTranslate"
					[value]="whelpAttackBuff"
					[minValue]="0"
					(fsModelUpdate)="onWhelpAttackBuffChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input whelp-health"
					[label]="'battlegrounds.sim.whelp-health' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.whelp-health-tooltip' | fsTranslate"
					[value]="whelpHealthBuff"
					[minValue]="0"
					(fsModelUpdate)="onWhelpHealthBuffChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input goldrinn-attack"
					[label]="'battlegrounds.sim.goldrinn-attack' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.goldrinn-attack-tooltip' | fsTranslate"
					[value]="goldrinnAttackBonus"
					[minValue]="0"
					(fsModelUpdate)="onGoldrinnAttackBonusChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input goldrinn-health"
					[label]="'battlegrounds.sim.goldrinn-health' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.goldrinn-health-tooltip' | fsTranslate"
					[value]="goldrinnHealthBonus"
					[minValue]="0"
					(fsModelUpdate)="onGoldrinnHealthBonusChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.frostling-bonus' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.frostling-bonus-tooltip' | fsTranslate"
					[value]="frostlingBonus"
					[minValue]="0"
					(fsModelUpdate)="onFrostlingBonusChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.bloodgem-attack' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.bloodgem-attack-tooltip' | fsTranslate"
					[value]="bloodGemAttackBonus"
					[minValue]="0"
					(fsModelUpdate)="onBloodGemAttackBonusChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.bloodgem-health' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.bloodgem-health-tooltip' | fsTranslate"
					[value]="bloodGemHealthBonus"
					[minValue]="0"
					(fsModelUpdate)="onBloodGemHealthBonusChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.spells-cast' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.spells-cast-tooltip' | fsTranslate"
					[value]="spellsCastThisGame"
					[minValue]="0"
					(fsModelUpdate)="spellsCastThisGame = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.cards-played-this-turn' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.cards-played-this-turn-tooltip' | fsTranslate"
					[value]="cardsPlayedThisTurn"
					[minValue]="0"
					(fsModelUpdate)="cardsPlayedThisTurn = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.tavern-spells-cast' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.tavern-spells-cast-tooltip' | fsTranslate"
					[value]="tavernSpellsCastThisGame"
					[minValue]="0"
					(fsModelUpdate)="onTavernSpellsCastThisGameChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.tasty-lobsters-buff' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.tasty-lobsters-buff-tooltip' | fsTranslate"
					[value]="tastyLobstersBuff"
					[minValue]="0"
					(fsModelUpdate)="onTastyLobstersBuffChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.tavern-spells-cast-this-turn' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.tavern-spells-cast-this-turn-tooltip' | fsTranslate"
					[value]="tavernSpellsCastThisTurn"
					[minValue]="0"
					(fsModelUpdate)="tavernSpellsCastThisTurn = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.mrrgltons-played-this-game' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.mrrgltons-played-this-game-tooltip' | fsTranslate"
					[value]="mrrgltonsPlayedThisGame"
					[minValue]="0"
					(fsModelUpdate)="mrrgltonsPlayedThisGame = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.back-to-back-cast-this-game' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.back-to-back-cast-this-game-tooltip' | fsTranslate"
					[value]="backToBackCastThisGame"
					[minValue]="0"
					(fsModelUpdate)="backToBackCastThisGame = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.pirates-played' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.pirates-played-tooltip' | fsTranslate"
					[value]="piratesPlayedThisGame"
					[minValue]="0"
					(fsModelUpdate)="onPiratesPlayedThisGameChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.pirates-summoned' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.pirates-summoned-tooltip' | fsTranslate"
					[value]="piratesSummonedThisGame"
					[minValue]="0"
					(fsModelUpdate)="onPiratesSummonedThisGameChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.beasts-summoned' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.beasts-summoned-tooltip' | fsTranslate"
					[value]="beastsSummonedThisGame"
					[minValue]="0"
					(fsModelUpdate)="onBeastsSummonedThisGameChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.magnetized' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.magnetized-tooltip' | fsTranslate"
					[value]="magnetizedThisGame"
					[minValue]="0"
					(fsModelUpdate)="onMagnetizedThisGameChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.ancestral-automaton' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.ancestral-automaton-tooltip' | fsTranslate"
					[value]="astralAutomatonsSummonedThisGame"
					[minValue]="0"
					(fsModelUpdate)="onAstralAutomatonsSummonedThisGameChanged($event)"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.beetle-attack-buff' | fsTranslate"
					[value]="beetleAttackBuff"
					[minValue]="0"
					(fsModelUpdate)="beetleAttackBuff = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.beetle-health-buff' | fsTranslate"
					[value]="beetleHealthBuff"
					[minValue]="0"
					(fsModelUpdate)="beetleHealthBuff = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.elemental-health-buff' | fsTranslate"
					[value]="elementalHealthBuff"
					[minValue]="0"
					(fsModelUpdate)="elementalHealthBuff = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.elemental-attack-buff' | fsTranslate"
					[value]="elementalAttackBuff"
					[minValue]="0"
					(fsModelUpdate)="elementalAttackBuff = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.tavern-spell-health-buff' | fsTranslate"
					[value]="tavernSpellHealthBuff"
					[minValue]="0"
					(fsModelUpdate)="tavernSpellHealthBuff = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.tavern-spell-attack-buff' | fsTranslate"
					[value]="tavernSpellAttackBuff"
					[minValue]="0"
					(fsModelUpdate)="tavernSpellAttackBuff = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.battlecries-triggered' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.battlecries-triggered-tooltip' | fsTranslate"
					[value]="battlecriesTriggeredThisGame"
					[minValue]="0"
					(fsModelUpdate)="battlecriesTriggeredThisGame = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.deathrattles-triggered-this-game' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.deathrattles-triggered-this-game-tooltip' | fsTranslate"
					[value]="deathrattlesTriggeredThisGame"
					[minValue]="0"
					(fsModelUpdate)="deathrattlesTriggeredThisGame = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.goldSpentThisGame' | fsTranslate"
					[value]="goldSpentThisGame"
					[minValue]="0"
					(fsModelUpdate)="goldSpentThisGame = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.golden-minions-played-this-game' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.golden-minions-played-this-game-tooltip' | fsTranslate"
					[value]="goldenMinionsPlayedThisGame"
					[minValue]="0"
					(fsModelUpdate)="goldenMinionsPlayedThisGame = $event"
				>
				</fs-numeric-input-with-arrows>
				<fs-numeric-input-with-arrows
					class="input"
					[label]="'battlegrounds.sim.friendly-minions-dead-last-combat' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.friendly-minions-dead-last-combat-tooltip' | fsTranslate"
					[value]="friendlyMinionsDeadLastCombat"
					[minValue]="0"
					(fsModelUpdate)="friendlyMinionsDeadLastCombat = $event"
				>
				</fs-numeric-input-with-arrows>
			</div>
			<div class="controls">
				<div class="button" (click)="validate()" [fsTranslate]="'battlegrounds.sim.select-button'"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorGlobalInfoSelectionComponent {
	@Input() closeHandler: () => void;
	@Input() applyHandler: (newGlobalInfo: BgsPlayerGlobalInfo | null) => void;

	@Input() set currentGlobalInfo(value: BgsPlayerGlobalInfo | undefined | null) {
		this.inputGlobalInfo = value;
		this.eternalKnightsDeadThisGame = value?.EternalKnightsDeadThisGame ?? 0;
		this.eternalKnightAttackBuff = value?.EternalKnightAttackBuff ?? 0;
		this.eternalKnightHealthBuff = value?.EternalKnightHealthBuff ?? 0;
		this.undeadAttackBonus = value?.UndeadAttackBonus ?? 0;
		this.undeadHealthBonus = value?.UndeadHealthBonus ?? 0;
		this.hauntedCarapaceAttackBonus = value?.HauntedCarapaceAttackBonus ?? 0;
		this.hauntedCarapaceHealthBonus = value?.HauntedCarapaceHealthBonus ?? 0;
		this.deepBluesPlayed = value?.DeepBluesPlayed ?? 0;
		this.volumizerAttackBuff = value?.VolumizerAttackBuff ?? 0;
		this.volumizerHealthBuff = value?.VolumizerHealthBuff ?? 0;
		this.whelpAttackBuff = value?.WhelpAttackBuff ?? 0;
		this.whelpHealthBuff = value?.WhelpHealthBuff ?? 0;
		this.goldrinnAttackBonus = value?.GoldrinnBuffAtk ?? 0;
		this.goldrinnHealthBonus = value?.GoldrinnBuffHealth ?? 0;
		this.frostlingBonus = value?.FrostlingBonus ?? 0;
		this.bloodGemAttackBonus = value?.BloodGemAttackBonus ?? 0;
		this.bloodGemHealthBonus = value?.BloodGemHealthBonus ?? 0;
		this.tavernSpellsCastThisGame = value?.TavernSpellsCastThisGame ?? 0;
		this.tastyLobstersBuff = (value as { TastyLobstersBuff?: number } | null | undefined)?.TastyLobstersBuff ?? 0;
		this.spellsCastThisGame = value?.SpellsCastThisGame ?? 0;
		this.piratesPlayedThisGame = value?.PiratesPlayedThisGame ?? 0;
		this.piratesSummonedThisGame = value?.PiratesSummonedThisGame ?? 0;
		this.beastsSummonedThisGame = value?.BeastsSummonedThisGame ?? 0;
		this.magnetizedThisGame = value?.MagnetizedThisGame ?? 0;
		this.astralAutomatonsSummonedThisGame = value?.AstralAutomatonsSummonedThisGame ?? 0;
		this.beetleAttackBuff = value?.BeetleAttackBuff ?? 0;
		this.beetleHealthBuff = value?.BeetleHealthBuff ?? 0;
		this.elementalHealthBuff = value?.ElementalHealthBuff ?? 0;
		this.elementalAttackBuff = value?.ElementalAttackBuff ?? 0;
		this.tavernSpellHealthBuff = value?.TavernSpellHealthBuff ?? 0;
		this.tavernSpellAttackBuff = value?.TavernSpellAttackBuff ?? 0;
		this.battlecriesTriggeredThisGame = value?.BattlecriesTriggeredThisGame ?? 0;
		this.deathrattlesTriggeredThisGame = value?.DeathrattlesTriggeredThisGame ?? 0;
		this.tavernSpellsCastThisTurn = value?.TavernSpellsCastThisTurn ?? 0;
		this.mrrgltonsPlayedThisGame = value?.MrrgltonsPlayedThisGame ?? 0;
		this.cardsPlayedThisTurn = value?.CardsPlayedThisTurn ?? 0;
		this.backToBackCastThisGame = value?.BackToBackCastThisGame ?? 0;
		this.goldSpentThisGame = value?.GoldSpentThisGame ?? 0;
		this.goldenMinionsPlayedThisGame = value?.GoldenMinionsPlayedThisGame ?? 0;
		this.friendlyMinionsDeadLastCombat = value?.FriendlyMinionsDeadLastCombat ?? 0;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	eternalKnightsDeadThisGame: number;
	eternalKnightAttackBuff: number;
	eternalKnightHealthBuff: number;
	undeadAttackBonus: number;
	undeadHealthBonus: number;
	hauntedCarapaceAttackBonus: number;
	hauntedCarapaceHealthBonus: number;
	deepBluesPlayed: number;
	volumizerAttackBuff: number;
	volumizerHealthBuff: number;
	whelpAttackBuff: number;
	whelpHealthBuff: number;
	goldrinnAttackBonus: number;
	goldrinnHealthBonus: number;
	frostlingBonus: number;
	bloodGemAttackBonus: number;
	bloodGemHealthBonus: number;
	tavernSpellsCastThisGame: number;
	tastyLobstersBuff: number;
	spellsCastThisGame: number;
	piratesPlayedThisGame: number;
	piratesSummonedThisGame: number;
	beastsSummonedThisGame: number;
	magnetizedThisGame: number;
	astralAutomatonsSummonedThisGame: number;
	beetleAttackBuff: number;
	beetleHealthBuff: number;
	elementalHealthBuff: number;
	elementalAttackBuff: number;
	tavernSpellHealthBuff: number;
	tavernSpellAttackBuff: number;
	battlecriesTriggeredThisGame: number;
	deathrattlesTriggeredThisGame: number;
	tavernSpellsCastThisTurn: number;
	mrrgltonsPlayedThisGame: number;
	cardsPlayedThisTurn: number;
	backToBackCastThisGame: number;
	goldSpentThisGame: number;
	goldenMinionsPlayedThisGame: number;
	friendlyMinionsDeadLastCombat: number;

	private inputGlobalInfo: BgsPlayerGlobalInfo | undefined | null;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {}

	onEternalKnightsDeadThisGameChanged(value: number) {
		this.eternalKnightsDeadThisGame = value;
	}

	onEternalKnightAttackBuffChanged(value: number) {
		this.eternalKnightAttackBuff = value;
	}

	onEternalKnightHealthBuffChanged(value: number) {
		this.eternalKnightHealthBuff = value;
	}

	onUndeadAttackBonusChanged(value: number) {
		this.undeadAttackBonus = value;
	}

	onUndeadHealthBonusChanged(value: number) {
		this.undeadHealthBonus = value;
	}

	onHauntedCarapaceAttackBonusChanged(value: number) {
		this.hauntedCarapaceAttackBonus = value;
	}

	onHauntedCarapaceHealthBonusChanged(value: number) {
		this.hauntedCarapaceHealthBonus = value;
	}

	onDeepBluesPlayedChanged(value: number) {
		this.deepBluesPlayed = value;
	}

	onVolumizerAttackBuffChanged(value: number) {
		this.volumizerAttackBuff = value;
	}

	onVolumizerHealthBuffChanged(value: number) {
		this.volumizerHealthBuff = value;
	}

	onWhelpAttackBuffChanged(value: number) {
		this.whelpAttackBuff = value;
	}

	onWhelpHealthBuffChanged(value: number) {
		this.whelpHealthBuff = value;
	}

	onGoldrinnAttackBonusChanged(value: number) {
		this.goldrinnAttackBonus = value;
	}

	onGoldrinnHealthBonusChanged(value: number) {
		this.goldrinnHealthBonus = value;
	}

	onFrostlingBonusChanged(value: number) {
		this.frostlingBonus = value;
	}

	onBloodGemAttackBonusChanged(value: number) {
		this.bloodGemAttackBonus = value;
	}

	onBloodGemHealthBonusChanged(value: number) {
		this.bloodGemHealthBonus = value;
	}

	onTavernSpellsCastThisGameChanged(value: number) {
		this.tavernSpellsCastThisGame = value;
	}

	onTastyLobstersBuffChanged(value: number) {
		this.tastyLobstersBuff = value;
	}

	onPiratesPlayedThisGameChanged(value: number) {
		this.piratesPlayedThisGame = value;
	}

	onPiratesSummonedThisGameChanged(value: number) {
		this.piratesSummonedThisGame = value;
	}

	onBeastsSummonedThisGameChanged(value: number) {
		this.beastsSummonedThisGame = value;
	}

	onMagnetizedThisGameChanged(value: number) {
		this.magnetizedThisGame = value;
	}

	onAstralAutomatonsSummonedThisGameChanged(value: number) {
		this.astralAutomatonsSummonedThisGame = value;
	}

	close() {
		this.closeHandler();
	}

	validate() {
		const newGlobalInfo: BgsPlayerGlobalInfo = {
			// So that things don't fail if I forget to implement new fields
			...(this.inputGlobalInfo ?? {}),
			EternalKnightsDeadThisGame: this.eternalKnightsDeadThisGame,
			EternalKnightAttackBuff: this.eternalKnightAttackBuff,
			EternalKnightHealthBuff: this.eternalKnightHealthBuff,
			UndeadAttackBonus: this.undeadAttackBonus,
			UndeadHealthBonus: this.undeadHealthBonus,
			HauntedCarapaceAttackBonus: this.hauntedCarapaceAttackBonus,
			HauntedCarapaceHealthBonus: this.hauntedCarapaceHealthBonus,
			DeepBluesPlayed: this.deepBluesPlayed,
			VolumizerAttackBuff: this.volumizerAttackBuff,
			VolumizerHealthBuff: this.volumizerHealthBuff,
			WhelpAttackBuff: this.whelpAttackBuff,
			WhelpHealthBuff: this.whelpHealthBuff,
			GoldrinnBuffAtk: this.goldrinnAttackBonus,
			GoldrinnBuffHealth: this.goldrinnHealthBonus,
			FrostlingBonus: this.frostlingBonus,
			BloodGemAttackBonus: this.bloodGemAttackBonus,
			BloodGemHealthBonus: this.bloodGemHealthBonus,
			TavernSpellsCastThisGame: this.tavernSpellsCastThisGame,
			TastyLobstersBuff: this.tastyLobstersBuff,
			SpellsCastThisGame: this.spellsCastThisGame,
			PiratesPlayedThisGame: this.piratesPlayedThisGame,
			PiratesSummonedThisGame: this.piratesSummonedThisGame,
			BeastsSummonedThisGame: this.beastsSummonedThisGame,
			MagnetizedThisGame: this.magnetizedThisGame,
			AstralAutomatonsSummonedThisGame: this.astralAutomatonsSummonedThisGame,
			BeetleAttackBuff: this.beetleAttackBuff,
			BeetleHealthBuff: this.beetleHealthBuff,
			ElementalHealthBuff: this.elementalHealthBuff,
			ElementalAttackBuff: this.elementalAttackBuff,
			TavernSpellHealthBuff: this.tavernSpellHealthBuff,
			TavernSpellAttackBuff: this.tavernSpellAttackBuff,
			BattlecriesTriggeredThisGame: this.battlecriesTriggeredThisGame,
			DeathrattlesTriggeredThisGame: this.deathrattlesTriggeredThisGame,
			TavernSpellsCastThisTurn: this.tavernSpellsCastThisTurn,
			MrrgltonsPlayedThisGame: this.mrrgltonsPlayedThisGame,
			CardsPlayedThisTurn: this.cardsPlayedThisTurn,
			BackToBackCastThisGame: this.backToBackCastThisGame,
			GoldSpentThisGame: this.goldSpentThisGame,
			GoldenMinionsPlayedThisGame: this.goldenMinionsPlayedThisGame,
			FriendlyMinionsDeadLastCombat: this.friendlyMinionsDeadLastCombat,
		} as BgsPlayerGlobalInfo;
		// TODO: once hand is implemented, add the hand total stats to the Mrrrgl bonus
		this.applyHandler(newGlobalInfo);
	}
}
