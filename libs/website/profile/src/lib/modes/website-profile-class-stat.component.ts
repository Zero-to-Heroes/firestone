import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CardClass } from '@firestone-hs/reference-data';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { WebsiteLocalizationService } from '@firestone/website/core';
import { ProfileClassStat } from './profile-class-stat';

@Component({
	selector: 'website-profile-class-stat',
	styleUrls: [`./website-profile-class-stat.component.scss`],
	template: `
		<div class="card overview" [helpTooltip]="tooltip">
			<div class="title">{{ title }}</div>
			<img class="icon" [src]="icon" />
			<div class="value">
				<div class="wins">{{ wins }}</div>
				<div class="losses">{{ losses }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileClassStatComponent extends AbstractSubscriptionComponent {
	@Input() set stat(value: ProfileClassStat) {
		const lowerCaseClass = CardClass[value.playerClass]?.toLowerCase();
		this.title = this.i18n.translateString(`global.class.${lowerCaseClass}`);
		this.icon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${lowerCaseClass}.png`;
		this.wins = value.wins;
		this.losses = value.losses;
	}

	title: string;
	tooltip: string;
	icon: string;
	wins: number | null;
	losses: number | null;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: WebsiteLocalizationService) {
		super(cdr);
	}
}
