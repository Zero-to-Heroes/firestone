import { SceneMode } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';
import { TwitchBgsState } from './twitch-bgs-state';

export interface TwitchEvent {
	readonly scene: SceneMode;
	readonly deck: GameState;
	readonly bgs: TwitchBgsState;
	readonly streamerPrefs: Partial<Preferences>;
}
