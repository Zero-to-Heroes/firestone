import { Component, ViewRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';

import { Events } from '../../services/events.service';
import { AchievementSet } from '../../models/achievement-set';
import { VisualAchievement } from '../../models/visual-achievement';
import { AchievementsRepository } from '../../services/achievement/achievements-repository.service';
import { AchievementCategory } from '../../models/achievement-category';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';

const ACHIEVEMENTS_HIDE_TRANSITION_DURATION_IN_MS = 150;

declare var overwolf: any;
declare var ga: any;
declare var _: any;

@Component({
	selector: 'decktracker',
	styleUrls: [
		`../../../css/component/decktracker/decktracker.component.scss`,
	],
	template: `
		<div class="decktracker">
			<section class="main divider">

			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerComponent {

}
