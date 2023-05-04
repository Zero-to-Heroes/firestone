import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { captureEvent } from '@sentry/browser';
import { isSupportedScenario } from '../../services/battlegrounds/bgs-utils';
import { NonFunctionProperties, uuid } from '../../services/utils';
import { BattleInfoMessage } from './battle-info-message.type';
import { BgsGame } from './bgs-game';

export class BgsFaceOffWithSimulation extends BgsFaceOff {
	readonly id: string;
	readonly playerHpLeft: number;
	readonly playerTavern: number;
	readonly opponentHpLeft: number;
	readonly opponentTavern: number;
	readonly battleInfo?: BgsBattleInfo;
	readonly battleResult?: SimulationResult;
	readonly battleInfoStatus: 'empty' | 'waiting-for-result' | 'done';
	readonly battleInfoMesage: BattleInfoMessage;

	public static create(base: Partial<NonFunctionProperties<BgsFaceOffWithSimulation>>): BgsFaceOffWithSimulation {
		return Object.assign(new BgsFaceOffWithSimulation(), { id: uuid() }, base);
	}

	public update(base: Partial<NonFunctionProperties<BgsFaceOffWithSimulation>>): BgsFaceOffWithSimulation {
		return Object.assign(new BgsFaceOffWithSimulation(), this, base, {
			// Keep the original id
			id: this.id ?? base.id,
		});
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

		if (this.playerCardId === 'TB_BaconShop_HERO_PH' || this.opponentCardId === 'TB_BaconShop_HERO_PH') {
			console.error('invalid face off', this.playerCardId, this.opponentCardId, new Error().stack);
		}
	}

	public getNextEntityId(): number {
		const allEntities = [...this.battleInfo.playerBoard.board, ...this.battleInfo.opponentBoard.board];
		return !allEntities?.length ? 1 : Math.max(...allEntities.map((e) => e.entityId)) + 1;
	}

	private async report(status: string, game: BgsGame) {
		// const user = await this.ow.getCurrentUser();
		const isSupported = isSupportedScenario(this.battleInfo).isSupported;
		if (isSupported) {
			console.warn(
				'no-format',
				'[bgs-simulation] Impossible battle ' + status,
				game.reviewId,
				game.currentTurn,
				isSupported,
				this.battleInfo,
				this.battleResult,
			);
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
