import { GameType } from '@firestone-hs/reference-data';
import { BgsFaceOffWithSimulation, BgsGame } from '@firestone/battlegrounds/core';
import { BugReportService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { isSupportedScenario } from '../../services/battlegrounds/bgs-utils';

export const checkIntegrity = (
	faceOff: BgsFaceOffWithSimulation,
	gameState: BgsGame,
	bugService: BugReportService,
	hasReconnected: boolean,
	gameType: GameType,
	allCards: CardsFacadeService,
) => {
	if (faceOff.battleResult?.won === 0 && faceOff.result === 'won') {
		report('victory', faceOff, gameState, bugService, hasReconnected, gameType, allCards);
	}
	if (faceOff.battleResult?.lost === 0 && faceOff.result === 'lost') {
		report('loss', faceOff, gameState, bugService, hasReconnected, gameType, allCards);
	}
	if (faceOff.battleResult?.tied === 0 && faceOff.result === 'tied') {
		report('tie', faceOff, gameState, bugService, hasReconnected, gameType, allCards);
	}

	if (faceOff.playerCardId === 'TB_BaconShop_HERO_PH' || faceOff.opponentCardId === 'TB_BaconShop_HERO_PH') {
		console.error('invalid face off', faceOff.playerCardId, faceOff.opponentCardId, new Error().stack);
	}
};

const report = async (
	status: string,
	faceOff: BgsFaceOffWithSimulation,
	game: BgsGame,
	bugService: BugReportService,
	hasReconnected: boolean,
	gameType: GameType,
	allCards: CardsFacadeService,
) => {
	// const user = await this.ow.getCurrentUser();
	if (hasReconnected) {
		console.log('[bgs-simulation] Reconnected, not reporting', status, game.currentTurn);
		return;
	}
	const isSupported = isSupportedScenario(faceOff.battleInfo).isSupported;
	if (isSupported) {
		console.warn(
			'no-format',
			'[bgs-simulation] Impossible battle ' + status,
			game.reviewId,
			game.currentTurn,
			isSupported,
			faceOff.battleInfo,
			faceOff.battleResult,
		);
		if (!!allCards.getCards().length) {
			bugService.submitAutomatedReport({
				type: 'bg-sim',
				info: JSON.stringify({
					message: '[bgs-simulation] Impossible battle ' + status,
					reviewId: game.reviewId,
					currentTurn: game.currentTurn,
					gameType: gameType,
					battleInfo: faceOff.battleInfo,
				}),
			});
		}
	}
};
