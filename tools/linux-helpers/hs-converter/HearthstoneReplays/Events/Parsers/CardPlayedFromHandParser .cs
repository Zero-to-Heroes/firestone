using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class CardPlayedFromHandParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardPlayedFromHandParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            if (stateType != StateType.PowerTaskList)
            {
                return false;
            }
            // In this case, it's not a "play"
            var isTriggerPhase = (node.Parent == null
                       || node.Parent.Type != typeof(Parser.ReplayData.GameActions.Action)
                       || (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.TRIGGER);
            var isPowerPhase = (node.Parent == null
                       || node.Parent.Type != typeof(Parser.ReplayData.GameActions.Action)
                       || (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.POWER);

            var sigilPlayed = !isTriggerPhase && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.ZONE
                && (node.Object as TagChange).Value == (int)Zone.SECRET 
                && GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.SIGIL) == 1
                && GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.ZONE) == (int)Zone.HAND;
            TagChange tagChange;
            FullEntity tagChangeEntity;
            var cardPlayed = node.Type == typeof(TagChange)
                && (tagChange = node.Object as TagChange).Name == (int)GameTag.ZONE
                && tagChange.Value == (int)Zone.PLAY
                && (tagChangeEntity = GameState.CurrentEntities[(node.Object as TagChange).Entity]).GetTag(GameTag.ZONE) == (int)Zone.HAND
                // The only case we actually consider the trigger phases is if we're handling a Cast When Drawn spell
                && ((!isTriggerPhase && !isPowerPhase )|| tagChangeEntity.GetTag(GameTag.CASTS_WHEN_DRAWN) == 1);
            return (sigilPlayed || cardPlayed);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(ShowEntity)
                && node.Parent != null
                && node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action)
                && (node.Parent.Object as Parser.ReplayData.GameActions.Action).Type == (int)BlockType.PLAY;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            if (GameState.CurrentEntities[tagChange.Entity].GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT)
            {
                var targetId = -1;
                string targetCardId = null;
                if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
                {
                    var action = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                    targetId = action.Target;
                    targetCardId = targetId > 0 ? GameState.CurrentEntities[targetId].CardId : null;
                }
                var creator = entity.GetTag(GameTag.CREATOR);
                var creatorCardId = creator != -1 && GameState.CurrentEntities.ContainsKey(creator)
                    ? GameState.CurrentEntities[creator].CardId
                    : null;
                //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);

                // Detect whether we are magnetizing
                var magnetizedTo = this.StateFacade.GsState.GameState.CurrentEntities.Values
                    .Reverse()
                    .FirstOrDefault(e => e.GetTag(GameTag.CREATOR) == tagChange.Entity && e.GetTag(GameTag.MAGNETIC) == 1);
                var magnetized = magnetizedTo != null;

                GameState.OnCardPlayed(tagChange.Entity, targetId);
                var debug = cardId == "BT_211";
                // Catch the "starts dormant" cases, where the tag is set after the card is played
                bool dormant = this.StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(entity.Entity)?.GetTag(GameTag.DORMANT) == 1;
                // Only compute additional props when providing the event, so that some "on play" effects have time to trigger 
                // (like Corridor's Creeper "start dormant")
                // UPDATE 2025-05-25: issue with this is that the cost becomes incorrect if it was reduced before being played
                var additionalProps = new
                {
                    TargetEntityId = targetId,
                    TargetCardId = targetCardId,
                    Attack = entity.GetTag(GameTag.ATK, 0),
                    Health = entity.GetTag(GameTag.HEALTH, 0),
                    CreatorCardId = creatorCardId,
                    Immune = entity.GetTag(GameTag.IMMUNE) == 1,
                    Dormant = dormant,
                    Cost = entity.GetTag(GameTag.COST, 0),
                    Magnetized = magnetized,
                    Tags = entity.Tags,
                };
                return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "CARD_PLAYED",
                    () =>
                    {
                        return new GameEvent
                        {
                            Type = "CARD_PLAYED",
                            Value = new
                            {
                                CardId = cardId,
                                ControllerId = controllerId,
                                LocalPlayer = StateFacade.LocalPlayer,
                                OpponentPlayer = StateFacade.OpponentPlayer,
                                EntityId = entity.Id,
                                //GameState = gameState, //fullGameState.BuildGameStateReport(),// gameState,
                                AdditionalProps = additionalProps
                            }
                        };
                    },
                    true,
                    node,
                    null,
                    // Wait for a short while to give "on play" effects time to resolve, like Corridor's Creeper "go dormant"
                    100
                )};
            }
            return null;
        }

        // I couldn't find any reason as to why the node is an Action, and not the ShowEntity directly
        // TODO: use ShowEntity instead of Action. This is more focused, and should fix the issue with
        // the delay when playing Jandice
        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            if (showEntity.GetTag(GameTag.CARDTYPE) == (int)CardType.ENCHANTMENT)
            {
                return null;
            }

            // Not sure that this is the best way to handle it. The game itself transforms the card, but here 
            // I am considering a new event instead. 
            // However, it's not crystal clear on the logs' side either, since two PLAY blocks are emitted, instead 
            // of simply emitting a new entity update node.
            var isOhMyYogg = (showEntity.GetTag(GameTag.LAST_AFFECTED_BY) != -1
                    && GameState.CurrentEntities.ContainsKey(showEntity.GetTag(GameTag.LAST_AFFECTED_BY))
                    && GameState.CurrentEntities[showEntity.GetTag(GameTag.LAST_AFFECTED_BY)].CardId == CardIds.OhMyYogg);
            var isSigil = showEntity.GetTag(GameTag.ZONE) == (int)Zone.SECRET && showEntity.GetTag(GameTag.SIGIL) == 1;
            if (showEntity.GetTag(GameTag.ZONE) == (int)Zone.PLAY || isSigil || isOhMyYogg)
            {
                var parentAction = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                var cardId = showEntity.CardId;
                var controllerId = showEntity.GetEffectiveController();
                //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
                var targetId = parentAction.Target;
                string targetCardId = targetId > 0 ? GameState.CurrentEntities[targetId].CardId : null;
                var creator = showEntity.GetTag(GameTag.CREATOR);
                var creatorCardId = creator != -1 && GameState.CurrentEntities.ContainsKey(creator)
                    ? GameState.CurrentEntities[creator].CardId
                    : null;

                // Detect whether we are magnetizing
                var magnetizedTo = this.StateFacade.GsState.GameState.CurrentEntities.Values
                    .Reverse()
                    .FirstOrDefault(e => e.GetTag(GameTag.CREATOR) == showEntity.Entity && e.GetTag(GameTag.MAGNETIC) == 1);
                var magnetized = magnetizedTo != null;

                FullEntity fullEntity = FullEntity.FromShowEntity(showEntity);
                GameState.OnCardPlayed(showEntity.Entity, targetId, fullEntity: fullEntity);
                var debug = cardId == "BT_211";
                // For now there can only be one card played per block
                var additionalProps = new
                {
                    TargetEntityId = targetId,
                    TargetCardId = targetCardId,
                    CreatorCardId = creatorCardId,
                    TransientCard = isOhMyYogg,
                    Immune = showEntity.GetTag(GameTag.IMMUNE) == 1,
                    Magnetized = magnetized,
                    Tags = showEntity.Tags,
                };
                return new List<GameEventProvider> { GameEventProvider.Create(
                    showEntity.TimeStamp,
                    "CARD_PLAYED",
                    GameEvent.CreateProvider(
                        "CARD_PLAYED",
                        cardId,
                        controllerId,
                        showEntity.Entity,
                        StateFacade,
                        additionalProps
                        ),
                    true,
                    node) };
            }
            return null;
        }
    }
}
