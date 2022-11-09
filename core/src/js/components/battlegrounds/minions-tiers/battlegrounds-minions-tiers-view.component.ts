import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';

@Component({
	selector: 'battlegrounds-minions-tiers-view',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/battlegrounds-minions-tiers-view.component.scss',
	],
	template: `
		<div class="battlegrounds-minions-tiers" (mouseleave)="onTavernMouseLeave()">
			<div class="tiers-container">
				<ng-container>
					<div class="logo-container" *ngIf="currentTurn && showTurnNumber">
						<div class="background-main-part"></div>
						<div class="background-second-part"></div>
						<div
							class="turn-number"
							[owTranslate]="'battlegrounds.battle.turn'"
							[translateParams]="{ value: currentTurn }"
						></div>
					</div>
					<ng-container *ngIf="showMinionsList">
						<ul class="tiers">
							<div
								class="tier {{ currentTier.tavernTier }}"
								*ngFor="let currentTier of tiers; trackBy: trackByFn"
								[ngClass]="{
									'selected': displayedTier && displayedTier.tavernTier === currentTier.tavernTier,
									'locked': isLocked(currentTier),
									'mechanics': currentTier.type === 'mechanics'
								}"
								[helpTooltip]="currentTier.tooltip"
								(mouseover)="onTavernMouseOver(currentTier)"
								(click)="onTavernClick(currentTier)"
							>
								<img class="icon" src="assets/images/bgs/star.png" />
								<div class="number">{{ currentTier.tavernTier }}</div>
							</div>
						</ul>
						<bgs-minions-list
							*ngFor="let tier of tiers; trackBy: trackByFn"
							class="minions-list"
							[ngClass]="{
								'active':
									tier.tavernTier === displayedTier?.tavernTier ||
									tier.tavernTier === lockedTier?.tavernTier
							}"
							[tier]="tier"
							[showTribesHighlight]="showTribesHighlight"
							[showBattlecryHighlight]="showBattlecryHighlight"
							[highlightedMinions]="highlightedMinions"
							[highlightedTribes]="highlightedTribes"
							[highlightedMechanics]="highlightedMechanics"
							[showGoldenCards]="showGoldenCards"
						></bgs-minions-list>
					</ng-container>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsMinionsTiersViewOverlayComponent {
	@Input() tiers: readonly Tier[];
	@Input() highlightedTribes: readonly Race[];
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() highlightedMinions: readonly string[];
	@Input() currentTurn: number;
	@Input() showTribesHighlight: boolean;
	@Input() showBattlecryHighlight: boolean;
	@Input() showMinionsList: boolean;
	@Input() showTurnNumber: boolean;
	@Input() showMechanicsTiers: boolean;
	@Input() enableMouseOver: boolean;
	@Input() showGoldenCards: boolean;

	@Input() set tavernTier(value: number) {
		if (!value) {
			return;
		}

		// Only update the tavern tier if it's locked to the current tavern tier
		// so that we don't change the display if the user wants to keep the focus on another
		// tier (eg tier 5 or 6 to see their endgame options)
		if (!!this.lockedTier && this.lockedTier.tavernTier === this.currentTavernTier) {
			this.lockedTier = this.tiers.find((t) => t.tavernTier === value);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
		this.currentTavernTier = value;
	}

	displayedTier: Tier;
	lockedTier: Tier;
	currentTavernTier: number;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	trackByFn(index: number, tavernTier: Tier) {
		return tavernTier?.tavernTier;
	}

	onTavernClick(tavernTier: Tier) {
		this.displayedTier = tavernTier;
		if (this.isLocked(tavernTier)) {
			this.lockedTier = undefined;
			this.displayedTier = undefined;
		} else {
			this.lockedTier = tavernTier;
			this.displayedTier = undefined;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseOver(tavernTier: Tier) {
		if (this.lockedTier || !this.enableMouseOver) {
			return;
		}

		this.displayedTier = tavernTier;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseLeave() {
		if (this.lockedTier) {
			return;
		}
		this.displayedTier = undefined;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	isLocked(tavernTier: Tier) {
		return this.lockedTier && tavernTier && this.lockedTier.tavernTier === tavernTier.tavernTier;
	}
}

export interface Tier {
	tavernTier: number | 'B' | 'D';
	cards: readonly ReferenceCard[];
	groupingFunction: (card: ReferenceCard) => string;
	tooltip?: string;
	type: 'standard' | 'mechanics';
}
