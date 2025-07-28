import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RewardTrackType } from '@firestone-hs/reference-data';
import { Preferences } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';

@Component({
	standalone: false,
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
