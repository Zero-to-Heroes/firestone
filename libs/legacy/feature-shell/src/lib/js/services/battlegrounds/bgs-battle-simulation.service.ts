import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Optional } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBattleOptions } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-options';
import { BgsPlayerEntity } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { GameSample } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-sample';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Preferences } from '../../models/preferences';
import { PreferencesService } from '../preferences.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { BgsBattleSimulationExecutorService } from './bgs-battle-simulation-executor.service';
import { normalizeHeroCardId } from './bgs-utils';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';
import { BattlegroundsBattleSimulationEvent } from './store/events/battlegrounds-battle-simulation-event';

const BGS_BATTLE_SIMULATION_ENDPOINT = 'https://664abby5durcmapfl2wc6cqlaq0xkkcm.lambda-url.us-west-2.on.aws/';
const BGS_BATTLE_SIMULATION_SAMPLE_ENDPOINT = 'https://r65kigvlbtzarakaxao6kxw4q40sesoo.lambda-url.us-west-2.on.aws/';

@Injectable()
export class BgsBattleSimulationService {
	private stateUpdater: EventEmitter<BattlegroundsStoreEvent>;
	private cardsData: CardsData;

	private cpuCount: number;
	private isPremium: boolean;

	constructor(
		private readonly http: HttpClient,
		private readonly cards: CardsFacadeService,
		private readonly executor: BgsBattleSimulationExecutorService,
		private readonly store: AppUiStoreFacadeService,
		@Optional() private readonly ow: OverwolfService,
		@Optional() private readonly prefs: PreferencesService,
	) {
		if (ow?.isOwEnabled()) {
			setTimeout(() => {
				this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
			});
		}
		this.init();
	}

	private async init() {
		this.cardsData = new CardsData(this.cards.getService(), false);
		this.cardsData.inititialize();
		if (this.ow?.isOwEnabled()) {
			const systemInfo = await this.ow.getSystemInformation();

			this.cpuCount = systemInfo?.PhysicalCPUCount ?? 1;
			console.log('CPU count', this.cpuCount);
		}
		await this.store.initComplete();
		this.store.isPremiumUser$().subscribe((premium) => {
			this.isPremium = premium;
		});
	}

	public async startBgsBattleSimulation(
		battleId: string,
		battleInfo: BgsBattleInfo,
		races: readonly Race[],
		currentTurn: number,
	) {
		const prefs = await this.prefs?.getPreferences();
		if (!prefs.bgsEnableSimulation || !prefs.bgsFullToggle) {
			console.log('[bgs-simulation] simulation turned off');
			return;
		}
		const options: BgsBattleOptions = {
			...battleInfo.options,
		} as BgsBattleOptions;
		const battleInfoInput: BgsBattleInfo = {
			...battleInfo,
			options,
			gameState: {
				validTribes: races,
				currentTurn: currentTurn,
			},
		};
		console.debug(
			'no-format',
			'[bgs-simulation] battle simulation request prepared',
			battleInfo,
			prefs.bgsUseLocalSimulator,
			{
				hp: battleInfo.playerBoard.player.hpLeft,
				debugHealth: (
					battleInfo.playerBoard.player as BgsPlayerEntity & { debugArmor: number; debugHealth: number }
				).debugHealth,
				debugArmor: (
					battleInfo.playerBoard.player as BgsPlayerEntity & { debugArmor: number; debugHealth: number }
				).debugArmor,
			},
			{
				hp: battleInfo.opponentBoard.player.hpLeft,
				debugHealth: (
					battleInfo.opponentBoard.player as BgsPlayerEntity & { debugArmor: number; debugHealth: number }
				).debugHealth,
				debugArmor: (
					battleInfo.opponentBoard.player as BgsPlayerEntity & { debugArmor: number; debugHealth: number }
				).debugArmor,
			},
		);

		const shouldUseLocalSimulator = prefs.bgsUseLocalSimulator || !this.isPremium;
		console.debug(
			'[bgs-simulation] useLocalSim?',
			shouldUseLocalSimulator,
			prefs.bgsUseLocalSimulator,
			this.isPremium,
		);
		const result: SimulationResult = shouldUseLocalSimulator
			? await this.simulateLocalBattle(battleInfoInput, prefs)
			: ((await this.http.post(BGS_BATTLE_SIMULATION_ENDPOINT, battleInfoInput).toPromise()) as SimulationResult);
		const resultForLog = !!result ? { ...result } : null;
		if (!!resultForLog) {
			delete resultForLog.outcomeSamples;
		}
		console.log('[bgs-simulation] battle simulation result', resultForLog);
		this.stateUpdater.next(
			new BattlegroundsBattleSimulationEvent(
				battleId,
				result,
				normalizeHeroCardId(battleInfoInput.opponentBoard.player.nonGhostCardId, this.cards),
			),
		);
	}

	public async getIdForSimulationSample(sample: GameSample): Promise<string> {
		console.log('calling sample endpoint');
		try {
			const result: any = (await this.http
				.post(BGS_BATTLE_SIMULATION_SAMPLE_ENDPOINT, sample)
				.toPromise()) as string;
			console.log('[bgs-simulation] id for simulation sample', result);
			return result;
		} catch (e) {
			console.error('[bgs-simulation] could not get if from sample', e.message, sample, e);
			return null;
		}
	}

	public async getIdForSimulationSampleWithFetch(sample: GameSample): Promise<string> {
		console.log('calling fetch sample endpoint');
		try {
			const response = await fetch(BGS_BATTLE_SIMULATION_SAMPLE_ENDPOINT, {
				method: 'POST',
				mode: 'cors',
				// credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
					// 'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: JSON.stringify(sample),
			});
			console.log('[bgs-simulation] id for simulation sample', response);
			return response.text();
		} catch (e) {
			console.error('[bgs-simulation] could not get if from sample', e.message, sample, e);
			return null;
		}
	}

	public async simulateLocalBattle(battleInfo: BgsBattleInfo, prefs: Preferences): Promise<SimulationResult> {
		return this.executor.simulateLocalBattle(battleInfo, prefs);
	}
}
