import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService } from '@firestone/battlegrounds/common';
import { ExtendedReferenceCard, TierGroup } from '@firestone/battlegrounds/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'bgs-minions-group',
	styleUrls: [`../../../../css/global/cdk-overlay.scss`, './bgs-minions-group.component.scss'],
	template: `
		<div class="bgs-minions-group">
			<div class="header">
				<div class="header-text">{{ title }}</div>
				<div
					class="highlight-button"
					*ngIf="tribe && showTribesHighlight"
					[ngClass]="{ highlighted: highlighted$ | async }"
					inlineSVG="assets/svg/pinned.svg"
					(click)="highlightTribe(tribe)"
					[helpTooltip]="highlightTribeTooltip"
					[helpTooltipPosition]="'left'"
				></div>
			</div>

			<ul class="minions">
				<bgs-minion-item
					class="minion"
					*ngFor="let minion of minions; trackBy: trackByFn"
					[minion]="minion"
					[showGoldenCards]="showGoldenCards"
					[showTrinketTips]="showTrinketTips"
					[highlightedMinions]="highlightedMinions"
					[highlightedTribes]="highlightedTribes$ | async"
					[highlightedMechanics]="highlightedMechanics"
					[showTribesHighlight]="showTribesHighlight"
				></bgs-minion-item>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsGroupComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	highlighted$: Observable<boolean>;
	highlightedTribes$: Observable<readonly Race[]>;

	minions: readonly ExtendedReferenceCard[];
	tribe: Race;
	title: string;
	highlightTribeTooltip: string;

	@Input() set group(value: TierGroup) {
		this.tribe = value.tribe;
		this.title = value.label;
		this.minions = value.cards;
		this.highlightTribeTooltip = this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-tribe', {
			value: this.title,
		});
		this.group$$.next(value);
	}
	@Input() set highlightedTribes(value: readonly Race[]) {
		this.highlightedTribes$$.next(value ?? []);
	}

	@Input() showGoldenCards: boolean;
	@Input() showTrinketTips: boolean;
	@Input() highlightedMinions: readonly string[];
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() showTribesHighlight: boolean;

	private group$$ = new BehaviorSubject<TierGroup | null>(null);
	private highlightedTribes$$ = new BehaviorSubject<readonly Race[]>([]);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly highlighter: BgsBoardHighlighterService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.highlightedTribes$ = this.highlightedTribes$$.pipe(this.mapData((value) => value));
		this.highlighted$ = combineLatest([this.group$$, this.highlightedTribes$$]).pipe(
			this.mapData(([group, highlightedTribes]) => highlightedTribes.includes(group.tribe)),
		);
	}

	highlightTribe(tribe: Race) {
		this.highlighter.toggleTribesToHighlight([tribe]);
	}

	trackByFn(index: number, minion: ReferenceCard) {
		return minion.id;
	}
}
