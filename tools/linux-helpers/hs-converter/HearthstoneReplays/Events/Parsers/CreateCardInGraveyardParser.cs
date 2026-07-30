using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    // This is used when reconnecting, as cards that have been played are now part of the graveyard right 
    // from the start
    public class CreateCardInGraveyardParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CreateCardInGraveyardParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            // For some reason, when spectating a game a lot of cards (from previous games I've watched / played?) are created
            // in the graveyard at the start of the game;
            var isValidElement = !StateFacade.Spectating || StateFacade.LocalPlayer?.Name != null;
            var appliesToFullEntity = isValidElement 
                && node.Type == typeof(FullEntity)
                && (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.GRAVEYARD
                && (node.Object as FullEntity).GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT;
            return stateType == StateType.PowerTaskList
                && appliesToFullEntity;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            //if (node.Type == typeof(ShowEntity))
            //{
            //    return CreateEventFromShowEntity(node);
            //}
            //else 
            if (node.Type == typeof(FullEntity))
            {
                return CreateEventFromFullEntity(node);
            }
            return null;
        }

        //private List<GameEventProvider> CreateEventFromShowEntity(Node node)
        //{
        //    ShowEntity showEntity = node.Object as ShowEntity;
        //    //Logger.Log("Will add creator " + showEntity.GetTag(GameTag.CREATOR) + " //" + showEntity.GetTag(GameTag.DISPLAYED_CREATOR), "");
        //    var creatorCardId = Oracle.FindCardCreatorCardId(GameState, showEntity, node);
        //    var creatorEntityId = Oracle.FindCardCreatorEntityId(GameState, showEntity, node);
        //    var cardId = Oracle.PredictCardId(GameState, creatorCardId, creatorEntityId, node, showEntity.CardId);
        //    var controllerId = showEntity.GetTag(GameTag.CONTROLLER);
        //    var previousZone = GameState.CurrentEntities[showEntity.Entity].GetTag(GameTag.ZONE);
        //    var gameState = GameEvent.BuildGameState(ParserState, GameState, null, showEntity);
        //    var entity = GameState.CurrentEntities[showEntity.Entity];
        //    // Oracle.PredictCardId(GameState, creatorCardId, creatorEntityId, node, showEntity.CardId);
        //    return new List<GameEventProvider> { GameEventProvider.Create(
        //            showEntity.TimeStamp,
        //            "RECEIVE_CARD_IN_HAND",
        //            GameEvent.CreateProvider(
        //                "RECEIVE_CARD_IN_HAND",
        //                cardId,
        //                controllerId,
        //                showEntity.Entity,
        //                ParserState,
        //                GameState,
        //                gameState,
        //                new {
        //                    CreatorCardId = creatorCardId, // Used when there is no cardId, so we can show at least the card that created it
        //                    IsPremium = entity.GetTag(GameTag.PREMIUM) == 1 || showEntity.GetTag(GameTag.PREMIUM) == 1
        //                }),
        //            true,
        //            node) };
        //}

        private List<GameEventProvider> CreateEventFromFullEntity(Node node)
        {
            FullEntity fullEntity = node.Object as FullEntity;
            var controllerId = fullEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var entityFromGameState = GameState.CurrentEntities.GetValueOrDefault(fullEntity.Entity);
            var debug = true;


            return new List<GameEventProvider> { GameEventProvider.Create(
                    fullEntity.TimeStamp,
                    "CREATE_CARD_IN_GRAVEYARD",
                    () => {
                        
                        // Because Souleater's Scythe creates the cards in the graveyard at the start of the game, 
                        // we add this condition, so that we only keep cards created by effects
                        // Problem: when reconnecting, this means that we can skip some information for the opposing player
                        //if (StateFacade.LocalPlayer.PlayerId != fullEntity.GetController() && (node.Parent == null || node.Parent.Object is Game))
                        //{
                        //    return null;
                        //}

                        // We do it here because of Diligent Notetaker - we have to know the last
                        // card played before assigning anything
                        var creator = Oracle.FindCardCreator(GameState, fullEntity, node);
                        var creatorCardId = creator?.Item1;
                        //var creatorEntityId = Oracle.FindCardCreatorEntityId(GameState, fullEntity, node);
                        var cardId = Oracle.PredictCardId(GameState, creatorCardId, creator?.Item2 ?? -1, node, fullEntity.CardId);
                        if (cardId == null && GameState.CurrentTurn == 1 && fullEntity.GetTag(GameTag.ZONE_POSITION) == 5)
                        {
                            var controller = GameState.GetController(fullEntity.GetEffectiveController());
                            if (controller.GetTag(GameTag.CURRENT_PLAYER) != 1)
                            {
                                cardId = "GAME_005";
                                creatorCardId = "GAME_005";
                            }
                        }

                        // Because Souleater's Scythe behaves weirdly in the logs, and creates the cards in the graveyard right at the start
                        // before even the Scythe has been revealed
                        // This is a hack and probably won't work in the future though, as it could apply to a variety of things
                        bool shouldRemoveFromInitialDeck = false;
                        FullEntity lastAffectedByEntity = null;
                        if (fullEntity.GetTag(GameTag.LAST_AFFECTED_BY) > 0
                            && StateFacade.GsState.GameState.CurrentEntities.ContainsKey(fullEntity.GetTag(GameTag.LAST_AFFECTED_BY)))
                        {
                            lastAffectedByEntity = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(fullEntity.GetTag(GameTag.LAST_AFFECTED_BY));
                            shouldRemoveFromInitialDeck = true;
                        }


                        return new GameEvent
                        {
                            Type =  "CREATE_CARD_IN_GRAVEYARD",
                            Value = new
                            {
                                CardId = cardId,
                                ControllerId = controllerId,
                                LocalPlayer = StateFacade.LocalPlayer,
                                OpponentPlayer = StateFacade.OpponentPlayer,
                                EntityId = fullEntity.Id,
                                //GameState = gameState,
                                AdditionalProps = new {
                                    CreatorCardId = creatorCardId,
                                    ShouldRemoveFromInitialDeck = shouldRemoveFromInitialDeck,
                                    IsPremium = fullEntity.GetTag(GameTag.PREMIUM) == 1,
                                    LastAffectedByEntityId = lastAffectedByEntity?.Id,
                                }
                            }
                        };
                    },
                    true,
                    node) };
        }
    }
}
