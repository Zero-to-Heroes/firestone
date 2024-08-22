import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsTrinketCardChoiceOption, DAILY_FREE_USES_TRINKETS } from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs';

// TODO: sample size
@Component({
	selector: 'choosing-card-bgs-trinket-option',
	styleUrls: ['./choosing-card-bgs-trinket-option.component.scss'],
	template: `
		<div class="option scalable">
			<div class="free-uses-left" *ngIf="_freeUsesLeft" [helpTooltip]="freeUsesTooltip">
				{{ freeUsesText }}
			</div>
			<div class="category placement">
				<div
					class="title"
					[fsTranslate]="'battlegrounds.in-game.trinkets.placement-title'"
					[helpTooltip]="'battlegrounds.in-game.trinkets.placement-title-tooltip'"
				></div>
				<div class="stats">
					<div class="stat average">
						<div
							class="header"
							[fsTranslate]="'battlegrounds.in-game.trinkets.global-header'"
							[helpTooltip]="'battlegrounds.in-game.trinkets.global-header-tooltip'"
						></div>
						<div class="value">{{ placementGlobal }}</div>
					</div>
					<div class="stat high-mmmr">
						<div
							class="header"
							[fsTranslate]="'battlegrounds.in-game.trinkets.high-mmr-header'"
							[helpTooltip]="'battlegrounds.in-game.trinkets.high-mmr-header-tooltip'"
							[translateParams]="{ value: 25 }"
						></div>
						<div class="value">{{ placementHighMmr }}</div>
					</div>
				</div>
			</div>
			<div class="category pick-rate">
				<div
					class="title"
					[fsTranslate]="'battlegrounds.in-game.trinkets.pick-rate-title'"
					[helpTooltip]="'battlegrounds.in-game.trinkets.pick-rate-title-tooltip'"
				></div>
				<div class="stats">
					<div class="stat average">
						<div
							class="header"
							[fsTranslate]="'battlegrounds.in-game.trinkets.global-header'"
							[helpTooltip]="'battlegrounds.in-game.trinkets.global-header-tooltip'"
						></div>
						<div class="value">{{ pickRateGlobal }}</div>
					</div>
					<div class="stat high-mmmr">
						<div
							class="header"
							[fsTranslate]="'battlegrounds.in-game.trinkets.high-mmr-header'"
							[helpTooltip]="'battlegrounds.in-game.trinkets.high-mmr-header-tooltip'"
							[translateParams]="{ value: 25 }"
						></div>
						<div class="value">{{ pickRateHighMmr }}</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardBgsTrinketOptionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	placementGlobal: string;
	placementHighMmr: string;
	pickRateGlobal: string;
	pickRateHighMmr: string;

	@Input() set option(value: BgsTrinketCardChoiceOption) {
		const loc = this.i18n.formatCurrentLocale();
		this.placementGlobal = value.averagePlacement.toLocaleString(loc, {
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
		});
		this.placementHighMmr = value.averagePlacementTop25.toLocaleString(loc, {
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
		});
		this.pickRateGlobal = value.pickRate.toLocaleString(loc, {
			maximumFractionDigits: 1,
			minimumFractionDigits: 1,
		});
		this.pickRateHighMmr = value.pickRateTop25.toLocaleString(loc, {
			maximumFractionDigits: 1,
			minimumFractionDigits: 1,
		});
	}

	@Input() set freeUsesLeft(value: number) {
		this._freeUsesLeft = value;
		this.freeUsesText = this.i18n.translateString('battlegrounds.in-game.quests.free-uses-text', {
			value: value,
		});
		this.freeUsesTooltip = this.i18n.translateString('battlegrounds.in-game.quests.free-uses-tooltip', {
			max: DAILY_FREE_USES_TRINKETS,
			left: value,
		});
		console.debug('set free users left', this._freeUsesLeft);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_freeUsesLeft: number;
	freeUsesTooltip: string;
	freeUsesText: string;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

		this.prefs.preferences$$
			.pipe(
				this.mapData((prefs) => prefs.bgsQuestsOverlayScale),
				filter((pref) => !!pref),
				distinctUntilChanged(),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				const newScale = scale / 100;
				const elements = this.el.nativeElement.querySelectorAll('.scalable');
				elements.forEach((element) => this.renderer.setStyle(element, 'transform', `scale(${newScale})`));
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
