import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { Tier } from '@firestone/battlegrounds/core';

@Component({
	selector: 'minions-list-tiers-header',
	styleUrls: [`./minions-list-tiers-header.component.scss`],
	template: `
		<div class="tiers-header">
			<ul class="tiers tier-levels">
				<tier-icon
					*ngFor="let currentTier of tierLevels; trackBy: trackByFn"
					[tier]="currentTier"
					[selected]="isDisplayed(currentTier) || isLocked(currentTier)"
					(mouseover)="onTavernMouseOver(currentTier)"
					(click)="onTavernClick(currentTier)"
				></tier-icon>
			</ul>
			<ul class="tiers mechanical" *ngIf="!!mechanicalTiers?.length">
				<tier-icon
					*ngFor="let currentTier of mechanicalTiers; trackBy: trackByFn"
					[tier]="currentTier"
					[selected]="isDisplayed(currentTier) || isLocked(currentTier)"
					[additionalClass]="'mechanics'"
					(mouseover)="onTavernMouseOver(currentTier)"
					(click)="onTavernClick(currentTier)"
				></tier-icon>
			</ul>
			<ul class="tiers tribe" *ngIf="!!tribeTiers?.length">
				<tier-icon
					*ngFor="let currentTier of tribeTiers; trackBy: trackByFn"
					[tier]="currentTier"
					[selected]="isDisplayed(currentTier) || isLocked(currentTier)"
					[additionalClass]="'tribe'"
					(mouseover)="onTavernMouseOver(currentTier)"
					(click)="onTavernClick(currentTier)"
				></tier-icon>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsListTiersHeaderComponent {
	@Output() displayedTierChange = new EventEmitter<Tier>();
	@Output() lockedTierChange = new EventEmitter<Tier>();

	@Input() tierLevels: readonly Tier[];
	@Input() mechanicalTiers: readonly Tier[];
	@Input() tribeTiers: readonly Tier[];

	@Input() set tavernTier(value: number) {
		if (!value || !this.tierLevels?.length || value === this.currentTavernTier) {
			return;
		}

		// Only update the tavern tier if it's locked to the current tavern tier
		// so that we don't change the display if the user wants to keep the focus on another
		// tier (eg tier 5 or 6 to see their endgame options)
		if (this.lockedTier && this.lockedTier.tavernTier === this.currentTavernTier) {
			console.debug('will set locked tier', this.lockedTier, this.currentTavernTier);
			this.setLockedTier(this.getAllTiers().find((t) => t.tavernTier === value));
		}
		this.currentTavernTier = value;
	}

	@Input() set mouseLeaveTrigger(value: boolean) {
		this.onTavernMouseLeave();
	}

	@Input() enableMouseOver: boolean;

	displayedTier: Tier;
	lockedTier: Tier;
	currentTavernTier: number;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	trackByFn(index: number, tavernTier: Tier) {
		return tavernTier?.tavernTier;
	}

	onTavernClick(tavernTier: Tier) {
		this.setDisplayedTier(undefined);
		if (this.isLocked(tavernTier)) {
			this.setLockedTier(undefined);
		} else {
			this.setLockedTier(tavernTier);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseOver(tavernTier: Tier) {
		if (this.lockedTier || !this.enableMouseOver || tavernTier === this.displayedTier) {
			return;
		}

		this.setDisplayedTier(tavernTier);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseLeave() {
		if (this.lockedTier || !this.displayedTier) {
			return;
		}
		this.setDisplayedTier(undefined);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	isLocked(tavernTier: Tier) {
		return this.lockedTier && tavernTier && this.lockedTier.tavernTier === tavernTier.tavernTier;
	}

	isDisplayed(tavernTier: Tier) {
		return this.displayedTier?.tavernTier === tavernTier.tavernTier;
	}

	private getAllTiers(): readonly Tier[] {
		return [...this.tierLevels, ...this.mechanicalTiers, ...this.tribeTiers];
	}

	private setLockedTier(tavernTier: Tier) {
		this.lockedTier = tavernTier;
		this.lockedTierChange.next(tavernTier);
	}

	private setDisplayedTier(tavernTier: Tier) {
		this.displayedTier = tavernTier;
		this.displayedTierChange.next(tavernTier);
	}
}
