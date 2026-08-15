/**
 * Visual spawn-to-deck FX that create temporary history entities (SHOW_ENTITY in DECK, then SETASIDE).
 * The real pieces are added by game-state (CthunRevealedParser / DragonSoulShattered customEffect).
 */
export const IGNORE_SPAWN_TO_DECK_FX_PREFABS: readonly string[] = [
	'DMFFX_SpawnToDeck_CthunTheShattered_CardFromScript_FX',
	'CATAFX_DragonSoul_Shattered_StartOfGame_FX',
];

export const isIgnoredSpawnToDeckFxPrefab = (prefab: string | null | undefined): boolean =>
	!!prefab && IGNORE_SPAWN_TO_DECK_FX_PREFABS.includes(prefab);
