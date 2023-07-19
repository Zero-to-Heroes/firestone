import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProfileClassStat } from './profile-class-stat';

@Component({
	selector: 'website-profile-class-stats',
	styleUrls: [`./website-profile-class-stats.component.scss`],
	template: `
		<website-profile-class-stat
			class="stat"
			*ngFor="let stat of classStats"
			[stat]="stat"
		></website-profile-class-stat>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileClassStatsComponent {
	@Input() classStats: readonly ProfileClassStat[] | null;
}
