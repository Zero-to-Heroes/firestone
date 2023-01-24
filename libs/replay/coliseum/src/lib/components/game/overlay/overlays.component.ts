import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlayState } from '@firestone-hs/reference-data';
import {
	Action,
	BaconBoardVisualStateAction,
	BaconOpponentRevealedAction,
	CardBurnAction,
	DiscoverAction,
	Entity,
	FatigueDamageAction,
} from '@firestone-hs/replay-parser';
import { Map } from 'immutable';

@Component({
	selector: 'overlays',
	styleUrls: ['./overlays.component.scss'],
	template: `
		<div class="overlays">
			<mulligan
				*ngIf="_isMulligan && !_isHeroSelection"
				class="top"
				[entities]="_entities"
				[crossed]="_crossed"
				[showCards]="_showHiddenCards"
				[playerId]="_opponentId"
			>
			</mulligan>
			<mulligan
				*ngIf="_isMulligan && !_isHeroSelection"
				class="bottom"
				[entities]="_entities"
				[crossed]="_crossed"
				[playerId]="_playerId"
			>
			</mulligan>
			<hero-selection
				*ngIf="_isHeroSelection && !_opponentsRevealed"
				class="bottom"
				[entities]="_entities"
				[crossed]="_crossed"
				[playerId]="_playerId"
			>
			</hero-selection>
			<opponents-reveal
				*ngIf="_opponentsRevealed"
				[entities]="_entities"
				[opponentIds]="_opponentsRevealed"
				[playerId]="_playerId"
			>
			</opponents-reveal>
			<end-game *ngIf="_isEndGame" [status]="_endGameStatus" [entities]="_entities" [playerId]="_playerId">
			</end-game>
			<discover *ngIf="_discovers" [entities]="_entities" [choices]="_discovers" [chosen]="_chosen"> </discover>
			<burn *ngIf="_burned" [entities]="_entities" [burned]="_burned"> </burn>
			<fatigue *ngIf="_fatigue" [fatigue]="_fatigue"></fatigue>
			<visual-board-state-change
				*ngIf="_baconBoardStateChange"
				[state]="_baconBoardStateChange"
			></visual-board-state-change>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlaysComponent {
	@Output() overlayUpdated: EventEmitter<{ isOverlay: boolean; isDarkOverlay: boolean }> = new EventEmitter();

	isOverlay: boolean;
	action: Action | undefined;
	_entities: Map<number, Entity>;
	_crossed: readonly number[] | undefined;
	_playerId: number;
	_opponentId: number;
	_showHiddenCards: boolean;
	_fatigue: number | undefined;
	_discovers: readonly number[] | undefined;
	_burned: readonly number[] | undefined;
	_chosen: readonly number[] | undefined;
	_isMulligan: boolean;
	_isHeroSelection: boolean;
	_opponentsRevealed: readonly number[] | undefined;
	_isEndGame: boolean;
	_endGameStatus: PlayState | null;
	_baconBoardStateChange: number;

	@Input() set playerId(playerId: number) {
		// console.debug('[overlays] setting playerId', playerId);
		this._playerId = playerId;
	}

	@Input() set opponentId(opponentId: number) {
		// console.debug('[overlays] setting opponentId', opponentId);
		this._opponentId = opponentId;
	}

	@Input() set showHiddenCards(value: boolean) {
		// console.debug('[overlays] setting showHiddenCards', value);
		this._showHiddenCards = value;
	}

	@Input() set currentAction(value: Action | undefined) {
		if (value === this.action) {
			return;
		}
		// console.debug('[overlays] setting new action', value);
		this.action = value;
		this._entities = value ? value.entities : Map();
		this._crossed = value ? value.crossedEntities : undefined;
		this._burned = value instanceof CardBurnAction ? value.burnedCardIds : undefined;
		this._fatigue = value instanceof FatigueDamageAction ? value.amount : undefined;
		this._discovers = value instanceof DiscoverAction ? value.choices : undefined;
		this._chosen = value instanceof DiscoverAction ? value.chosen : undefined;
		this._isMulligan = value ? value.isMulligan : false;
		this._isHeroSelection = value ? value.isHeroSelection : false;
		this._isEndGame = value ? value.isEndGame : false;
		this._endGameStatus = value ? value.endGameStatus : null;
		this._opponentsRevealed = value instanceof BaconOpponentRevealedAction ? value.opponentIds : undefined;
		this._baconBoardStateChange = value instanceof BaconBoardVisualStateAction ? value.newState : 0;
		// console.log('_baconBoardStateChange', this._baconBoardStateChange);
		this.updateOverlay();
	}

	private updateOverlay() {
		this.isOverlay =
			this._isMulligan ||
			this._isHeroSelection ||
			(this._opponentsRevealed && this._opponentsRevealed.length > 0) ||
			this._isEndGame ||
			(this._discovers && this._discovers.length > 0) ||
			(this._burned && this._burned.length > 0) ||
			this._baconBoardStateChange > 0 ||
			(this._fatigue ?? 0) > 0;
		const isDarkOverlay =
			this._isMulligan ||
			this._isHeroSelection ||
			(this._opponentsRevealed && this._opponentsRevealed.length > 0);
		this.overlayUpdated.next({ isOverlay: this.isOverlay, isDarkOverlay: !!isDarkOverlay });
	}
}
