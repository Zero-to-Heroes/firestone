/* eslint-disable no-mixed-spaces-and-tabs */
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
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sleep } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { combineLatest, takeUntil } from 'rxjs';
import { ConstructedCardStat } from '../services/constructed-discover.service';

@Component({
	selector: 'constructed-card-option-view',
	styleUrls: ['./constructed-card-option-view.component.scss'],
	template: `
		<div class="info-container scalable">
			<div class="stats impact">
				<div class="stat winrate discover" *ngIf="impact !== '-'" [helpTooltip]="tooltip">
					<span
						class="label"
						[fsTranslate]="'app.decktracker.meta.details.cards.discovered-winrate-impact-header'"
					></span>
					<span class="value {{ winrateClass }}" [ngClass]="{ 'low-data': lowData }">
						{{ impact }}
						<div class="warning" inlineSVG="assets/svg/attention.svg"></div>
					</span>
				</div>
				<div class="stat winrate discover" *ngIf="impact === '-'">
					<span class="value" [helpTooltip]="'decktracker.overlay.mulligan.no-mulligan-data' | fsTranslate"
						>-</span
					>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedCardOptionViewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() set card(value: ConstructedCardStat | null) {
		this.impact = value?.discoverImpact == null ? '-' : (100 * value.discoverImpact).toFixed(2);
		this.winrateClass = value?.discoverImpact == null ? '' : value.discoverImpact > 0 ? 'positive' : 'negative';
		this.lowData = value?.dataPoints == null || value.dataPoints < 100;
		this.tooltip = this.lowData
			? this.i18n.translateString(
					'app.decktracker.meta.details.cards.discovered-winrate-impact-tooltip-low-data',
					{
						value: value?.dataPoints ?? 0,
					},
			  )
			: this.i18n.translateString('app.decktracker.meta.details.cards.discovered-winrate-impact-tooltip-data', {
					value: value?.dataPoints ?? 0,
			  });
	}

	impact: string;
	winrateClass: string;
	tooltip: string | null;
	lowData: boolean;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaDraftOverlayScale ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(async ([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				const element = await this.getScalable();
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
				// this.renderer.setStyle(element, 'top', `calc(${newScale} * 1.5vh)`);
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async getScalable(): Promise<ElementRef<HTMLElement>> {
		let element = this.el.nativeElement.querySelector('.scalable');
		let retriesLeft = 10;
		while (!element && retriesLeft > 0) {
			await sleep(200);
			element = this.el.nativeElement.querySelector('.scalable');
			retriesLeft--;
		}
		return element;
	}
}
