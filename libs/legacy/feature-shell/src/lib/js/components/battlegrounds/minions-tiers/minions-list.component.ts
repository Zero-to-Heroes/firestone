import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { GameTag, Race } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService } from '@firestone/battlegrounds/common';
import { Tier, TierGroup, TierViewType } from '@firestone/battlegrounds/core';
import { AbstractSubscriptionComponent, uuid } from '@firestone/shared/framework/common';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'bgs-minions-list',
	styleUrls: [`../../../../css/global/cdk-overlay.scss`, './bgs-minions-list.component.scss'],
	template: `
		<div class="bgs-minions-list">
			<div class="group-header" *ngIf="tierName">
				<div class="header-text">{{ tierName }}</div>
				<div
					class="highlight-button"
					[ngClass]="{ highlighted: highlighted$ | async }"
					inlineSVG="assets/svg/pinned.svg"
					(click)="toggleHighlight()"
					[helpTooltip]="null"
					[helpTooltipPosition]="'left'"
				></div>
			</div>
			<bgs-minions-group
				class="minion-group"
				*ngFor="let group of groups; trackBy: trackByGroup"
				[group]="group"
				[showTribesHighlight]="showTribesHighlight"
				[showGoldenCards]="showGoldenCards"
				[showTrinketTips]="showTrinketTips"
				[highlightedMinions]="highlightedMinions"
				[highlightedTribes]="highlightedTribes$ | async"
				[highlightedMechanics]="highlightedMechanics$ | async"
			></bgs-minions-group>

			<div class="reset-all-button" (click)="resetHighlights()" *ngIf="showTribesHighlight">
				<div class="background-second-part"></div>
				<div class="background-main-part"></div>
				<div class="content">
					<div class="icon" inlineSVG="assets/svg/restore.svg"></div>
					{{ 'battlegrounds.in-game.minions-list.reset-button' | owTranslate }}
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsListComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	highlighted$: Observable<boolean>;
	highlightedTribes$: Observable<readonly Race[]>;
	highlightedMechanics$: Observable<readonly GameTag[]>;

	groups: readonly TierGroup[];
	tierName: string | undefined;

	uuid = uuid();

	@Input() set tier(value: Tier) {
		if (!value) {
			return;
		}
		this.groups = value?.groups ?? [];
		this.tierName = value.tierName;
		this.type = value.type;
		this.tavernTierData$$.next(value.tavernTierData ?? null);
	}

	@Input() set highlightedTribes(value: readonly Race[]) {
		this.highlightedTribes$$.next(value);
	}
	@Input() set highlightedMechanics(value: readonly GameTag[]) {
		this.highlightedMechanics$$.next(value);
	}

	@Input() highlightedMinions: readonly string[];
	@Input() showTribesHighlight: boolean;
	@Input() showGoldenCards: boolean;
	@Input() showTrinketTips: boolean;

	private type: TierViewType;

	private highlightedTribes$$ = new BehaviorSubject<readonly Race[]>([]);
	private highlightedMechanics$$ = new BehaviorSubject<readonly GameTag[]>([]);
	private tavernTierData$$ = new BehaviorSubject<GameTag | Race | null>(null);

	constructor(protected readonly cdr: ChangeDetectorRef, private readonly highlighter: BgsBoardHighlighterService) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.highlightedTribes$ = this.highlightedTribes$$.asObservable();
		this.highlightedMechanics$ = this.highlightedMechanics$$.asObservable();
		this.highlighted$ = combineLatest([
			this.highlightedTribes$,
			this.highlightedMechanics$,
			this.tavernTierData$$,
		]).pipe(
			this.mapData(([highlightedTribes, highlightedMechanics, tavernTierData]) => {
				return (
					highlightedTribes?.includes(tavernTierData as Race) ||
					highlightedMechanics?.includes(tavernTierData as GameTag)
				);
			}),
		);
	}

	resetHighlights() {
		this.highlighter.resetHighlights();
	}

	trackByGroup(index, item: TierGroup) {
		return item.label;
	}

	toggleHighlight() {
		if (!this.tavernTierData$$.value) {
			return;
		}

		switch (this.type) {
			case 'tribe':
				this.highlighter.toggleTribesToHighlight([this.tavernTierData$$.value as Race]);
				break;
			case 'mechanics':
				this.highlighter.toggleMechanicsToHighlight([this.tavernTierData$$.value as GameTag]);
				break;
		}
	}
}
