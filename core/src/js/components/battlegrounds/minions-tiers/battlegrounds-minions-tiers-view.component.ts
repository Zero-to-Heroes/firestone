import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Race, ReferenceCard } from '@firestone-hs/reference-data';

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
								class="tier"
								*ngFor="let currentTier of tiers; trackBy: trackByFn"
								[ngClass]="{
									'selected': displayedTier && displayedTier.tavernTier === currentTier.tavernTier,
									'locked': isLocked(currentTier)
								}"
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
							[cards]="tier.cards"
							[showTribesHighlight]="showTribesHighlight"
							[highlightedMinions]="highlightedMinions"
							[highlightedTribes]="highlightedTribes"
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
	@Input() highlightedMinions: readonly string[];
	@Input() currentTurn: number;
	@Input() showTribesHighlight: boolean;
	@Input() showMinionsList: boolean;
	@Input() showTurnNumber: boolean;
	@Input() enableMouseOver: boolean;
	@Input() showGoldenCards: boolean;

	displayedTier: Tier;
	lockedTier: Tier;

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

interface Tier {
	tavernTier: number;
	cards: readonly ReferenceCard[];
}
