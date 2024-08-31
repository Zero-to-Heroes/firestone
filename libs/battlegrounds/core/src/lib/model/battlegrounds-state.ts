import { GameTag, Race } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { BgsGame } from './bgs-game';
import { BgsPanel } from './bgs-panel';
import { BgsPanelId } from './bgs-panel-id.type';
import { BgsPostMatchStats } from './post-match/bgs-post-match-stats';

export class BattlegroundsState {
	readonly inGame: boolean;
	readonly reconnectOngoing: boolean;
	readonly spectating: boolean;
	readonly heroSelectionDone: boolean;
	readonly panels: readonly BgsPanel[] = [];
	readonly currentPanelId: BgsPanelId;
	readonly currentGame: BgsGame;
	readonly forceOpen: boolean;
	// Maybe move this elsewhere, so as not to send it everytime we emit the BattlegroundsState?
	// It is a pretty big object
	// On the other hand, it changes frequently, maybe as often as the state itself, so I'm not sure
	readonly postMatchStats: BgsPostMatchStats;

	readonly highlightedTribes: readonly Race[] = [];
	readonly highlightedMechanics: readonly GameTag[] = [];
	readonly highlightedMinions: readonly string[] = [];

	public static create(base: Partial<NonFunctionProperties<BattlegroundsState>>): BattlegroundsState {
		return Object.assign(new BattlegroundsState(), base);
	}

	public update(base: Partial<NonFunctionProperties<BattlegroundsState>>): BattlegroundsState {
		return Object.assign(new BattlegroundsState(), this, base);
	}

	public updatePanel(newPanel: BgsPanel): BattlegroundsState {
		const panels: readonly BgsPanel[] = this.panels.map((panel) => (panel.id === newPanel.id ? newPanel : panel));
		return this.update({
			panels: panels,
		} as BattlegroundsState);
	}

	public getPanel(panelId: BgsPanelId): BgsPanel | undefined {
		return this.panels.find((panel) => panel.id === panelId);
	}
}
