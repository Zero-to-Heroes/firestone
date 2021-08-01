import { AllCardsService } from '@firestone-hs/replay-parser';
import cardsJson from '../../../test/cards.json';
import { CardsFacadeService } from './cards-facade.service';

export const buildTestCardsService = () => {
	const service = new CardsFacadeService(null);
	(service as any)['service'] = new AllCardsService();
	service['service']['service']['allCards'] = [...(cardsJson as any[])];
	return service;
};
