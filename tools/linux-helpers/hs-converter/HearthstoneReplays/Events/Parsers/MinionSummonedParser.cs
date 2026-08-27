using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class MinionSummonedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public MinionSummonedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            var isTriggerPhase = (node.Parent == null
                      || node.Parent.Type != typeof(Parser.ReplayData.GameActions.Action)
                      || (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.TRIGGER);
            var isPowerPhase = (node.Parent == null
                       || node.Parent.Type != typeof(Parser.ReplayData.GameActions.Action)
                       || (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.POWER);
            if (!isTriggerPhase && !isPowerPhase)
            {
                return false;
            }
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.ZONE
                && (node.Object as TagChange).Value == (int)Zone.PLAY
                && GameState.CurrentEntities.ContainsKey((node.Object as TagChange).Entity)
                && GameState.CurrentEntities[(node.Object as TagChange).Entity].IsMinionLike();
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            var createFromFullEntity = node.Type == typeof(FullEntity)
                && (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.PLAY
                && (node.Object as FullEntity).IsMinionLike();
            var createFromShowEntity = node.Type == typeof(ShowEntity)
                && (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.PLAY
                && (node.Object as ShowEntity).IsMinionLike()
                && GameState.CurrentEntities.ContainsKey((node.Object as ShowEntity).Entity)
                && GameState.CurrentEntities[(node.Object as ShowEntity).Entity].GetTag(GameTag.ZONE) != (int)Zone.PLAY;
            var timeWarped = node.Type == typeof(FullEntity) 
                && GameState.GetGameEntity()?.GetTag(GameTag.BACON_ALT_TAVERN_IN_PROGRESS) == 1
                && (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.SETASIDE
                && (node.Object as FullEntity).IsMinionLike()
                && (node.Object as FullEntity).GetTag(GameTag.BACON_TIMEWARPED) == 1;
            return stateType == StateType.PowerTaskList
                && (createFromFullEntity || createFromShowEntity);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[(node.Object as TagChange).Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var creatorEntityId = entity.GetTag(GameTag.CREATOR);
            var creatorEntityCardId = GameState.CurrentEntities.ContainsKey(creatorEntityId)
                ? GameState.CurrentEntities[creatorEntityId].CardId
                : null;
            var eventName = entity.GetTag(GameTag.ZONE) == (int)Zone.HAND ? "MINION_SUMMONED_FROM_HAND" : "MINION_SUMMONED";
            //var shouldShortCircuit = ShouldShortCircuit(node);
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                eventName,
                GameEvent.CreateProvider(
                    eventName,
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creatorEntityCardId,
                        CreatorEntityId = creatorEntityId,
                        Tags = entity.Tags,
                    }
                ),
                true,
                node
            )};
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            // Prevent the same minion from being created twice, once from the PLAY block
            // and once from the Entity block
            var isPlayBlock = (node.Parent != null
                    && node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action)
                    && (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.PLAY);
            if (isPlayBlock)
            {
                var parentAction = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                var createdEntityId = node.Type == typeof(FullEntity)
                    ? (node.Object as FullEntity).Entity
                    : (node.Object as ShowEntity).Entity;
                if (createdEntityId == parentAction.Entity)
                {
                    return null;
                }
            }

            if (node.Type == typeof(FullEntity))
            {
                return CreateFromFullEntity(node);
            }
            else
            {
                return CreateFromShowEntity(node);
            }
        }

        public List<GameEventProvider> CreateFromFullEntity(Node node)
        {
            var fullEntity = node.Object as FullEntity;
            var cardId = fullEntity.CardId;
            var controllerId = fullEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var creatorEntityId = fullEntity.GetTag(GameTag.CREATOR);
            var creatorEntityCardId = GameState.CurrentEntities.ContainsKey(creatorEntityId)
                ? GameState.CurrentEntities[creatorEntityId].CardId
                : null;
            //var shouldShortCircuit = ShouldShortCircuit(node);
            return new List<GameEventProvider>
            {
                GameEventProvider.Create(
                fullEntity.TimeStamp,
                "MINION_SUMMONED",
                GameEvent.CreateProvider(
                    "MINION_SUMMONED",
                    cardId,
                    controllerId,
                    fullEntity.Id,
                    StateFacade,
                    //gameState,
                    new
                    {
                        CreatorCardId = creatorEntityCardId,
                        CreatorEntityId = creatorEntityId,
                        Tags = fullEntity.Tags,
                    }
                ),
                true,
                node
            )};
        }

        public List<GameEventProvider> CreateFromShowEntity(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            var cardId = showEntity.CardId;
            var controllerId = showEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var creatorEntityId = showEntity.GetTag(GameTag.CREATOR);
            var creatorEntityCardId = GameState.CurrentEntities.ContainsKey(creatorEntityId)
                ? GameState.CurrentEntities[creatorEntityId].CardId
                : null;
            var previousZone = GameState.CurrentEntities[(node.Object as ShowEntity).Entity].GetTag(GameTag.ZONE);
            var eventName = previousZone == (int)Zone.HAND ? "MINION_SUMMONED_FROM_HAND" : "MINION_SUMMONED";
            //var shouldShortCircuit = ShouldShortCircuit(node);
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                eventName,
                GameEvent.CreateProvider(
                    eventName,
                    cardId,
                    controllerId,
                    showEntity.Entity,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creatorEntityCardId,
                        CreatorEntityId = creatorEntityId,
                        Tags = showEntity.Tags,
                    }
                ),
                true,
                node
            )};
        }

        // Only short-circuit after a reroll
        //private bool ShouldShortCircuit(Node node)
        //{
        //    if (!StateFacade.IsBattlegrounds())
        //    {
        //        return false;
        //    }

        //    if (node.Parent == null || node.Parent.Type != typeof(Action))
        //    {
        //        return false;
        //    }

        //    var action = node.Parent.Object as Action;
        //    return action.Type == (int)BlockType.POWER
        //        && GameState.CurrentEntities.ContainsKey(action.Entity)
        //        && (GameState.CurrentEntities[action.Entity].CardId == CardIds.Refresh_TB_BaconShop_8p_Reroll_Button
        //            || GameState.CurrentEntities[action.Entity].CardId == CardIds.Refresh_TB_BaconShop_1p_Reroll_Button);
        //}
    }
}
