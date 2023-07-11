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
			text: 'You can assign a deck as a new version of another one by dragging it on top of the old one',
			premium: false,
		},
		{
			file: 'collection_stats.webm',
			type: 'video',
			text: 'You can see the card history and global stats for the displayed sets, and switch between them at any time',
			premium: true,
		},
		{
			file: 'lottery.jpg?v=2',
			type: 'image',
			text: 'You can participate in monthly lottery to win premium Firestone subscriptions (enable it from the Settings > General > Lottery page)',
			premium: false,
		},
		{
			file: 'achievements_pick_for_me.webm',
			type: 'video',
			text: 'You can let the app pick 3 achievements to track for you',
			premium: false,
		},
		{
			file: 'achievements_pin.webm',
			type: 'video',
			text: 'Select any number of achievements to track them during gameplay, and see them update them in real time',
			premium: false,
		},
		{
			file: 'share_profile_page.webm',
			type: 'video',
			text: 'Access your own profile page online, and share it with others to show off your achievements and stats',
			premium: true,
		},
		{
			file: 'contextual_related_cards_3.webm',
			type: 'video',
			text: 'Mouse over certain cards in the tracker to have more info on what they will do',
			premium: false,
		},
		{
			file: 'etc_buddies.jpg',
			type: 'image',
			text: 'When playing as E.T.C. Band Manager, you can see all the buddies in the Discover pool',
			premium: false,
		},
		{
			file: 'bg_hero_select.webm',
			type: 'video',
			text: 'You can get stats for each hero, directly on the hero selection screen',
			premium: true,
		},
		{
			file: 'bg_tab_key.webm',
			type: 'video',
			text: 'You can get advice from some of the best players in the game directly from the overlay and adopt their strategies',
			premium: true,
		},
		{
			file: 'bg_tab_key.webm',
			type: 'video',
			text: 'Press "Tab" to get a quick overview of the progress of all players in the lobby',
			premium: true,
		},
		{
			file: 'guess_the_weight.webm',
			type: 'video',
			text: 'Some cards have contextual help during Discovers',
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
			text: 'Mousing over a card while Discovering highlights the relevant information in your deck',
			premium: false,
		},
		{
			file: 'minion_play_order.jpg',
			type: 'image',
			text: 'The number at the top of each minion on board gives you the order in which they arrived - which is the order in which Deathrattles resolve',
			premium: false,
		},
		{
			file: 'mercs_terasure_highlight.webm',
			type: 'video',
			text: 'Mousing over a treasure in Mercs highilghts the synergies in your team',
			premium: false,
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
