import { CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsPogoCounterDefinition implements CounterDefinition {
	readonly type = 'bgsPogo';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(
		gameState: BattlegroundsState,
		side: string,
		i18n: LocalizationFacadeService,
	): BgsPogoCounterDefinition {
		const pogoHopperSize = gameState.currentGame.pogoHoppersCount || 0;
		return {
			type: 'bgsPogo',
			value: pogoHopperSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.PogoHopper1}.jpg`,
			cssClass: 'pogo-counter',
			tooltip: i18n.translateString(`counters.pogo.${side}`, { value: pogoHopperSize }),
			standardCounter: true,
		};
	}
}
