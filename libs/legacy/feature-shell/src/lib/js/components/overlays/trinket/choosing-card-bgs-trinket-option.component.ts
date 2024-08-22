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
import { buildColor } from '@firestone/constructed/common';
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
			<div class="category-container placement">
				<div class="free-uses-left" *ngIf="_freeUsesLeft" [helpTooltip]="freeUsesTooltip">
					<div class="text">
						{{ freeUsesText }}
					</div>
				</div>
				<div class="category">
					<div
						class="title"
						[fsTranslate]="'battlegrounds.in-game.trinkets.placement-title'"
						[helpTooltip]="'battlegrounds.in-game.trinkets.placement-title-tooltip' | fsTranslate"
					></div>
					<div class="stats">
						<div class="stat average">
							<div
								class="header"
								[fsTranslate]="'battlegrounds.in-game.trinkets.global-header'"
								[helpTooltip]="'battlegrounds.in-game.trinkets.global-header-tooltip' | fsTranslate"
							></div>
							<div class="value" [style.color]="placementGlobalColor">{{ placementGlobal }}</div>
						</div>
						<div class="stat high-mmmr">
							<div
								class="header"
								[fsTranslate]="'battlegrounds.in-game.trinkets.high-mmr-header'"
								[helpTooltip]="'battlegrounds.in-game.trinkets.high-mmr-header-tooltip' | fsTranslate"
								[translateParams]="{ value: 25 }"
							></div>
							<div class="value" [style.color]="placementHighMmrColor">{{ placementHighMmr }}</div>
						</div>
					</div>
				</div>
			</div>
			<div class="category-container pick-rate">
				<div class="category">
					<div
						class="title"
						[fsTranslate]="'battlegrounds.in-game.trinkets.pick-rate-title'"
						[helpTooltip]="'battlegrounds.in-game.trinkets.pick-rate-title-tooltip' | fsTranslate"
					></div>
					<div class="stats">
						<div class="stat average">
							<div
								class="header"
								[fsTranslate]="'battlegrounds.in-game.trinkets.global-header'"
								[helpTooltip]="'battlegrounds.in-game.trinkets.global-header-tooltip' | fsTranslate"
							></div>
							<div class="value" [style.color]="pickRateGlobalColor">{{ pickRateGlobal }}</div>
						</div>
						<div class="stat high-mmmr">
							<div
								class="header"
								[fsTranslate]="'battlegrounds.in-game.trinkets.high-mmr-header'"
								[helpTooltip]="'battlegrounds.in-game.trinkets.high-mmr-header-tooltip' | fsTranslate"
								[translateParams]="{ value: 25 }"
							></div>
							<div class="value" [style.color]="pickRateHighMmrColor">{{ pickRateHighMmr }}</div>
						</div>
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

	placementGlobalColor: string;
	placementHighMmrColor: string;
	pickRateGlobalColor: string;
	pickRateHighMmrColor: string;

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
		this.pickRateGlobal = (100 * value.pickRate).toLocaleString(loc, {
			maximumFractionDigits: 1,
			minimumFractionDigits: 1,
		});
		this.pickRateHighMmr = (100 * value.pickRateTop25).toLocaleString(loc, {
			maximumFractionDigits: 1,
			minimumFractionDigits: 1,
		});

		this.placementGlobalColor = buildColor(
			'hsl(112, 100%, 64%)',
			'hsl(0, 100%, 64%)',
			-(value.averagePlacement ?? 0),
			-3,
			-4.7,
		);
		this.placementHighMmrColor = buildColor(
			'hsl(112, 100%, 64%)',
			'hsl(0, 100%, 64%)',
			-(value.averagePlacementTop25 ?? 0),
			-3,
			-4.7,
		);
		this.pickRateGlobalColor = buildColor(
			'hsl(112, 100%, 64%)',
			'hsl(0, 100%, 64%)',
			value.pickRate ?? 0,
			0.6,
			0.2,
		);
		this.pickRateHighMmrColor = buildColor(
			'hsl(112, 100%, 64%)',
			'hsl(0, 100%, 64%)',
			value.pickRateTop25 ?? 0,
			0.6,
			0.2,
		);
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
