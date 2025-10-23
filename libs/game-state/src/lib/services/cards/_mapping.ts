import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard } from './_card.type';
import { DeepSpaceCurator } from './deep-space-curator';
import { DirdraRebelCaptain } from './dirdra-rebel-captain';
import { Kiljaeden } from './kiljaeden';
import { Metrognome } from './metrognome';
import { NorthernNavigation } from './northern-navigation';
import { YrelBeaconOfHope } from './yrel-beacon-of-hope';
import { ForgottenMillenium } from './forgotten-millenium';
import { CryofrozenChampion } from './cryofrozen-champion';
import { BloodDraw } from './blood-draw';
import { TheEternalHold } from './the-eternal-hold';

const cards = [
	DirdraRebelCaptain,
	DeepSpaceCurator,
	Metrognome,
	Kiljaeden,
	NorthernNavigation,
	YrelBeaconOfHope,
	ForgottenMillenium,
	CryofrozenChampion,
	BloodDraw,
	TheEternalHold,
];

export const cardsInfoCache: { [cardId: string]: GeneratingCard } = {};
for (const card of cards) {
	const cardIds = card.cardIds ?? [];
	for (const cardId of cardIds) {
		cardsInfoCache[cardId] = card;
	}
}
