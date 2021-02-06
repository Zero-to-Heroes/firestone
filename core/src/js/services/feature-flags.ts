export class FeatureFlags {
	// Deprecated, features are part of prod now
	// When changing these feature flags, don't forget to update the new-version component
	public static readonly ENABLE_CLIPBOARD_SHARE = true;
	public static readonly ENABLE_REDDIT_SHARE = true;
	public static readonly ENABLE_BG_SIMULATION_PLAY_ON_OVERLAY = true;
	public static readonly ENABLE_BG_OPPONENT_MOUSE_OVER = true;
	public static readonly ENABLE_BG_MINIONS_LIST = true;

	public static readonly ENABLE_BG_SIMULATION_SHOW_ONLY_ON_RECRUIT = false;
	public static readonly ENABLE_BG_SIMULATION_HIDE_ON_RECRUIT = false;
	public static readonly ENABLE_DECKTRACKER_RESET_POSITIONS = false;
	public static readonly ENABLE_BG_TRIBE_HIGHLIGHT = false;
	public static readonly SHOW_CONSTRUCTED_SECONDARY_WINDOW = false;
	public static readonly ENABLE_RANKED_ARCHETYPE = false;
	public static readonly ENABLE_REAL_TIME_STATS = true;

	// Deprecated, feature is sidelined for now
	public static readonly ENABLE_CONSTRUCTED_RANKING_GRAPH = false;
}
