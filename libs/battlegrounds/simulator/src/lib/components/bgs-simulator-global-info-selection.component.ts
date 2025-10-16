/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPlayerGlobalInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';
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
					class="input undead-army"
					[label]="'battlegrounds.sim.undead-army' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.undead-army-tooltip' | fsTranslate"
					[value]="undeadAttackBonus"
					[minValue]="0"
					(fsModelUpdate)="onUndeadAttackBonusChanged($event)"
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
					[label]="'battlegrounds.sim.tavern-spells-cast' | fsTranslate"
					[helpTooltip]="'battlegrounds.sim.tavern-spells-cast-tooltip' | fsTranslate"
					[value]="tavernSpellsCastThisGame"
					[minValue]="0"
					(fsModelUpdate)="onTavernSpellsCastThisGameChanged($event)"
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
					[label]="'battlegrounds.sim.goldSpentThisGame' | fsTranslate"
					[value]="goldSpentThisGame"
					[minValue]="0"
					(fsModelUpdate)="goldSpentThisGame = $event"
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
		this.undeadAttackBonus = value?.UndeadAttackBonus ?? 0;
		this.hauntedCarapaceAttackBonus = value?.HauntedCarapaceAttackBonus ?? 0;
		this.hauntedCarapaceHealthBonus = value?.HauntedCarapaceHealthBonus ?? 0;
		this.goldrinnAttackBonus = value?.GoldrinnBuffAtk ?? 0;
		this.goldrinnHealthBonus = value?.GoldrinnBuffHealth ?? 0;
		this.frostlingBonus = value?.FrostlingBonus ?? 0;
		this.bloodGemAttackBonus = value?.BloodGemAttackBonus ?? 0;
		this.bloodGemHealthBonus = value?.BloodGemHealthBonus ?? 0;
		this.tavernSpellsCastThisGame = value?.TavernSpellsCastThisGame ?? 0;
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
		this.goldSpentThisGame = value?.GoldSpentThisGame ?? 0;
		this.friendlyMinionsDeadLastCombat = value?.FriendlyMinionsDeadLastCombat ?? 0;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	eternalKnightsDeadThisGame: number;
	undeadAttackBonus: number;
	hauntedCarapaceAttackBonus: number;
	hauntedCarapaceHealthBonus: number;
	goldrinnAttackBonus: number;
	goldrinnHealthBonus: number;
	frostlingBonus: number;
	bloodGemAttackBonus: number;
	bloodGemHealthBonus: number;
	tavernSpellsCastThisGame: number;
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
	goldSpentThisGame: number;
	friendlyMinionsDeadLastCombat: number;

	private inputGlobalInfo: BgsPlayerGlobalInfo | undefined | null;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {
		this.cdr.detach();
	}

	onEternalKnightsDeadThisGameChanged(value: number) {
		this.eternalKnightsDeadThisGame = value;
	}

	onUndeadAttackBonusChanged(value: number) {
		this.undeadAttackBonus = value;
	}

	onHauntedCarapaceAttackBonusChanged(value: number) {
		this.hauntedCarapaceAttackBonus = value;
	}

	onHauntedCarapaceHealthBonusChanged(value: number) {
		this.hauntedCarapaceHealthBonus = value;
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
			UndeadAttackBonus: this.undeadAttackBonus,
			HauntedCarapaceAttackBonus: this.hauntedCarapaceAttackBonus,
			HauntedCarapaceHealthBonus: this.hauntedCarapaceHealthBonus,
			GoldrinnBuffAtk: this.goldrinnAttackBonus,
			GoldrinnBuffHealth: this.goldrinnHealthBonus,
			FrostlingBonus: this.frostlingBonus,
			BloodGemAttackBonus: this.bloodGemAttackBonus,
			BloodGemHealthBonus: this.bloodGemHealthBonus,
			TavernSpellsCastThisGame: this.tavernSpellsCastThisGame,
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
			GoldSpentThisGame: this.goldSpentThisGame,
			FriendlyMinionsDeadLastCombat: this.friendlyMinionsDeadLastCombat,
		};
		// TODO: once hand is implemented, add the hand total stats to the Mrrrgl bonus
		this.applyHandler(newGlobalInfo);
	}
}
