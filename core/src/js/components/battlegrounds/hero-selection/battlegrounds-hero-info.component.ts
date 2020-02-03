import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { BattlegroundsHero } from '../../../models/battlegrounds/battlegrounds-hero';

@Component({
	selector: 'battlegrounds-hero-info',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/hero-selection/battlegrounds-hero-info.component.scss',
	],
	template: `
		<div class="battlegrounds-hero-info">
			<div class="main-title">Hero details - {{ hero.heroName }}</div>
			<div class="info-group top-info">
				<hero-card [hero]="entity"> </hero-card>
				<div class="play-info-stats">
					<div class="title">Hero info</div>
					<!-- TODO: use icons / images here side-by-side -->
					<div class="tier {{ hero.powerLevel }}">Power: {{ hero.powerLevel || 'U' }}</div>
					<div class="difficulty {{ hero.difficulty }}">Difficulty: {{ hero.difficulty || 'unkown' }}</div>
				</div>
			</div>
			<div class="info-group personal-stats">
				<div class="title">Personal stats</div>
				<div class="number-of-games">Number of games played: {{ hero.numberOfGamesPlayed }}</div>
				<div class="average-place">Average finish place: {{ hero.averageRank }}</div>
			</div>
			<div class="info-group strategy" *ngIf="hero.strategy">
				<div class="title">Strategy</div>
				<div class="text">{{ hero.strategy || 'Here be strategy (soon)' }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroInfoComponent {
	hero: BattlegroundsHero;
	entity: Entity;

	@Input() set config(value: BattlegroundsHero) {
		console.log('setting config', value);
		this.hero = value;
		this.entity = Entity.create({
			cardID: value.cardId,
		} as Entity);
	}
}
