import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { captureEvent } from '@sentry/browser';
import { isSupportedScenario } from '../../services/battlegrounds/bgs-utils';
import { BattleInfoMessage } from './battle-info-message.type';
import { BgsGame } from './bgs-game';

export class BgsFaceOffWithSimulation extends BgsFaceOff {
	readonly playerHpLeft: number;
	readonly playerTavern: number;
	readonly opponentHpLeft: number;
	readonly opponentTavern: number;
	readonly battleInfo?: BgsBattleInfo;
	readonly battleResult?: SimulationResult;
	readonly battleInfoStatus: 'empty' | 'waiting-for-result' | 'done';
	readonly battleInfoMesage: BattleInfoMessage;

	public static create(base: BgsFaceOff): BgsFaceOffWithSimulation {
		return Object.assign(new BgsFaceOffWithSimulation(), base);
	}

	public checkIntegrity(gameState: BgsGame) {
		if (this.battleResult?.won === 0 && this.result === 'won') {
			this.report('victory', gameState);
		}
		if (this.battleResult?.lost === 0 && this.result === 'lost') {
			this.report('loss', gameState);
		}
		if (this.battleResult?.tied === 0 && this.result === 'tied') {
			this.report('tie', gameState);
		}
	}

	private async report(status: string, game: BgsGame) {
		// const user = await this.ow.getCurrentUser();
		const isSupported = isSupportedScenario(this.battleInfo).isSupported;
		console.warn(
			'no-format',
			'[bgs-simulation] Impossible battle ' + status,
			game.reviewId,
			game.currentTurn,
			isSupported,
			this.battleInfo,
			this.battleResult,
		);
		if (isSupported) {
			captureEvent({
				message: 'Impossible battle ' + status,
				extra: {
					reviewId: game.reviewId,
					// user: user,
					turnNumber: game.currentTurn,
					battleInput: JSON.stringify(this.battleInfo),
					battleResult: JSON.stringify(this.battleResult),
				},
			});
		}
	}
}
