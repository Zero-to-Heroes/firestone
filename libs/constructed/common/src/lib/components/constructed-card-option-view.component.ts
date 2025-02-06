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
import { ConstructedCardStat } from '../services/constructed-discover.service';

@Component({
	selector: 'constructed-card-option-view',
	styleUrls: ['./constructed-card-option-view.component.scss'],
	template: `
		<div class="info-container scalable">
			<div class="stats impact">
				<div class="stat winrate draw" *ngIf="drawImpact !== '-'">
					<span
						class="label"
						[fsTranslate]="'app.decktracker.meta.details.cards.drawn-winrate-impact-header'"
					></span>
					<span class="value {{ drawWinrateClass }}">{{ drawImpact }}</span>
				</div>
				<div class="stat winrate discover" *ngIf="drawImpact === '-'">
					<span
						class="label"
						[fsTranslate]="'app.decktracker.meta.details.cards.discovered-winrate-impact-header'"
					></span>
					<span
						class="value {{ discoverWinrateClass }}"
						[ngClass]="{ 'low-data': lowData }"
						[helpTooltip]="discoverTooltip"
						>{{ discoverImpact }}</span
					>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedCardOptionViewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() set card(value: ConstructedCardStat | null) {
		this.drawImpact = value?.drawnImpact == null ? '-' : (100 * value.drawnImpact).toFixed(2);
		this.drawWinrateClass = value?.drawnImpact == null ? '' : value.drawnImpact > 0 ? 'positive' : 'negative';
		this.discoverImpact = value?.discoverImpact == null ? '-' : (100 * value.discoverImpact).toFixed(2);
		this.discoverWinrateClass =
			value?.discoverImpact == null ? '' : value.discoverImpact > 0 ? 'positive' : 'negative';
		this.lowData = value?.discoverNumber == null || value.discoverNumber < 50;
		this.discoverTooltip = this.lowData
			? this.i18n.translateString(
					'app.decktracker.meta.details.cards.discovered-winrate-impact-tooltip-low-data',
					{
						value: value?.discoverNumber ?? 0,
					},
			  )
			: this.i18n.translateString('app.decktracker.meta.details.cards.discovered-winrate-impact-tooltip-data', {
					value: value?.discoverNumber ?? 0,
			  });
	}

	drawImpact: string;
	drawWinrateClass: string;
	discoverImpact: string;
	deckImpact: string;
	discoverWinrateClass: string;
	lowData: boolean;
	discoverTooltip: string | null;

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
		this.prefs.preferences$$
			.pipe(this.mapData((prefs) => prefs.arenaDraftOverlayScale))
			.subscribe(async (value) => {
				const newScale = value / 100;
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
