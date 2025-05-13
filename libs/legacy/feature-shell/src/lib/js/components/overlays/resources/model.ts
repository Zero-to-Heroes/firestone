export interface MaxResources {
	readonly health: number | null;
	readonly mana: number | null;
	readonly coins: number | null;
}
export const isDefault = (maxResources: MaxResources): boolean =>
	maxResources.health === 30 && maxResources.mana === 10 && maxResources.coins === 10;
export const nullIfDefaultHealth = (health: number): number => (health === 30 ? null : health);
export const nullIfDefaultMana = (mana: number): number => (mana === 10 ? null : mana);
export const nullIfDefaultCoins = (coins: number): number => (coins === 10 ? null : coins);
