import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Race, getTribeIcon } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'battlegrounds-tribe-details-tooltip',
	styleUrls: [`./battlegrounds-tribe-details-tooltip.component.scss`],
	template: `
		<ul class="bgs-tribe-details-tooltip {{ cssClass }}">
			<li class="item tribe" *ngFor="let tribe of tribes" [ngClass]="{ missing: !tribe.inGame }">
				<img class="icon" [src]="tribe.icon" />
				<div class="label">{{ tribe.name }}</div>
				<div class="value {{ tribe.valueClass }}">{{ tribe.value }}</div>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTribeDetailsTooltipComponent {
	@Input() cssClass: string;

	@Input() set config(value: BgsTribesImpactDetails) {
		console.debug('setting tribes', value);
		if (!value) {
			return;
		}

		this.tribes =
			value.tribeImpacts
				?.map((tribe) => ({
					icon: getTribeIcon(tribe.tribe),
					name: this.i18n.translateString(`global.tribe.${Race[tribe.tribe].toLowerCase()}`),
					value: Math.abs(tribe.impact).toLocaleString(this.i18n.formatCurrentLocale(), {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					}),
					valueClass: tribe.impact < 0 ? 'positive' : tribe.impact > 0 ? 'negative' : 'neutral',
					impact: tribe.impact,
					inGame: tribe.inGame,
				}))
				.sort((a, b) => a.impact - b.impact) ?? [];
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	_visible: boolean;

	baseValue: string;
	tribes: readonly {
		icon: string;
		name: string;
		value: string;
		valueClass: string;
		inGame: boolean;
	}[];

	constructor(private readonly i18n: ILocalizationService, private readonly cdr: ChangeDetectorRef) {}
}

export interface BgsTribesImpactDetails {
	readonly tribeImpacts: readonly TribeImpact[];
}

export interface TribeImpact {
	readonly tribe: Race;
	readonly impact: number;
	readonly inGame: boolean;
}
