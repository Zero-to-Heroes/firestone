import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	ViewRef,
} from '@angular/core';
import { TIMEWARPED_MMR_PERCENTILE } from '@firestone/battlegrounds/services';
import { buildColor } from '@firestone/constructed/view';
import { BgsTimewarpedCardChoiceOption } from '@firestone/game-state';
import { BGS_TIMEWARPED_DAILY_FREE_USES, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'choosing-card-bgs-timewarped-option',
	styleUrls: ['./choosing-card-bgs-timewarped-option.component.scss'],
	template: `
		<div class="option">
			<div class="stats-container scalable">
				<div class="category-container placement">
					<div class="free-uses-left" *ngIf="_freeUsesLeft" [helpTooltip]="freeUsesTooltip">
						<div class="text">
							{{ freeUsesText }}
						</div>
					</div>
					<div class="category">
						<div class="stats">
							<div class="stat tier {{tierDisplay}}">
								<div class="header" [fsTranslate]="'battlegrounds.in-game.timewarped.tier-header'"></div>
								<div class="value">{{ tierDisplay }}</div>
							</div>
							<div class="stat impact">
								<div
									class="header"
									[fsTranslate]="'battlegrounds.in-game.timewarped.impact-header'"
									[helpTooltip]="impactTooltip"
								></div>
								<div class="value" [style.color]="impactColor">{{ impactDisplay }}</div>
							</div>
							<!-- <div class="stat placement">
								<div
									class="header"
									[fsTranslate]="'battlegrounds.in-game.timewarped.placement-header'"
									[helpTooltip]="'battlegrounds.in-game.timewarped.placement-header-tooltip' | fsTranslate"
								></div>
								<div class="value" [style.color]="placementColor">{{ placementDisplay }}</div>
							</div> -->
							<!-- <div class="stat data-points">
								<div
									class="header"
									[fsTranslate]="'battlegrounds.in-game.timewarped.data-points-header'"
									[helpTooltip]="dataPointsTooltip"
								></div>
								<div class="value">{{ dataPointsDisplay }}</div>
							</div> -->
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardBgsTimewarpedOptionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	impactDisplay: string;
	placementDisplay: string;
	dataPointsDisplay: string;
	tierDisplay: string;

	impactColor: string;
	placementColor: string;
	// dataPointsColor: string;

	@Input() set option(value: BgsTimewarpedCardChoiceOption) {
		const loc = this.i18n.formatCurrentLocale();
		this.cardId = value.cardId;
		this.impactDisplay = value.impact == null ? '-' : value.impact.toLocaleString(loc, {
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
			signDisplay: 'exceptZero',
		});
		this.placementDisplay = value.averagePlacement == null ? '-' : value.averagePlacement.toLocaleString(loc, {
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
		});
		this.dataPointsDisplay = value.dataPoints == null ? '0' : value.dataPoints.toLocaleString(loc, {
			maximumFractionDigits: 0,
			minimumFractionDigits: 0,
		});
		this.tierDisplay = value.tier == null ? '-' : value.tier;

		// Negative impact is good (lower placement = better)
		this.impactColor = buildColor(
			'hsl(112, 100%, 64%)',
			'hsl(0, 100%, 64%)',
			value.impact,
			-0.2,
			0.2,
		);
		// this.placementColor = buildColor(
		// 	'hsl(112, 100%, 64%)',
		// 	'hsl(0, 100%, 64%)',
		// 	(value.averagePlacement ?? 0),
		// 	3.6,
		// 	4.5,
		// );
		// this.dataPointsColor = buildColor(
		// 	'hsl(112, 100%, 64%)',
		// 	'hsl(0, 100%, 64%)',
		// 	value.dataPoints,
		// 	10000,
		// 	0,
		// );
	}

	@Input() set freeUsesLeft(value: number) {
		this._freeUsesLeft = value;
		this.freeUsesText = this.i18n.translateString('battlegrounds.in-game.timewarped.free-uses-text', {
			value: value,
		});
		this.freeUsesTooltip = this.i18n.translateString('battlegrounds.in-game.timewarped.free-uses-tooltip', {
			max: BGS_TIMEWARPED_DAILY_FREE_USES,
			left: value,
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	cardId: string;
	_freeUsesLeft: number;
	freeUsesTooltip: string;
	freeUsesText: string;
	impactTooltip: string = this.i18n.translateString('battlegrounds.in-game.timewarped.impact-header-tooltip', {
		value: TIMEWARPED_MMR_PERCENTILE,
	});
	dataPointsTooltip: string = this.i18n.translateString('battlegrounds.in-game.timewarped.data-points-header-tooltip', {
		value: TIMEWARPED_MMR_PERCENTILE,
	});

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
