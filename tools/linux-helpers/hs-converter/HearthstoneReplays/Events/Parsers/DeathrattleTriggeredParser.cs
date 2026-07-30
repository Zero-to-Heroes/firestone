using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class DeathrattleTriggeredParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public DeathrattleTriggeredParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && !ParserState.IsBattlegrounds()
                && node.Type == typeof(Parser.ReplayData.GameActions.Action)
                && (node.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.TRIGGER
                && (node.Object as Parser.ReplayData.GameActions.Action).TriggerKeyword == (int)GameTag.DEATHRATTLE;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var action = node.Object as Parser.ReplayData.GameActions.Action;
            var entity = GameState.CurrentEntities[action.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            if (GameState.CurrentEntities[action.Entity].GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT)
            {
                //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
                return new List<GameEventProvider> { GameEventProvider.Create(
                        action.TimeStamp,
                        "DEATHRATTLE_TRIGGERED",
                        GameEvent.CreateProvider(
                            "DEATHRATTLE_TRIGGERED",
                            cardId,
                            controllerId,
                            entity.Id,
                            StateFacade),
                       true,
                       node) };
            }
            return null;
        }

        // Typically the case when the opponent plays a quest or a secret
        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Parser.ReplayData.GameActions.Action;
            foreach (var data in action.Data)
            {
                if (data.GetType() == typeof(ShowEntity))
                {
                    var showEntity = data as ShowEntity;
                    if (showEntity.GetTag(GameTag.ZONE) == (int)Zone.SECRET
                        && showEntity.GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT
                        && showEntity.GetTag(GameTag.SIGIL) != 1)
                    {
                        var cardId = showEntity.CardId;
                        var controllerId = showEntity.GetEffectiveController();
                        //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
                        // For now there can only be one card played per block
                        return new List<GameEventProvider> { GameEventProvider.Create(
                            action.TimeStamp,
                            "SECRET_PLAYED",
                            GameEvent.CreateProvider(
                                "SECRET_PLAYED",
                                cardId,
                                controllerId,
                                showEntity.Entity,
                                StateFacade),
                            true,
                            node) };
                    }
                }
            }
            return null;
        }
    }
}
