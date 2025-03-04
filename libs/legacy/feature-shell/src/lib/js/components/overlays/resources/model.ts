export interface MaxResources {
	readonly health: number;
	readonly mana: number;
}
export const isDefault = (maxResources: MaxResources): boolean =>
	maxResources.health === 30 && maxResources.mana === 10;
