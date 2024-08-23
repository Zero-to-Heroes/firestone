import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	ViewEncapsulation,
} from '@angular/core';
import { GameTag, Race } from '@firestone-hs/reference-data';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { TavernTierType, Tier } from './tiers.model';

@Component({
	selector: 'battlegrounds-minions-tiers-view',
	styleUrls: [`../../../../css/global/cdk-overlay.scss`, './battlegrounds-minions-tiers-view.component.scss'],
	template: `
		<div class="battlegrounds-minions-tiers" *ngIf="tierLevels?.length" (mouseleave)="onTavernMouseLeave()">
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
						<minions-list-tiers-header
							[tierLevels]="tierLevels"
							[mechanicalTiers]="mechanicalTiers"
							[tribeTiers]="tribeTiers"
							[tavernTier]="currentTavernTier"
							[enableMouseOver]="enableMouseOver"
							[mouseLeaveTrigger]="mouseLeaveTrigger$ | async"
							(displayedTierChange)="onDisplayedTier($event)"
							(lockedTierChange)="onDisplayedTier($event)"
						></minions-list-tiers-header>
						<bgs-minions-list
							class="minions-list"
							[tier]="displayedTier$ | async"
							[showTribesHighlight]="showTribesHighlight"
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
export class BattlegroundsMinionsTiersViewOverlayComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	mouseLeaveTrigger$: Observable<boolean>;
	displayedTier$: Observable<Tier>;

	tierLevels: readonly Tier[] = [];
	mechanicalTiers: readonly Tier[] = [];
	tribeTiers: readonly Tier[] = [];

	@Input() currentTurn: number;
	@Input() showMinionsList: boolean;
	@Input() showTurnNumber: boolean;
	@Input() enableMouseOver: boolean;
	@Input() showGoldenCards: boolean;

	@Input() highlightedTribes: readonly Race[];
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() highlightedMinions: readonly string[];
	@Input() showTribesHighlight: boolean;

	@Input() set tiers(value: readonly Tier[]) {
		console.debug('setting tiers in tiers-view', value);
		if (!value) {
			return;
		}

		this.tierLevels = value.filter((t) => t.type === 'standard');
		this.mechanicalTiers = value.filter((t) => t.type === 'mechanics');
		this.tribeTiers = value.filter((t) => t.type === 'tribe');
		this.allTiers$$.next([...this.tierLevels, ...this.mechanicalTiers, ...this.tribeTiers]);
	}

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
		this.displayedTier$ = combineLatest([this.allTiers$$, this.displayedTierId$$]).pipe(
			this.mapData(([allTiers, displayedTierId]) => allTiers?.find((t) => t.tavernTier === displayedTierId)),
		);
	}

	trackByFn(index: number, tavernTier: Tier) {
		return tavernTier?.tavernTier;
	}

	onDisplayedTier(tavernTier: Tier) {
		console.debug('setting displayed tier', tavernTier);
		this.displayedTierId$$.next(tavernTier?.tavernTier);
	}

	onTavernMouseLeave() {
		this.mouseLeaveTrigger$$.next(!this.mouseLeaveTrigger$$.value);
	}
}
