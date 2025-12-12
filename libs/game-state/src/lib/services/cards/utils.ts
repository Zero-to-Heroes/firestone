import { AllCardsService, GameFormat, GameTag, GameType, ReferenceCard } from '@firestone-hs/reference-data';
import { Metadata } from '../../models/metadata';
import { FilterCardsOptions, filterCards as filterCardsOriginal } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCardInput } from './_card.type';

export const filterCards = (
	sourceCardId: string,
	allCards: AllCardsService,
	filter: (c: ReferenceCard) => boolean,
	options?:
		| {
				positionInHand?: number;
				tags?: readonly { Name: GameTag; Value: number }[];
				metadata?: Metadata;
				validArenaPool?: readonly string[];
		  }
		| StaticGeneratingCardInput['inputOptions'],
): readonly string[] => {
	const optionsAsStaticGeneratingCardInput = options as StaticGeneratingCardInput['inputOptions'];
	const metadata = (options as any)?.metadata;
	const inputOptions: FilterCardsOptions = {
		format: optionsAsStaticGeneratingCardInput?.format ?? metadata?.formatType ?? GameFormat.FT_STANDARD,
		gameType: optionsAsStaticGeneratingCardInput?.gameType ?? metadata?.gameType ?? GameType.GT_RANKED,
		scenarioId: optionsAsStaticGeneratingCardInput?.scenarioId ?? metadata?.scenarioId ?? 0,
		validArenaPool: optionsAsStaticGeneratingCardInput?.validArenaPool ?? metadata?.validArenaPool ?? [],
		currentClass: optionsAsStaticGeneratingCardInput?.currentClass ?? metadata?.currentClass ?? undefined,
	};
	return filterCardsOriginal(allCards, inputOptions, sourceCardId, (c) => filter(c));
};
