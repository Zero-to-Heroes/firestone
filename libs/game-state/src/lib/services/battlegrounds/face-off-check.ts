import { GameType } from '@firestone-hs/reference-data';
import { BugReportService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsFaceOffWithSimulation, GameState } from '../../models/_barrel';
import { isSupportedScenario } from './bgs-utils';

export const checkIntegrity = (
	faceOff: BgsFaceOffWithSimulation,
	gameState: GameState,
	bugService: BugReportService,
	hasReconnected: boolean,
	gameType: GameType,
	currentTurn: number,
	allCards: CardsFacadeService,
) => {
	if (faceOff.battleResult?.won === 0 && faceOff.result === 'won') {
		report('victory', faceOff, gameState, bugService, hasReconnected, gameType, currentTurn, allCards);
	}
	if (faceOff.battleResult?.lost === 0 && faceOff.result === 'lost') {
		report('loss', faceOff, gameState, bugService, hasReconnected, gameType, currentTurn, allCards);
	}
	if (faceOff.battleResult?.tied === 0 && faceOff.result === 'tied') {
		report('tie', faceOff, gameState, bugService, hasReconnected, gameType, currentTurn, allCards);
	}

	if (faceOff.playerCardId === 'TB_BaconShop_HERO_PH' || faceOff.opponentCardId === 'TB_BaconShop_HERO_PH') {
		console.error('invalid face off', faceOff.playerCardId, faceOff.opponentCardId, new Error().stack);
	}
};

const report = async (
	status: string,
	faceOff: BgsFaceOffWithSimulation,
	game: GameState,
	bugService: BugReportService,
	hasReconnected: boolean,
	gameType: GameType,
	currentTurn: number,
	allCards: CardsFacadeService,
) => {
	// const user = await this.ow.getCurrentUser();
	if (hasReconnected) {
		console.log('[bgs-simulation] Reconnected, not reporting', status, currentTurn);
		return;
	}
	const isSupported = isSupportedScenario(faceOff.battleInfo!).isSupported;
	const reviewId = game.reviewId;
	if (isSupported) {
		console.warn(
			'no-format',
			'[bgs-simulation] Impossible battle ' + status,
			reviewId,
			currentTurn,
			isSupported,
			faceOff.battleInfo,
			faceOff.battleResult,
		);
		if (!!allCards.getCards().length) {
			bugService.submitAutomatedReport({
				type: 'bg-sim',
				info: JSON.stringify({
					message: '[bgs-simulation] Impossible battle ' + status,
					reviewId: reviewId,
					currentTurn: currentTurn,
					gameType: gameType,
					battleInfo: faceOff.battleInfo,
				}),
			});
		}
	}
};
