import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RewardTrackType } from '@firestone-hs/reference-data';
import { Preferences } from '../../../models/preferences';

@Component({
	selector: 'bgs-quests-widget',
	styleUrls: [
		`../../../../css/themes/decktracker-theme.scss`,
		'../../../../css/component/overlays/quests/bgs-quests-widget.component.scss',
	],
	template: `
		<!-- TODO: change icons + maybe the overall style? -->
		<quests-widget-view
			class="widget"
			[theme]="'battlegrounds-theme'"
			[widgetIcon]="'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/quest_log_bg.png'"
			[xpIcon]="'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/reward_track_xp_bg.png'"
			[rewardsTrackMatcher]="rewardsTrackMatcher"
			[showPrefsExtractor]="showPrefsExtractor"
		>
		</quests-widget-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsQuestsWidgetComponent {
	rewardsTrackMatcher: (type: RewardTrackType) => boolean = (type: RewardTrackType) =>
		type === RewardTrackType.BATTLEGROUNDS;
	showPrefsExtractor: (prefs: Preferences) => boolean = (prefs) => prefs.bgsShowQuestsWidget;
}
