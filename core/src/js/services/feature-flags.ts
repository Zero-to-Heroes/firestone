export class FeatureFlags {
	// Deprecated, features are part of prod now
	public static readonly ENABLE_BG_DESKTOP = true;
	public static readonly ENABLE_DECK_DETAILS = true;
	public static readonly ENABLE_XP_NOTIFICATION = true;

	// When changing these feature flags, don't forget to update the new-version component
	public static readonly ENABLE_DUELS = true;
	public static readonly ENABLE_NEW_VERSION_NOTIFICATION = true;

	public static readonly SHOW_HS_ACHIEVEMENTS = true;
	public static readonly ENABLE_BG_POSTMATCH_SHARE_REDDIT = true;
	public static readonly ENABLE_BG_SIMULATION_PLAY_ON_OVERLAY = true;

	public static readonly ENABLE_CONSTRUCTED_RANKING_GRAPH = false;
}
