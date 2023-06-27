// When changing these feature flags, don't forget to update the new-version component
export class FeatureFlags {
	public static readonly ENABLE_DUELS_OOC = true;
	public static readonly ENABLE_DUELS_DECK_BUILDER = true;
	public static readonly ENABLE_DUELS_DECK_BUILDER_BUCKETS = true;
	public static readonly ENABLE_DECK_VERSIONS = true;
	public static readonly ENABLE_MAILBOX_TAB = true;

	public static readonly ACHIEVEMENT_PINS = false;

	// Shelved for now
	public static readonly ENABLE_CONSTRUCTED_META_DECKS = false;
	public static readonly ENABLE_DETAILED_MERC = false;
	public static readonly ENABLE_MULTI_GRAPHS = false;
	public static readonly SHOW_CONSTRUCTED_SECONDARY_WINDOW = false; // Doesn't work anymore?
	public static readonly ENABLE_RANKED_ARCHETYPE = false; // Doesn't work anymore?
}
