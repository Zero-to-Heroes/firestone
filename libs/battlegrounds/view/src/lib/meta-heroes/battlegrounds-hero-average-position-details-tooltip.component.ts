import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Race, getTribeIcon } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'battlegrounds-hero-average-position-details-tooltip',
	styleUrls: [`./battlegrounds-hero-average-position-details-tooltip.component.scss`],
	template: `
		<div class="bgs-hero-average-position-details-tooltip {{ cssClass }}" [ngClass]="{ hidden: !_visible }">
			<div
				class="details-text"
				[fsTranslate]="'battlegrounds.hero-stats.avg-position-details-tooltip-details-text'"
			></div>
			<ul class="modifiers">
				<li class="item base-value">
					<div
						class="label"
						[fsTranslate]="'battlegrounds.hero-stats.avg-position-details-tooltip-base-value'"
					></div>
					<div class="value">{{ baseValue }}</div>
				</li>
				<li class="item anomaly" *ngFor="let anomaly of anomalies">
					<img class="icon" [src]="anomaly.icon" />
					<div class="label">{{ anomaly.name }}</div>
					<div class="value {{ anomaly.valueClass }}">{{ anomaly.value }}</div>
				</li>
				<li class="item tribe" *ngFor="let tribe of tribes">
					<img class="icon" [src]="tribe.icon" />
					<div class="label">{{ tribe.name }}</div>
					<div class="value {{ tribe.valueClass }}">{{ tribe.value }}</div>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroAveragePositionDetailsTooltipComponent {
	@Input() cssClass: string;
	@Input() set visible(value: boolean) {
		this._visible = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set config(value: BgsHeroAveragePositionDetails) {
		if (!value) {
			return;
		}

		this.baseValue = value.baseValue.toLocaleString(this.i18n.formatCurrentLocale(), {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
		this.tribes =
			value.tribeModifiers
				?.map((tribe) => ({
					icon: getTribeIcon(tribe.tribe),
					name: this.i18n.translateString(`global.tribe.${Race[tribe.tribe].toLowerCase()}`),
					value: Math.abs(tribe.impact).toLocaleString(this.i18n.formatCurrentLocale(), {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					}),
					valueClass: tribe.impact > 0 ? 'positive' : tribe.impact < 0 ? 'negative' : 'neutral',
					impact: tribe.impact,
				}))
				.sort((a, b) => b.impact - a.impact) ?? [];
		this.anomalies =
			value.anomalyModifiers
				?.map((anomaly) => ({
					icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${anomaly.cardId}.jpg`,
					name: this.allCards.getCard(anomaly.cardId)?.name,
					value: Math.abs(anomaly.impact).toLocaleString(this.i18n.formatCurrentLocale(), {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					}),
					valueClass: anomaly.impact > 0 ? 'positive' : anomaly.impact < 0 ? 'negative' : 'neutral',
					impact: anomaly.impact,
				}))
				.sort((a, b) => b.impact - a.impact) ?? [];
	}

	_visible: boolean;

	baseValue: string;
	tribes: readonly {
		icon: string;
		name: string;
		value: string;
		valueClass: string;
	}[];
	anomalies: readonly {
		icon: string;
		name: string;
		value: string;
		valueClass: string;
	}[];

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {}
}

export interface BgsHeroAveragePositionDetails {
	readonly baseValue: number;
	readonly tribeModifiers: readonly BgsHeroAveragePositionDetailsTribe[];
	readonly anomalyModifiers: readonly BgsHeroAveragePositionDetailsAnomaly[];
}

export interface BgsHeroAveragePositionDetailsTribe {
	readonly tribe: Race;
	readonly impact: number;
}

export interface BgsHeroAveragePositionDetailsAnomaly {
	readonly cardId: string;
	readonly impact: number;
}
