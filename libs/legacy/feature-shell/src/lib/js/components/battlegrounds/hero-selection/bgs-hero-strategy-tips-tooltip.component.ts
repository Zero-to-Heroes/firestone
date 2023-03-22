import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'bgs-hero-selection-tooltip',
	styleUrls: [`../../../../css/component/battlegrounds/hero-selection/bgs-hero-strategy-tips-tooltip.component.scss`],
	template: `
		<div class="tooltip {{ _cssClass }}" [ngClass]="{ hidden: !_visible }">
			<bgs-strategies-view class="strategies" [heroId]="cardId"></bgs-strategies-view>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroStrategyTipsTooltipComponent {
	cardId: string;
	_visible = true;
	_cssClass: string;

	@Input() set cssClass(value: string) {
		this._cssClass = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set config(value: string) {
		this.cardId = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set visible(value: boolean) {
		if (value === this._visible) {
			return;
		}
		this._visible = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}
}
