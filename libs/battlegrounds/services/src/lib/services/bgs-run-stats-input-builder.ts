import { Input as BgsComputeRunStatsInput } from '@firestone-hs/user-bgs-post-match-stats';
import { BgsGame } from '@firestone/game-state';
import { GameForUpload } from '@firestone/stats/services';

export const buildBgsRunStatsInput = (
	reviewId: string,
	game: GameForUpload,
	currentGame: BgsGame,
	userId: string,
	userName: string | null | undefined,
): BgsComputeRunStatsInput => {
	const newMmr = parseInt(game.newPlayerRank);
	const input: BgsComputeRunStatsInput = {
		reviewId: reviewId,
		heroCardId: currentGame.getMainPlayer()!.cardId,
		userId: userId,
		userName: userName as string,
		battleResultHistory: currentGame.buildBattleResultHistory().map((history) => ({
			...history,
			simulationResult: { ...history.simulationResult, outcomeSamples: undefined },
		})),
		mainPlayer: currentGame.getMainPlayer()!,
		faceOffs: currentGame.faceOffs.map((faceOff) => ({
			damage: faceOff.damage,
			opponentCardId: faceOff.opponentCardId,
			opponentPlayerId: faceOff.opponentPlayerId,
			playerCardId: faceOff.playerCardId,
			result: faceOff.result,
			turn: faceOff.turn,
		})),
		oldMmr: currentGame.mmrAtStart,
		newMmr: (isNaN(newMmr) ? null : newMmr) as number,
	};
	return input;
};
