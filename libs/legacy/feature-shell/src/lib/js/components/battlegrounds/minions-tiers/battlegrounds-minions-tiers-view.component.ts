import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { GameTag, Race } from '@firestone-hs/reference-data';
import { ExtendedBgsCompAdvice, TavernTierType, Tier } from '@firestone/battlegrounds/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'battlegrounds-minions-tiers-view',
	styleUrls: [`../../../../css/global/cdk-overlay.scss`, './battlegrounds-minions-tiers-view.component.scss'],
	template: `
		<div class="battlegrounds-minions-tiers-view" *ngIf="tierLevels?.length">
			<div class="tiers-container" (mouseleave)="onTavernMouseLeave()">
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
						<minions-list-tiers-header-2
							*ngIf="useNewTiersHeaderStyle"
							[tierLevels]="tierLevels"
							[mechanicalTiers]="mechanicalTiers"
							[tribeTiers]="tribeTiers"
							[tavernTier]="currentTavernTier"
							[compositions]="compositions"
							[enableMouseOver]="enableMouseOver"
							[mouseLeaveTrigger]="mouseLeaveTrigger$ | async"
							(displayedTierChange)="onDisplayedTier($event)"
							(lockedTierChange)="onDisplayedTier($event)"
						></minions-list-tiers-header-2>
						<minions-list-tiers-header
							*ngIf="!useNewTiersHeaderStyle"
							[tierLevels]="tierLevels"
							[mechanicalTiers]="mechanicalTiers"
							[tribeTiers]="tribeTiers"
							[tavernTier]="currentTavernTier"
							[compositions]="compositions"
							[enableMouseOver]="enableMouseOver"
							[mouseLeaveTrigger]="mouseLeaveTrigger$ | async"
							(displayedTierChange)="onDisplayedTier($event)"
							(lockedTierChange)="onDisplayedTier($event)"
						></minions-list-tiers-header>
						<ng-container *ngIf="displayedTierId$ | async as displayedTierId">
							<ng-container *ngIf="displayedTierId !== 'compositions'">
								<bgs-minions-list
									class="minions-list"
									[tier]="displayedTier$ | async"
									[showTribesHighlight]="showTribesHighlight"
									[highlightedMinions]="highlightedMinions"
									[highlightedTribes]="highlightedTribes"
									[highlightedMechanics]="highlightedMechanics"
									[showGoldenCards]="showGoldenCards"
									[showTrinketTips]="showTrinketTips"
								></bgs-minions-list>
							</ng-container>
							<ng-container *ngIf="displayedTierId === 'compositions'">
								<bgs-compositions-list
									[compositions]="compositions"
									[minionsOnBoardAndHand]="minionsOnBoardAndHand"
									[minionsInShop]="minionsInShop"
									[tavernTier]="currentTavernTier"
									[showTribesHighlight]="showTribesHighlight"
									[highlightedMinions]="highlightedMinions"
								></bgs-compositions-list>
							</ng-container>
						</ng-container>
					</ng-container>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsTiersViewOverlayComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	mouseLeaveTrigger$: Observable<boolean>;
	displayedTierId$: Observable<TavernTierType>;
	displayedTier$: Observable<Tier>;

	tierLevels: readonly Tier[] = [];
	mechanicalTiers: readonly Tier[] = [];
	tribeTiers: readonly Tier[] = [];

	@Input() currentTurn: number;
	@Input() showMinionsList: boolean;
	@Input() showTurnNumber: boolean;
	@Input() enableMouseOver: boolean;
	@Input() showGoldenCards: boolean;
	@Input() showTrinketTips: boolean;

	@Input() highlightedTribes: readonly Race[];
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() highlightedMinions: readonly string[];
	@Input() minionsOnBoardAndHand: readonly string[];
	@Input() minionsInShop: readonly string[];
	@Input() showTribesHighlight: boolean;
	@Input() useNewTiersHeaderStyle = true;

	@Input() set tiers(value: readonly Tier[]) {
		if (!value) {
			return;
		}

		this.tierLevels = value.filter((t) => t.type === 'standard');
		this.mechanicalTiers = value.filter((t) => t.type === 'mechanics');
		this.tribeTiers = value.filter((t) => t.type === 'tribe');
		this.allTiers$$.next([...this.tierLevels, ...this.mechanicalTiers, ...this.tribeTiers]);
	}

	@Input() compositions: readonly ExtendedBgsCompAdvice[];

	@Input() set tavernTier(value: number) {
		this.currentTavernTier = value;
	}

	currentTavernTier: number;

	private mouseLeaveTrigger$$ = new BehaviorSubject<boolean>(false);
	private allTiers$$ = new BehaviorSubject<readonly Tier[]>([]);
	private displayedTierId$$ = new BehaviorSubject<TavernTierType>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.mouseLeaveTrigger$ = this.mouseLeaveTrigger$$.pipe(this.mapData((value) => value));
		this.displayedTierId$ = this.displayedTierId$$.pipe(this.mapData((value) => value));
		this.displayedTier$ = combineLatest([this.allTiers$$, this.displayedTierId$$]).pipe(
			this.mapData(([allTiers, displayedTierId]) => allTiers?.find((t) => t.tavernTier === displayedTierId)),
		);
	}

	trackByFn(index: number, tavernTier: Tier) {
		return tavernTier?.tavernTier;
	}

	onDisplayedTier(tavernTier: Tier) {
		this.displayedTierId$$.next(tavernTier?.tavernTier);
	}

	onTavernMouseLeave() {
		this.mouseLeaveTrigger$$.next(!this.mouseLeaveTrigger$$.value);
	}
}
