import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'website-profile-achievements',
	styleUrls: [`./website-profile-achievements.component.scss`],
	template: `
		<website-profile>
			<div class="overview">
				<!-- achiemenets details -->
			</div>
		</website-profile>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileAchievementsComponent {}
