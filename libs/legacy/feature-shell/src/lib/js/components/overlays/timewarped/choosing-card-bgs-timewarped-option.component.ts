import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	ViewRef,
} from '@angular/core';
import { buildColor } from '@firestone/constructed/common';
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
							<div class="stat impact">
								<div
									class="header"
									[fsTranslate]="'battlegrounds.in-game.timewarped.impact-header'"
									[helpTooltip]="'battlegrounds.in-game.timewarped.impact-header-tooltip' | fsTranslate"
								></div>
								<div class="value" [style.color]="impactColor">{{ impactDisplay }}</div>
							</div>
							<div class="stat placement">
								<div
									class="header"
									[fsTranslate]="'battlegrounds.in-game.timewarped.placement-header'"
									[helpTooltip]="'battlegrounds.in-game.timewarped.placement-header-tooltip' | fsTranslate"
								></div>
								<div class="value" [style.color]="placementColor">{{ placementDisplay }}</div>
							</div>
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

	impactColor: string;
	placementColor: string;

	@Input() set option(value: BgsTimewarpedCardChoiceOption) {
		const loc = this.i18n.formatCurrentLocale();
		this.cardId = value.cardId;
		this.impactDisplay = value.impact.toLocaleString(loc, {
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
			signDisplay: 'exceptZero',
		});
		this.placementDisplay = value.averagePlacement.toLocaleString(loc, {
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
		});

		// Negative impact is good (lower placement = better)
		this.impactColor = buildColor(
			'hsl(112, 100%, 64%)',
			'hsl(0, 100%, 64%)',
			-value.impact,
			-0.1,
			0.1,
		);
		this.placementColor = buildColor(
			'hsl(112, 100%, 64%)',
			'hsl(0, 100%, 64%)',
			-(value.averagePlacement ?? 0),
			-3.9,
			-4.5,
		);
	}

	@Input() set freeUsesLeft(value: number) {
		this._freeUsesLeft = value;
		this.freeUsesText = this.i18n.translateString('battlegrounds.in-game.quests.free-uses-text', {
			value: value,
		});
		this.freeUsesTooltip = this.i18n.translateString('battlegrounds.in-game.quests.free-uses-tooltip', {
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
