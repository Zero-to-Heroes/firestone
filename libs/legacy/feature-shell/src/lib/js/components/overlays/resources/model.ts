export interface MaxResources {
	readonly health: number | null;
	readonly mana: number | null;
	readonly coins: number | null;
}
export const isDefault = (maxResources: MaxResources): boolean =>
	(maxResources.health === 30 || maxResources.health == null) &&
	(maxResources.mana === 10 || maxResources.mana == null) &&
	(maxResources.coins === 10 || maxResources.coins == null);
export const nullIfDefaultHealth = (health: number): number => (health === 30 || health == null ? null : health);
export const nullIfDefaultMana = (mana: number): number => (mana === 10 || mana == null ? null : mana);
export const nullIfDefaultCoins = (coins: number): number => (coins === 10 || coins == null ? null : coins);
