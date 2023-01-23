import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Entity, PlayerEntity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';
import { GameHelper } from '../../services/game-helper';

@Component({
	selector: 'play-area',
	styleUrls: ['./play-area.component.scss'],
	template: `
		<div class="play-area" [ngClass]="{ mulligan: _isMulligan }">
			<hand [entities]="hand" [showCards]="_showCards" [options]="handOptions" [controller]="playerEntity"></hand>
			<hero
				[entities]="_entities"
				[playerId]="_playerId"
				[opponentId]="opponentId"
				[options]="_options"
				[entitiesToAnimate]="entitiesToAnimate"
			>
			</hero>
			<board
				[entities]="board"
				[enchantmentCandidates]="enchantmentCandidates"
				[options]="boardOptions"
				[isMainPlayer]="isMainPlayer"
				[isRecruitPhase]="isRecruitPhase"
			>
			</board>
			<mana-tray
				[total]="totalCrystals"
				[available]="availableCrystals"
				[empty]="emptyCrystals"
				[locked]="lockedCrystals"
				[futureLocked]="futureLockedCrystals"
			>
			</mana-tray>
			<deck [deck]="deck"></deck>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayAreaComponent {
	_isMulligan: boolean;
	_entities: Map<number, Entity>;
	_playerId: number;
	_showCards = true;

	hand: readonly Entity[];
	handOptions: readonly number[];
	board: readonly Entity[];
	enchantmentCandidates: readonly Entity[];
	boardOptions: readonly number[];
	deck: readonly Entity[];
	playerEntity: Entity;

	totalCrystals: number;
	availableCrystals: number;
	emptyCrystals: number;
	lockedCrystals: number;
	futureLockedCrystals: number;

	_options: readonly number[];

	@Input() opponentId: number;
	@Input() isMainPlayer: boolean;
	@Input() isRecruitPhase: boolean;
	@Input() entitiesToAnimate: readonly number[];

	@Input() set mulligan(value: boolean) {
		// console.debug('[play-area] setting mulligan', value);
		this._isMulligan = value;
	}

	@Input() set entities(entities: Map<number, Entity>) {
		// console.debug('[play-area] setting new entities', entities && entities.toJS());
		this._entities = entities;
		this.updateEntityGroups();
	}

	@Input() set showCards(value: boolean) {
		// console.debug('[mulligan] setting showCards', value);
		this._showCards = value;
	}

	@Input() set options(value: readonly number[]) {
		// console.debug('[play-area] setting options', value);
		this._options = value;
		this.updateEntityGroups();
	}

	@Input() set playerId(playerId: number) {
		// console.debug('[play-area] setting playerId', playerId);
		this._playerId = playerId;
		this.updateEntityGroups();
	}

	private updateEntityGroups() {
		if (!this._entities || !this._playerId) {
			// console.debug('[play-area] entities not initialized yet');
			return;
		}

		// In Battlegrounds, we can have the Player and the Hero who are different entities, and the
		// resources / mana are attached to the player
		// I didn't check how things were in constructed, but the new change doesn't break it
		const allPlayerEntities = this._entities
			.filter((entity) => entity.getTag(GameTag.PLAYER_ID) === this._playerId)
			.valueSeq()
			.toArray();
		this.playerEntity =
			allPlayerEntities.find((entity) => (entity as PlayerEntity).accountHi != null) ?? allPlayerEntities[0];
		this.hand = this.getHandEntities(this._playerId);
		this.handOptions = GameHelper.getOptions(this.hand, this._options);
		this.board = this.getBoardEntities(this._playerId);
		this.boardOptions = GameHelper.getOptions(this.board, this._options);
		this.enchantmentCandidates = this.getEnchantmentCandidates(this.board, this._entities.valueSeq().toArray());
		this.deck = this.getDeckEntities(this._playerId);

		// In BG, the resources are attached to the PlayerEntity, and not the hero
		// const humainPlayerEntity = this._entities.find(entity => entity.)
		this.totalCrystals = this.playerEntity.getTag(GameTag.RESOURCES) || 0;
		this.availableCrystals = this.totalCrystals - (this.playerEntity.getTag(GameTag.RESOURCES_USED) || 0);
		this.lockedCrystals = this.playerEntity.getTag(GameTag.OVERLOAD_LOCKED) || 0;
		this.emptyCrystals = this.totalCrystals - this.availableCrystals - this.lockedCrystals;
		this.futureLockedCrystals = this.playerEntity.getTag(GameTag.OVERLOAD_OWED) || 0;
		console.debug('[play-area] play-area entities updated', this.hand);
	}

	private getHandEntities(playerId: number): readonly Entity[] {
		return this._entities
			.valueSeq()
			.toArray()
			.filter((entity) => entity.getTag(GameTag.CONTROLLER) === playerId)
			.filter((entity) => entity.getTag(GameTag.ZONE) === Zone.HAND)
			.sort((a, b) => a.getTag(GameTag.ZONE_POSITION) - b.getTag(GameTag.ZONE_POSITION));
	}

	private getDeckEntities(playerId: number): readonly Entity[] {
		return this._entities
			.valueSeq()
			.toArray()
			.filter((entity) => entity.getTag(GameTag.CONTROLLER) === playerId)
			.filter((entity) => entity.getTag(GameTag.ZONE) === Zone.DECK);
	}

	private getBoardEntities(playerId: number): readonly Entity[] {
		return this._entities
			.valueSeq()
			.toArray()
			.filter((entity) => entity.getTag(GameTag.CONTROLLER) === playerId)
			.filter((entity) => entity.getTag(GameTag.ZONE) === Zone.PLAY)
			.filter(
				(entity) =>
					entity.getTag(GameTag.CARDTYPE) === CardType.MINION ||
					entity.getTag(GameTag.CARDTYPE) == CardType.LOCATION,
			)
			.sort((a, b) => a.getTag(GameTag.ZONE_POSITION) - b.getTag(GameTag.ZONE_POSITION));
	}

	private getEnchantmentCandidates(board: readonly Entity[], entities: readonly Entity[]): readonly Entity[] {
		const boardIds = board.map((entity) => entity.id);
		return entities
			.filter((entity) => entity.zone() === Zone.PLAY)
			.filter((entity) => boardIds.indexOf(entity.getTag(GameTag.ATTACHED)) !== -1);
	}
}
