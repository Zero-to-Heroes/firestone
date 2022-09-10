import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RewardTrackType } from '@firestone-hs/reference-data';
import { Preferences } from '../../../models/preferences';

@Component({
	selector: 'hs-quests-widget',
	styleUrls: [
		`../../../../css/themes/decktracker-theme.scss`,
		'../../../../css/component/overlays/quests/hs-quests-widget.component.scss',
	],
	template: `
		<quests-widget-view
			[theme]="'decktracker-theme'"
			[widgetIcon]="'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/quest_log_2.png'"
			[rewardsTrack]="rewardsTrack"
			[showPrefsExtractor]="showPrefsExtractor"
		>
		</quests-widget-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsQuestsWidgetComponent {
	rewardsTrack = RewardTrackType.GLOBAL;
	showPrefsExtractor: (prefs: Preferences) => boolean = (prefs) => prefs.hsShowQuestsWidget;
}
