import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'bgs-hero-selection-tooltip',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-tooltip.component.scss`,
	],
	template: `
		<div class="hero-selection-tooltip" [ngClass]="{ 'hidden': !_visible }">
			<img class="hero-power" [src]="heroPowerImage" />
			<div class="infos">
				<div class="name">{{ _hero.name }} ({{ totalMatchesText }})</div>
				<bgs-hero-stats [hero]="_hero"></bgs-hero-stats>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionTooltipComponent {
	_hero: BgsHeroStat;
	_visible = true;
	heroPowerImage: string;
	totalMatches: number;
	totalMatchesText: string;

	@Input() set config(value: BgsHeroStat) {
		this._hero = value;
		this.totalMatches = value.totalMatches;
		this.heroPowerImage = this.i18n.getCardImage(value.heroPowerCardId);
		this.totalMatchesText = this.i18n.translateString('battlegrounds.hero-selection.total-matches', {
			value: this.totalMatches?.toLocaleString(this.i18n.formatCurrentLocale()) || 0,
		});
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

	constructor(private readonly cdr: ChangeDetectorRef, private i18n: LocalizationFacadeService) {}
}
