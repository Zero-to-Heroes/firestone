import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { WebsiteLocalizationService } from '@firestone/website/core';

@Component({
	selector: 'website-profile-battlegrounds-overview',
	styleUrls: [`./website-profile-battlegrounds-overview.component.scss`],
	template: `
		<div class="card overview" [helpTooltip]="tooltip">
			<div class="title">{{ title }}</div>
			<img class="icon" [src]="icon" />
			<div class="value">{{ value }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileBattlegroundsOverviewComponent {
	@Input() value: number | null;
	@Input() set mode(value: 'games-played' | 'top-4' | 'top-1') {
		this.title = this.i18n.translateString(`website.battlegrounds.${value}-label-global`);
		this.tooltip = this.i18n.translateString(`website.battlegrounds.${value}-tooltip-global`);
		this.icon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/battlegrounds/${value}.webp`;
	}

	title: string;
	tooltip: string;
	icon: string;

	constructor(private readonly i18n: WebsiteLocalizationService) {}
}
