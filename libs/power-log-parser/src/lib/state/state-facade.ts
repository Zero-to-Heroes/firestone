import { PlayerEntity, Game, HearthstoneReplay, NodeType } from '../models';
import { Player } from '../models';
import { Regexes } from '../regexes';
import { GameMetaData } from './game-meta-data';
import type { CombinedState } from './combined-state';
import type { ParserState } from './parser-state';

export class StateFacade {
	private State: CombinedState;

	private _lastProcessedGSLine: string | null = null;
	private _lastProcessedPTLLine: string | null = null;
	private _updateToRootAfterLine: string | null = null;

	constructor(combined: CombinedState) {
		this.State = combined;
	}

	get LocalPlayer(): Player | null {
		return this.State?.GSState?.LocalPlayer ?? null;
	}

	get OpponentPlayer(): Player | null {
		return this.State?.GSState?.OpponentPlayer ?? null;
	}

	get Spectating(): boolean {
		return this.State?.GSState?.Spectating ?? false;
	}

	get ScenarioID(): number {
		return this.State.GSState.CurrentGame.ScenarioID;
	}

	get GSReplay(): HearthstoneReplay {
		return this.State.GSState.Replay;
	}

	set LastProcessedGSLine(value: string | null) {
		const isLastLineToBeConsidered =
			value != null &&
			!(value.includes('BuildNumber=') && Regexes.BuildNumber.test(value)) &&
			!(value.includes('GameType=') && Regexes.GameType.test(value)) &&
			!(value.includes('FormatType=') && Regexes.FormatType.test(value)) &&
			!(value.includes('ScenarioID=') && Regexes.ScenarioID.test(value)) &&
			!(
				value.includes('PlayerID=') &&
				value.includes('PlayerName=') &&
				Regexes.PlayerNameAssignment.test(value)
			);
		if (isLastLineToBeConsidered) {
			this._lastProcessedGSLine = value;
		}
	}

	set LastProcessedPTLLine(value: string | null) {
		this._lastProcessedPTLLine = value;
	}

	get PtlState(): ParserState | null {
		return this.State?.PTLState ?? null;
	}

	get GsState(): ParserState | null {
		return this.State?.GSState ?? null;
	}

	HasMetaData(): boolean {
		return (
			this.State.GSState.CurrentGame.FormatType !== -1 &&
			this.State.GSState.CurrentGame.GameType !== -1 &&
			this.LocalPlayer != null
		);
	}

	GetMetaData(): GameMetaData {
		return {
			BuildNumber: this.State.GSState.CurrentGame.BuildNumber,
			FormatType: this.State.GSState.CurrentGame.FormatType,
			GameType: this.State.GSState.CurrentGame.GameType,
			ScenarioID: this.State.GSState.CurrentGame.ScenarioID,
		};
	}

	IsBattlegrounds(): boolean {
		return this.State.GSState.IsBattlegrounds();
	}

	IsBattlegroundsDuos(): boolean {
		return this.State.GSState.IsBattlegroundsDuos();
	}

	InRecruitPhase(): boolean {
		return this.State.PTLState.InRecruitPhase();
	}

	GetPlayers(): PlayerEntity[] {
		return this.State.GSState.getPlayers();
	}

	NotifyUpdateToRootNeeded(): void {
		if (
			this._lastProcessedPTLLine != null &&
			this._lastProcessedPTLLine.trim() === this._lastProcessedGSLine?.trim()
		) {
			this.UpdatePTLToRoot();
		} else if (this._lastProcessedGSLine?.trim() === 'BLOCK_END') {
			this._updateToRootAfterLine = this._lastProcessedGSLine?.trim();
		}
	}

	ShouldUpdateToRoot(data: string): boolean {
		return this._updateToRootAfterLine != null && this._updateToRootAfterLine === data?.trim();
	}

	UpdatePTLToRoot(): void {
		this.State.PTLState.EndAction();
		this.State.PTLState.UpdateCurrentNode(NodeType.Game);
		this._updateToRootAfterLine = null;
	}
}
