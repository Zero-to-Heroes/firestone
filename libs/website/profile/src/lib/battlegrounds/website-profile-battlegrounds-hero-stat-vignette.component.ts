import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ExtendedProfileBgHeroStat } from '../+state/website/profile.models';

@Component({
	selector: 'website-profile-battlegrounds-hero-stat-vignette',
	styleUrls: [`./website-profile-battlegrounds-hero-stat-vignette.component.scss`],
	template: `
		<div class="card vignette">
			<div class="name">{{ heroName }}</div>
			<bgs-hero-portrait class="portrait" [heroCardId]="heroCardId"></bgs-hero-portrait>
			<div class="stats">
				<div
					class="stat games-played"
					[helpTooltip]="'website.battlegrounds.games-played-tooltip' | fsTranslate"
				>
					<div class="label" [fsTranslate]="'website.battlegrounds.games-played-label'"></div>
					<div class="value">{{ gamesPlayed }}</div>
				</div>
				<div class="stat top-4" [helpTooltip]="'website.battlegrounds.top-4-tooltip' | fsTranslate">
					<div class="label" [fsTranslate]="'website.battlegrounds.top-4-label'">Top 4</div>
					<div class="value">{{ top4 }}</div>
				</div>
				<div class="stat top-1" [helpTooltip]="'website.battlegrounds.top-1-tooltip' | fsTranslate">
					<div class="label" [fsTranslate]="'website.battlegrounds.top-1-label'">Top 1</div>
					<div class="value">{{ top1 }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileBattlegroundsHeroStatVignetteComponent extends AbstractSubscriptionComponent {
	@Input() set stat(value: ExtendedProfileBgHeroStat) {
		this.heroName = value.heroName;
		this.heroCardId = value.heroCardId;
		this.gamesPlayed = value.gamesPlayed;
		this.top4 = value.top4;
		this.top1 = value.top1;
	}

	heroName: string;
	heroCardId: string;
	gamesPlayed: number;
	top4: number;
	top1: number;

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}
}
