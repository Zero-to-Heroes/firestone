import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RewardTrackType } from '@firestone-hs/reference-data';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { Preferences } from '../../../models/preferences';

@Component({
	selector: 'hs-quests-widget',
	styleUrls: [
		`../../../../css/themes/decktracker-theme.scss`,
		'../../../../css/component/overlays/quests/hs-quests-widget.component.scss',
	],
	template: `
		<quests-widget-view
			class="widget"
			[theme]="'decktracker-theme'"
			[widgetIcon]="'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/quest_log_2.png'"
			[xpIcon]="'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/reward_track_xp.webp'"
			[xpBonusIcon]="
				'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/reward_track_xp_boost.webp'
			"
			[rewardsTrackMatcher]="rewardsTrackMatcher"
			[showPrefsExtractor]="showPrefsExtractor"
			[xpBonusExtractor]="xpBonusExtractor"
		>
		</quests-widget-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsQuestsWidgetComponent {
	rewardsTrackMatcher: (type: RewardTrackType) => boolean = (type: RewardTrackType) =>
		// NONE is for tutorial quests, apparently
		// type !== RewardTrackType.NONE &&
		type !== RewardTrackType.BATTLEGROUNDS;
	showPrefsExtractor: (prefs: Preferences) => boolean = (prefs) => prefs.hsShowQuestsWidget;
	xpBonusExtractor: (state: MainWindowState, type: RewardTrackType) => number = (state, type) =>
		type === RewardTrackType.GLOBAL ? state.quests.xpBonus : 0;
}
