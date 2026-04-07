import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { InlineSVGModule } from 'ng-inline-svg-2';
import {
	ARENA_DISCOVERS_DAILY_FREE_USES,
	ARENA_DRAFT_WEEKLY_FREE_USES,
	ARENA_MULLIGAN_DAILY_FREE_USES,
	BGS_HERO_SELECTION_DAILY_FREE_USES,
	BGS_QUESTS_DAILY_FREE_USES,
	BGS_TIMEWARPED_DAILY_FREE_USES,
	BGS_TRINKETS_DAILY_FREE_USES,
	CONSTRUCTED_DISCOVERS_DAILY_FREE_USES,
	CONSTRUCTED_MULLIGAN_DAILY_FREE_USES,
} from '@firestone/shared/common/service';
import {
	OVERWOLF_DOWNLOAD_URL,
	premiumHero,
	premiumSections,
	premiumSummaryBullets,
	subscribeSteps,
} from './premium-page.content';

@Component({
	standalone: true,
	selector: 'web-premium-page',
	imports: [CommonModule, InlineSVGModule],
	templateUrl: './premium-page.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiumPageComponent implements OnInit {
	readonly hero = premiumHero;
	readonly summaryBullets = premiumSummaryBullets;
	readonly sections = premiumSections;
	readonly steps = subscribeSteps;
	readonly downloadUrl = OVERWOLF_DOWNLOAD_URL;

	readonly freeTierLines: readonly string[];

	constructor(private readonly title: Title) {
		this.freeTierLines = [
			`Constructed: ${CONSTRUCTED_DISCOVERS_DAILY_FREE_USES} Discover overlay uses per day; ${CONSTRUCTED_MULLIGAN_DAILY_FREE_USES} mulligan guide uses per day`,
			`Arena: ${ARENA_DISCOVERS_DAILY_FREE_USES} Discover uses per day; ${ARENA_MULLIGAN_DAILY_FREE_USES} mulligan uses per day; ${ARENA_DRAFT_WEEKLY_FREE_USES} draft overlay use per week`,
			`Battlegrounds: ${BGS_HERO_SELECTION_DAILY_FREE_USES} hero-selection overlay uses per day; ${BGS_QUESTS_DAILY_FREE_USES} quest uses per day; ${BGS_TRINKETS_DAILY_FREE_USES} trinket uses per day; ${BGS_TIMEWARPED_DAILY_FREE_USES} Timewarped uses per day`,
			'Premium removes these limits for the overlays above so you always have the numbers when it counts.',
		];
	}

	ngOnInit(): void {
		this.title.setTitle('Firestone Premium — www.firestoneapp.com');
	}
}
