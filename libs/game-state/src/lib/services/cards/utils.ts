import { AllCardsService, GameFormat, GameTag, GameType, ReferenceCard } from '@firestone-hs/reference-data';
import { Metadata } from '../../models/metadata';
import { FilterCardsOptions, filterCards as filterCardsOriginal } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCardInput } from './_card.type';

export const filterCards = (
	sourceCardId: string,
	allCards: AllCardsService,
	filter: (c: ReferenceCard) => boolean,
	options?: FilterCardsInput | StaticGeneratingCardInput['inputOptions'],
): readonly string[] => {
	const optionsAsFilterCardsInput = options as FilterCardsInput;
	const optionsAsStaticGeneratingCardInput = options as StaticGeneratingCardInput['inputOptions'];
	const metadata: Metadata | undefined = optionsAsFilterCardsInput?.metadata;
	const inputOptions: FilterCardsOptions = {
		format: optionsAsStaticGeneratingCardInput?.format ?? metadata?.formatType ?? GameFormat.FT_STANDARD,
		gameType: optionsAsStaticGeneratingCardInput?.gameType ?? metadata?.gameType ?? GameType.GT_RANKED,
		scenarioId: optionsAsStaticGeneratingCardInput?.scenarioId ?? metadata?.scenarioId ?? 0,
		validArenaPool:
			optionsAsStaticGeneratingCardInput?.validArenaPool ?? optionsAsFilterCardsInput?.validArenaPool ?? [],
		currentClass:
			optionsAsStaticGeneratingCardInput?.currentClass ?? optionsAsFilterCardsInput?.currentClass ?? undefined,
		initialDecklist:
			optionsAsStaticGeneratingCardInput?.initialDecklist ??
			optionsAsFilterCardsInput?.initialDecklist ??
			undefined,
	};
	return filterCardsOriginal(allCards, inputOptions, sourceCardId, (c) => filter(c));
};

export interface FilterCardsInput {
	positionInHand?: number;
	tags?: readonly { Name: GameTag; Value: number }[];
	metadata?: Metadata;
	validArenaPool?: readonly string[];
	currentClass?: string;
	initialDecklist?: readonly string[];
}
