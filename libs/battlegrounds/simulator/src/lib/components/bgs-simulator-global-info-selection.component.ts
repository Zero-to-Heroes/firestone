/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPlayerGlobalInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

@Component({
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
				[label]="'battlegrounds.sim.ancestral-automaton' | fsTranslate"
				[helpTooltip]="'battlegrounds.sim.ancestral-automaton-tooltip' | fsTranslate"
				[value]="astralAutomatonsSummonedThisGame"
				[minValue]="0"
				(fsModelUpdate)="onAstralAutomatonsSummonedThisGameChanged($event)"
			>
			</fs-numeric-input-with-arrows>
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
		this.frostlingBonus = value?.FrostlingBonus ?? 0;
		this.bloodGemAttackBonus = value?.BloodGemAttackBonus ?? 0;
		this.bloodGemHealthBonus = value?.BloodGemHealthBonus ?? 0;
		this.tavernSpellsCastThisGame = value?.TavernSpellsCastThisGame ?? 0;
		this.piratesPlayedThisGame = value?.PiratesPlayedThisGame ?? 0;
		this.piratesSummonedThisGame = value?.PiratesSummonedThisGame ?? 0;
		this.astralAutomatonsSummonedThisGame = value?.AstralAutomatonsSummonedThisGame ?? 0;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	eternalKnightsDeadThisGame: number;
	undeadAttackBonus: number;
	frostlingBonus: number;
	bloodGemAttackBonus: number;
	bloodGemHealthBonus: number;
	tavernSpellsCastThisGame: number;
	piratesPlayedThisGame: number;
	piratesSummonedThisGame: number;
	astralAutomatonsSummonedThisGame: number;

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
			FrostlingBonus: this.frostlingBonus,
			BloodGemAttackBonus: this.bloodGemAttackBonus,
			BloodGemHealthBonus: this.bloodGemHealthBonus,
			TavernSpellsCastThisGame: this.tavernSpellsCastThisGame,
			PiratesPlayedThisGame: this.piratesPlayedThisGame,
			PiratesSummonedThisGame: this.piratesSummonedThisGame,
			AstralAutomatonsSummonedThisGame: this.astralAutomatonsSummonedThisGame,
		};
		// TODO: once hand is implemented, add the hand total stats to the Mrrrgl bonus
		this.applyHandler(newGlobalInfo);
	}
}
