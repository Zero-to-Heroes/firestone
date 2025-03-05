export interface MaxResources {
	readonly health: number;
	readonly mana: number;
}
export const isDefault = (maxResources: MaxResources): boolean =>
	maxResources.health === 30 && maxResources.mana === 10;
export const nullIfDefaultHealth = (health: number): number => (health === 30 ? null : health);
export const nullIfDefaultMana = (mana: number): number => (mana === 10 ? null : mana);
