import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { Tier } from '@firestone/battlegrounds/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
	selector: 'minions-list-tiers-header-2',
	styleUrls: [`./minions-list-tiers-header.component.scss`],
	template: `
		<div class="tiers-header">
			<nav class="tiers-selection" *ngIf="selectedCategory$ | async as category">
				<div
					class="tier tiers-category"
					*ngIf="tierLevels?.length"
					(click)="selectCategory('tiers')"
					[ngClass]="{ selected: category === 'tiers' }"
					[helpTooltip]="'battlegrounds.in-game.minions-list.navigation.tiers-tribes' | fsTranslate"
				>
					<div class="icon-container">
						<img
							class="icon"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/battlegrounds/minions-list/tiers.png"
						/>
					</div>
					<div
						class="label"
						[fsTranslate]="'battlegrounds.in-game.minions-list.navigation.tiers-tribes'"
					></div>
				</div>
				<div
					class="tier mechanics-category"
					*ngIf="mechanicalTiers?.length"
					(click)="selectCategory('mechanics')"
					[ngClass]="{ selected: category === 'mechanics' }"
					[helpTooltip]="'battlegrounds.in-game.minions-list.navigation.mechanics' | fsTranslate"
				>
					<div class="icon-container">
						<img
							class="icon"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/battlegrounds/minions-list/mechanics.png"
						/>
					</div>
					<div class="label" [fsTranslate]="'battlegrounds.in-game.minions-list.navigation.mechanics'"></div>
				</div>
				<!-- <div
					class="tier tribes-category"
					*ngIf="tribeTiers?.length"
					(click)="selectCategory('tribes')"
					[ngClass]="{ selected: category === 'tribes' }"
					[helpTooltip]="'battlegrounds.in-game.minions-list.navigation.tribes' | fsTranslate"
				>
					<div class="icon-container">
						<img
							class="icon"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/battlegrounds/minions-list/tribes.png"
						/>
					</div>
					<div class="label" [fsTranslate]="'battlegrounds.in-game.minions-list.navigation.tribes'"></div>
				</div> -->
				<!-- <div
					class="tier compositions-category"
					*ngIf="compositions?.length"
					(click)="selectCategory('compositions')"
					[ngClass]="{ selected: category === 'compositions' }"
					[helpTooltip]="'battlegrounds.in-game.minions-list.navigation.compositions-tooltip' | fsTranslate"
				>
					<div class="icon-container">
						<img
							class="icon"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/battlegrounds/minions-list/compositions.png"
						/>
					</div>
					<div
						class="label"
						[fsTranslate]="'battlegrounds.in-game.minions-list.navigation.compositions'"
					></div>
				</div> -->
			</nav>
			<ng-container [ngSwitch]="selectedCategory$ | async">
				<ng-container *ngSwitchCase="'tiers'">
					<ul class="tiers tier-levels">
						<tier-icon
							*ngFor="let currentTier of tierLevels; trackBy: trackByFn"
							[tier]="currentTier"
							[selected]="isDisplayed(currentTier) || isLocked(currentTier)"
							(mouseover)="onTavernMouseOver(currentTier)"
							(click)="onTavernClick(currentTier)"
						></tier-icon>
					</ul>
					<ul class="tiers tribe">
						<tier-icon
							*ngFor="let currentTier of tribeTiers; trackBy: trackByFn"
							[tier]="currentTier"
							[selected]="isDisplayed(currentTier) || isLocked(currentTier)"
							[additionalClass]="'tribe'"
							(mouseover)="onTavernMouseOver(currentTier)"
							(click)="onTavernClick(currentTier)"
						></tier-icon>
					</ul>
				</ng-container>
				<ul class="tiers mechanical" *ngSwitchCase="'mechanics'">
					<tier-icon
						*ngFor="let currentTier of mechanicalTiers; trackBy: trackByFn"
						[tier]="currentTier"
						[selected]="isDisplayed(currentTier) || isLocked(currentTier)"
						[additionalClass]="'mechanics'"
						(mouseover)="onTavernMouseOver(currentTier)"
						(click)="onTavernClick(currentTier)"
					></tier-icon>
				</ul>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsListTiersHeader2Component
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	selectedCategory$: Observable<MinionTierCategory>;

	@Output() displayedTierChange = new EventEmitter<Tier>();
	@Output() lockedTierChange = new EventEmitter<Tier>();

	@Input() tierLevels: readonly Tier[];
	@Input() mechanicalTiers: readonly Tier[];
	@Input() tribeTiers: readonly Tier[];
	@Input() compositions: readonly BgsCompAdvice[];

	@Input() set tavernTier(value: number) {
		if (!value || !this.tierLevels?.length || value === this.currentTavernTier) {
			return;
		}

		// Only update the tavern tier if it's locked to the current tavern tier
		// so that we don't change the display if the user wants to keep the focus on another
		// tier (eg tier 5 or 6 to see their endgame options)
		if (this.lockedTier && this.lockedTier.tavernTier === this.currentTavernTier) {
			// console.debug('will set locked tier', this.lockedTier, this.currentTavernTier);
			this.setDisplayedTier(null);
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
	currentTavernTier = 1;

	private selectedCategory$$ = new BehaviorSubject<MinionTierCategory | null>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.selectedCategory$ = this.selectedCategory$$.asObservable();
	}

	ngAfterViewInit(): void {
		this.selectCategory('tiers');
	}

	selectCategory(category: MinionTierCategory) {
		const unselecting = this.selectedCategory$$.getValue() === category;
		this.setLockedTier(undefined);
		this.setDisplayedTier(undefined);
		// console.debug('selecting', category, this.selectedCategory$$.getValue(), unselecting);
		this.selectedCategory$$.next(category);
		if (!unselecting) {
			switch (category) {
				case 'compositions':
					// this.setDisplayedTier({ tavernTier: 'compositions' } as Tier);
					this.setLockedTier({ tavernTier: 'compositions' } as Tier);
					break;
				case 'tiers':
					// this.setDisplayedTier(this.tierLevels.find((tier) => tier.tavernTier === this.currentTavernTier));
					this.setLockedTier(this.tierLevels.find((tier) => tier.tavernTier === this.currentTavernTier));
					break;
				case 'mechanics':
					// this.setDisplayedTier(this.mechanicalTiers[0]);
					this.setLockedTier(this.mechanicalTiers[0]);
					break;
				case 'tribes':
					// this.setDisplayedTier(this.tribeTiers[0]);
					this.setLockedTier(this.tribeTiers[0]);
					break;
			}
		}
	}

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
		// console.debug('setLockedTier', tavernTier, new Error().stack);
		this.lockedTier = tavernTier;
		this.lockedTierChange.next(tavernTier);
	}

	private setDisplayedTier(tavernTier: Tier) {
		// console.debug('setDisplayedTier', tavernTier, new Error().stack);
		this.displayedTier = tavernTier;
		this.displayedTierChange.next(tavernTier);
	}
}

type MinionTierCategory = 'tiers' | 'mechanics' | 'tribes' | 'compositions';
