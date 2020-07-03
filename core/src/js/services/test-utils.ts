import { AllCardsService } from '@firestone-hs/replay-parser';
import cardsJson from '../../../test/cards.json';

export const buildTestCardsService = () => {
	const service = new AllCardsService();
	service['service']['allCards'] = [...(cardsJson as any[])];
	return service;
};
