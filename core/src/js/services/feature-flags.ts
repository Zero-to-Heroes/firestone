// When changing these feature flags, don't forget to update the new-version component
export class FeatureFlags {
	public static readonly ENABLE_CONSTRUCTED_RANKING_GRAPH = true;
	public static readonly ENABLE_DUELS_LEADERBOARD = true;
	public static readonly ENABLE_BGS_FULL_SIMULATOR = true;
	public static readonly ENABLE_MERCENARIES_TAB = true;
	public static readonly ENABLE_DETAILED_MERC = false;

	public static readonly ENABLE_STATS_TAB = true;
	public static readonly ENABLE_MERCENARIES_TEAM_WIDGET = true;

	public static readonly ENABLE_SESSION_WIDGET = true;

	// Shelved for now
	public static readonly ENABLE_MULTI_GRAPHS = false;
	public static readonly SHOW_CONSTRUCTED_SECONDARY_WINDOW = false; // Doesn't work anymore?
	public static readonly ENABLE_RANKED_ARCHETYPE = false; // Doesn't work anymore?
}
