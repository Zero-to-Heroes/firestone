import { CardIds, getBuddy } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';

/**
 * Comma-separated card ids for CardTooltip (hero power + BG buddy minion when known).
 * Buddy is listed before hero power so that after `CardTooltipComponent` reverses the id list,
 * hero power renders first (left) and buddy second — matching a right-positioned tooltip.
 */
export function buildBgsHeroPortraitCardTooltip(
	heroCardId: string,
	heroPowerCardId: string,
	cards: CardsFacadeService,
): string {
	const buddyId = getBuddy(heroCardId as CardIds, cards.getService());
	return [buddyId, heroPowerCardId].filter((id): id is string => !!id?.length).join(',');
}
