import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { NonFunctionProperties, uuidShort } from '@firestone/shared/framework/common';
import { BattleInfoMessage } from './battle-info-message.type';

export class BgsFaceOffWithSimulation extends BgsFaceOff {
	readonly id: string;
	readonly playerHpLeft: number;
	readonly playerTavern: number;
	readonly opponentHpLeft: number;
	readonly opponentTavern: number;
	readonly battleInfo?: BgsBattleInfo;
	readonly battleResult?: SimulationResult;
	readonly battleInfoStatus?: 'empty' | 'waiting-for-result' | 'ongoing' | 'done';
	readonly battleInfoMesage: BattleInfoMessage | null;

	public static override create(
		base: Partial<NonFunctionProperties<BgsFaceOffWithSimulation>>,
	): BgsFaceOffWithSimulation {
		return Object.assign(new BgsFaceOffWithSimulation(), { id: uuidShort() }, base);
	}

	public update(base: Partial<NonFunctionProperties<BgsFaceOffWithSimulation>>): BgsFaceOffWithSimulation {
		return Object.assign(new BgsFaceOffWithSimulation(), this, base, {
			// Keep the original id
			id: this.id ?? base.id,
		});
	}

	public getNextEntityId(): number {
		const allEntities = [
			...(this.battleInfo?.playerBoard.board ?? []),
			...(this.battleInfo?.opponentBoard.board ?? []),
		];
		return !allEntities?.length ? 1 : Math.max(...allEntities.filter((e) => !!e).map((e) => e.entityId)) + 1;
	}
}
