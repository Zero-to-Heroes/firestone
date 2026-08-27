using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class CardPresentOnGameStartParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardPresentOnGameStartParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(FullEntity)
                && (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.PLAY
                && node.Parent != null && node.Parent.Type == typeof(Game);
                //&& !ParserState.ReconnectionOngoing;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var fullEntity = node.Object as FullEntity;
            var cardId = fullEntity.CardId;
            if (fullEntity.GetTag(GameTag.CARDTYPE) != (int)CardType.MINION || fullEntity.GetTag(GameTag.HAS_BEEN_REBORN) == 1)
            {
                return null;
            }
            var controllerId = fullEntity.GetEffectiveController();
            var startingHealth = fullEntity.GetTag(GameTag.HEALTH);
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var creator = Oracle.FindCardCreator(GameState, fullEntity, node);
            return new List<GameEventProvider> { GameEventProvider.Create(
                fullEntity.TimeStamp,
                "CARD_ON_BOARD_AT_GAME_START",
                GameEvent.CreateProvider(
                    "CARD_ON_BOARD_AT_GAME_START",
                    cardId,
                    controllerId,
                    fullEntity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        Health = startingHealth,
                        CreatorCardId = creator?.Item1,
                        Tags = fullEntity.GetTagsCopy(),
                    }),
                true,
                node) };
        }
    }
}
