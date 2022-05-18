import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'bgs-hero-short-recap',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-hero-short-recap.component.scss',
	],
	template: `
		<div class="short-recap">
			<tavern-level-icon [level]="tavernTier" class="tavern" *ngIf="tavernTier"></tavern-level-icon>
			<div class="triples">
				<img class="icon" [src]="triplesImage" />
				<div class="value">{{ triples }}</div>
			</div>
			<div class="win-streak">
				<img class="icon" [src]="winStreakImage" />
				<div class="value">{{ winStreak }}</div>
			</div>
			<div class="tribes">
				<img class="icon" [src]="tribeImage" />
				<div class="value">{{ tribeCount }}</div>
			</div>
			<div class="damage" [ngClass]="{ 'debuff': damage < 0 }">
				<img class="icon" [src]="damageImage" />
				<div class="value">{{ damage }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroShortRecapComponent {
	@Input() tavernTier: number;
	@Input() triples: number;
	@Input() winStreak: number;
	@Input() tribeImage: string;
	@Input() tribeCount: number;
	@Input() damage: number;

	triplesImage = 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_leaderboard_triple.png';
	winStreakImage = 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_leaderboard_winstreak.png';
	damageImage = 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_leaderboard_damage.png';
}
