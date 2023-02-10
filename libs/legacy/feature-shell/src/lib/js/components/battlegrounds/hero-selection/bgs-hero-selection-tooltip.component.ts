import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsMetaHeroStatTierItem } from '../../../services/battlegrounds/bgs-meta-hero-stats';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'bgs-hero-selection-tooltip',
	styleUrls: [
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-tooltip.component.scss`,
	],
	template: `
		<div class="hero-selection-tooltip {{ _cssClass }}" [ngClass]="{ hidden: !_visible }">
			<!-- <img class="buddy" [src]="buddyImage" *ngIf="buddyImage" /> -->
			<img class="hero-power" [src]="heroPowerImage" *ngIf="heroPowerImage" />
			<img class="hero-power" [src]="questImage" *ngIf="questImage" />
			<div class="infos">
				<div class="name">{{ _hero.name }} ({{ totalMatchesText }})</div>
				<bgs-hero-stats [hero]="_hero"></bgs-hero-stats>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionTooltipComponent {
	_hero: BgsMetaHeroStatTierItem;
	_visible = true;
	_cssClass: string;
	heroPowerImage: string;
	questImage: string;
	// buddyImage: string;
	totalMatches: number;
	totalMatchesText: string;

	@Input() set cssClass(value: string) {
		this._cssClass = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set config(value: BgsMetaHeroStatTierItem) {
		this._hero = value;
		this.totalMatches = value.dataPoints;
		this.heroPowerImage = this.i18n.getCardImage(value.heroPowerCardId);
		this.questImage = !!this.heroPowerImage ? null : this.i18n.getCardImage(value.id);
		// this.buddyImage = this.i18n.getCardImage(getBuddy(value.id as CardIds, this.allCards), {
		// 	isBgs: true,
		// });
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

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}
}
