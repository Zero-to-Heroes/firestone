import { AllCardsService, GameFormat, GameTag, GameType, ReferenceCard } from '@firestone-hs/reference-data';
import { Metadata } from '../../models/metadata';
import { FilterCardsOptions, filterCards as filterCardsOriginal } from '../../related-cards/dynamic-pools';
import { isCardValidForGame } from '../card-utils';
import { StaticGeneratingCardInput } from './_card.type';

export const filterCards = (
	sourceCardId: string | null,
	allCards: AllCardsService,
	filter: (c: ReferenceCard) => boolean | undefined,
	options?: FilterCardsInput | StaticGeneratingCardInput['inputOptions'],
): readonly string[] => {
	const inputOptions = convertOptions(options);
	return filterCardsOriginal(allCards, inputOptions, sourceCardId, (c) => filter(c));
};

export const filterCardsFromThePast = (
	sourceCardId: string,
	allCards: AllCardsService,
	filter: (c: ReferenceCard) => boolean | undefined,
	options?: FilterCardsInput | StaticGeneratingCardInput['inputOptions'],
): readonly string[] => {
	const inputOptions = convertOptions(options);
	const newOptions = {
		...inputOptions,
		format: GameFormat.FT_WILD,
		gameType: GameType.GT_RANKED,
	};
	return filterCards(
		sourceCardId,
		allCards,
		(c) =>
			filter(c) &&
			!isCardValidForGame(c, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
			isCardValidForGame(c, GameFormat.FT_WILD, GameType.GT_RANKED),
		newOptions,
	);
};

const convertOptions = (options?: FilterCardsInput | StaticGeneratingCardInput['inputOptions']): FilterCardsOptions => {
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
	return inputOptions;
};

export interface FilterCardsInput {
	positionInHand?: number;
	tags?: readonly { Name: GameTag; Value: number }[];
	metadata?: Metadata;
	validArenaPool: readonly string[];
	currentClass?: string;
	initialDecklist?: readonly string[];
}
