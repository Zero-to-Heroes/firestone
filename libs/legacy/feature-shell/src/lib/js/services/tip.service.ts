import { Injectable } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { FeatureFlags } from './feature-flags';
import { pickRandom } from './utils';

@Injectable()
export class TipService {
	private tips: readonly Tip[] = [
		{
			file: 'deck_merge.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.deck_merge'),
			premium: false,
		},
		{
			file: 'collection_stats.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.collection_stats'),
			premium: true,
		},
		{
			file: 'lottery.jpg?v=2',
			type: 'image',
			text: this.i18n.translateString('app.tips.lottery'),
			premium: false,
		},
		{
			file: 'achievements_pick_for_me.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.achievements_pick_for_me'),
			premium: false,
		},
		{
			file: 'achievements_pin.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.achievements_pin'),
			premium: false,
		},
		{
			file: 'share_profile_page.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.share_profile_page'),
			premium: true,
		},
		{
			file: 'contextual_related_cards_3.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.contextual_related_cards'),
			premium: false,
		},
		{
			file: 'etc_buddies.jpg',
			type: 'image',
			text: this.i18n.translateString('app.tips.etc_buddies'),
			premium: false,
		},
		{
			file: 'bg_hero_select.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.bg_hero_select'),
			premium: true,
		},
		{
			file: 'bg_wisdomball.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.bg_wisdomball'),
			premium: true,
		},
		{
			file: 'bg_tab_key.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.bg_tab_key'),
			premium: true,
		},
		{
			file: 'guess_the_weight.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.guess_the_weight'),
			premium: false,
		},
		// {
		// 	file: '.webm',
		// 	type: '',
		// 	text: 'You can report a bug or make a suggestion about the app at any time with the simple click of a button',
		// 	premium: false,
		// },
		// {
		// 	file: '.webm',
		// 	type: '',
		// 	text: 'If the app feels slow or seems stuck, you can quickly restart it from the System Tray icon',
		// 	premium: false,
		// },
		{
			file: 'guess_the_weight.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.discover_highlight'),
			premium: false,
		},
		{
			file: 'minion_play_order.jpg',
			type: 'image',
			text: this.i18n.translateString('app.tips.minion_play_order'),
			premium: false,
		},
		{
			file: 'mercs_terasure_highlight.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.mercs_terasure_highlight'),
			premium: false,
		},
		{
			file: 'quest_stats.webm',
			type: 'video',
			text: this.i18n.translateString('app.tips.quest_stats'),
			premium: true,
		},
		// {
		// 	file: '.webm',
		// 	type: '',
		// 	text: 'Know when your next guaranteed legendary or epic card is coming up in each pack',
		// 	premium: false,
		// },
		// {
		// 	file: '.webm',
		// 	type: '',
		// 	text: 'View latest release notes',
		// 	premium: false,
		// },
	];

	constructor(private readonly i18n: LocalizationFacadeService) {}

	public getRandomTip(): Tip {
		if (!FeatureFlags.APP_TIPS) {
			return null;
		}
		return pickRandom(this.tips);
	}
}
export interface Tip {
	file: string;
	type: 'video' | 'image';
	text: string;
	premium: boolean;
}
