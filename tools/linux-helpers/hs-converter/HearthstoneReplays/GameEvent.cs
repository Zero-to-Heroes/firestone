using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData.Meta.Options;
using HearthstoneReplays.Events;

namespace HearthstoneReplays
{
    public class GameEvent
    {

        public string Type { get; set; }
        public Object Value { get; set; }
        public GameEventDebug Debug { get; set; }

        public override string ToString()
        {
            return "GameEvent: " + Type + " (" + Value + ")";
        }

        public static Func<GameEvent> CreateProvider(
            string type,
            string cardId,
            int controllerId,
            int entityId,
            StateFacade helper,
            //GameStateShort gameState,
            object additionalProps = null,
            System.Action preprocess = null)
        {
            return () =>
            {
                if (preprocess != null)
                {
                    preprocess.Invoke();
                }
                return new GameEvent
                {
                    Type = type,
                    Value = new
                    {
                        CardId = cardId,
                        ControllerId = controllerId,
                        LocalPlayer = helper.LocalPlayer,
                        OpponentPlayer = helper.OpponentPlayer,
                        EntityId = entityId,
                        // We do it now so that the zone positions should have been resolved, while 
                        // if we compute it when the event is built, there is no guarantee of that
                        // BUT if we compute it now, we have no guarantee that the state matches what 
                        // the state looked like when we built the event, so building it beforehand
                        // is the way to go
                        //GameState = gameState, //fullGameState.BuildGameStateReport(),// gameState,
                        AdditionalProps = additionalProps
                    }
                };
            };
        }

        public static Func<GameEvent> CreateProviderWithDeferredProps(
            string type,
            string cardId,
            int controllerId,
            int entityId,
            StateFacade helper,
            //GameStateShort gameState,
            Func<object> additionalProsProvider)
        {
            return () =>
            {
                return new GameEvent
                {
                    Type = type,
                    Value = new
                    {
                        CardId = cardId,
                        ControllerId = controllerId,
                        LocalPlayer = helper.LocalPlayer,
                        OpponentPlayer = helper.OpponentPlayer,
                        EntityId = entityId,
                        // We do it now so that the zone positions should have been resolved, while 
                        // if we compute it when the event is built, there is no guarantee of that
                        // BUT if we compute it now, we have no guarantee that the state matches what 
                        // the state looked like when we built the event, so building it beforehand
                        // is the way to go
                        //GameState = gameState, //fullGameState.BuildGameStateReport(),// gameState,
                        AdditionalProps = additionalProsProvider.Invoke()
                    }
                };
            };
        }

        // It needs to be built beforehand, as the game state we pass is not immutable
        public static GameStateShort BuildGameState(ParserState parserState, StateFacade helper, GameState gameState)
        {
            if (parserState == null || helper.LocalPlayer == null || helper.OpponentPlayer == null)
            {
                //Logger.Log("Can't build game state", "");
                return new GameStateShort();
            }

            var allEntities = gameState.CurrentEntities.Values.ToList();            
            var result = new GameStateShort()
            {
                ActivePlayerId = gameState.GetActivePlayerId(),
                Player = new GameStateShortPlayer()
                {
                    PlayerEntity = GameEvent.BuildPlayerEntity(parserState.getPlayers(), allEntities, parserState.Options, helper.LocalPlayer.PlayerId, gameState.CurrentEntities),
                    Hero = GameEvent.BuildHero(allEntities, parserState.Options, helper.LocalPlayer.PlayerId, gameState.CurrentEntities),
                    Weapon = GameEvent.BuildWeapon(allEntities, parserState.Options, helper.LocalPlayer.PlayerId, gameState.CurrentEntities),
                    Hand = GameEvent.BuildZone(allEntities, parserState.Options, Zone.HAND, helper.LocalPlayer.PlayerId, gameState.CurrentEntities),
                    Board = GameEvent.BuildBoard(allEntities, parserState.Options, helper.LocalPlayer.PlayerId, gameState.CurrentEntities),
                    Secrets = GameEvent.BuildSecrets(allEntities, parserState.Options, helper.LocalPlayer.PlayerId, gameState.CurrentEntities),
                    Deck = GameEvent.BuildZone(allEntities, parserState.Options, Zone.DECK, helper.LocalPlayer.PlayerId, gameState.CurrentEntities),
                    AllEntities = allEntities
                        .Where(entity => entity.GetEffectiveController() == helper.LocalPlayer.PlayerId)
                        .Select(entity => BuildSmallEntity(entity, parserState.Options, gameState.CurrentEntities, allEntities))
                        .ToList(),
                    LettuceAbilities = GameEvent.BuildZone(allEntities, parserState.Options, Zone.LETTUCE_ABILITY, helper.LocalPlayer.PlayerId, gameState.CurrentEntities),
                },
                Opponent = new GameStateShortPlayer()
                {
                    PlayerEntity = GameEvent.BuildPlayerEntity(parserState.getPlayers(), allEntities, parserState.Options, helper.OpponentPlayer.PlayerId, gameState.CurrentEntities),
                    Hero = GameEvent.BuildHero(allEntities, parserState.Options, helper.OpponentPlayer.PlayerId, gameState.CurrentEntities),
                    Weapon = GameEvent.BuildWeapon(allEntities, parserState.Options, helper.OpponentPlayer.PlayerId, gameState.CurrentEntities),
                    Hand = GameEvent.BuildZone(allEntities, parserState.Options, Zone.HAND, helper.OpponentPlayer.PlayerId, gameState.CurrentEntities),
                    Board = GameEvent.BuildBoard(allEntities, parserState.Options, helper.OpponentPlayer.PlayerId, gameState.CurrentEntities),
                    Secrets = GameEvent.BuildSecrets(allEntities, parserState.Options, helper.OpponentPlayer.PlayerId, gameState.CurrentEntities),
                    Deck = GameEvent.BuildZone(allEntities, parserState.Options, Zone.DECK, helper.OpponentPlayer.PlayerId, gameState.CurrentEntities),
                    AllEntities = allEntities
                        .Where(entity => entity.GetEffectiveController() == helper.OpponentPlayer.PlayerId)
                        .Select(entity => BuildSmallEntity(entity, parserState.Options, gameState.CurrentEntities, allEntities))
                        .ToList(),
                    LettuceAbilities = GameEvent.BuildZone(allEntities, parserState.Options, Zone.LETTUCE_ABILITY, helper.OpponentPlayer.PlayerId, gameState.CurrentEntities),
                }
            };
            return result;
        }

        private static GameStateShortSmallEntity BuildPlayerEntity(List<PlayerEntity> playerEntities, List<FullEntity> allEntities, Options options, int playerId, Dictionary<int, FullEntity> fullEntitiesMap)
        {
            var playerEntityId = playerEntities
                .FirstOrDefault(e => e.PlayerId == playerId)
                ?.GetTag(GameTag.ENTITY_ID);
            var player = allEntities
                .Where(e => e.Entity == playerEntityId)
                .Select(entity => BuildSmallEntity(entity, options, fullEntitiesMap, allEntities))
                .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                .FirstOrDefault();
            return player ?? new GameStateShortSmallEntity();
        }

        private static GameStateShortSmallEntity BuildHero(List<FullEntity> allEntities, Options options, int playerId, Dictionary<int, FullEntity> fullEntitiesMap)
        {
            try
            {
                var hero = allEntities
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                    .Where(entity => entity.GetEffectiveController() == playerId)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Select(entity => BuildSmallEntity(entity, options, fullEntitiesMap, allEntities))
                    .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                    .FirstOrDefault(); 
                return hero ?? new GameStateShortSmallEntity();
            }
            catch (Exception e)
            {
                Logger.Log("Warning: issue when trying to build hero " + e.Message, e.StackTrace);
                return BuildHero(allEntities, options, playerId, fullEntitiesMap);
            }
        }

        private static GameStateShortSmallEntity BuildWeapon(List<FullEntity> allEntities, Options options, int playerId, Dictionary<int, FullEntity> fullEntitiesMap)
        {
            try
            {
                var weapon = allEntities
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.WEAPON)
                    .Where(entity => entity.GetEffectiveController() == playerId)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Select(entity => BuildSmallEntity(entity, options, fullEntitiesMap, allEntities))
                    .LastOrDefault();
                return weapon ?? new GameStateShortSmallEntity();
            }
            catch (Exception e)
            {
                Logger.Log("Warning: issue when trying to build weapon " + e.Message, e.StackTrace);
                return BuildWeapon(allEntities, options, playerId, fullEntitiesMap);
            }
        }

        private static List<GameStateShortSmallEntity> BuildZone(List<FullEntity> allEntities, Options options, Zone zone, int playerId, Dictionary<int, FullEntity> fullEntitiesMap)
        {
            try
            {
                return allEntities
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)zone)
                    .Where(entity => entity.GetEffectiveController() == playerId)
                    .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION) == -1 ? 99 : entity.GetTag(GameTag.ZONE_POSITION))
                    .Select(entity => BuildSmallEntity(entity, options, fullEntitiesMap, allEntities))
                    .ToList();
            }
            catch (Exception e)
            {
                Logger.Log("Warning: issue when trying to build zone " + e.Message, e.StackTrace);
                return BuildZone(allEntities, options, zone, playerId, fullEntitiesMap);
            }
        }

        private static List<GameStateShortSmallEntity> BuildSecrets(List<FullEntity> allEntities, Options options, int playerId, Dictionary<int, FullEntity> fullEntitiesMap)
        {
            try
            {
                return allEntities
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.SECRET)
                    .Where(entity => entity.GetEffectiveController() == playerId)
                    .Select(entity => BuildSmallEntity(entity, options, fullEntitiesMap, allEntities))
                    .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                    .ToList();
            }
            catch (Exception e)
            {
                Logger.Log("Warning: issue when trying to build secrets " + e.Message, e.StackTrace);
                return new List<GameStateShortSmallEntity>();
            }
        }

        private static List<GameStateShortSmallEntity> BuildBoard(List<FullEntity> allEntities, Options options, int playerId, Dictionary<int, FullEntity> fullEntitiesMap)
        {
            try
            {
                return allEntities
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Where(entity => entity.GetEffectiveController() == playerId)
                    .Where(entity => entity.IsMinionLike())
                    .Select(entity => BuildSmallEntity(entity, options, fullEntitiesMap, allEntities))
                    .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                    .ToList();
            }
            catch (Exception e)
            {
                Logger.Log("Warning: issue when trying to build zone " + e.Message, e.StackTrace);
                return new List<GameStateShortSmallEntity>();
            }
        }

        private static bool RemovedFromPlay(FullEntity entity, TagChange tagChange, ShowEntity showEntity)
        {
            if (tagChange == null && showEntity == null)
            {
                return false;
            }
            var valueTC = tagChange != null
                && tagChange.Entity == entity.Entity
                && tagChange.Name == (int)GameTag.ZONE
                && tagChange.Value != (int)Zone.PLAY;
            var valueSE = showEntity != null
                && showEntity.Entity == entity.Entity
                && showEntity.GetTag(GameTag.ZONE) > 0
                && showEntity.GetTag(GameTag.ZONE) != (int)Zone.PLAY;
            return valueTC || valueSE;
        }

        private static bool PutInPlay(FullEntity entity, TagChange tagChange, ShowEntity showEntity)
        {
            if (tagChange == null && showEntity == null)
            {
                return false;
            }
            var valueTC = tagChange != null
                && tagChange.Entity == entity.Entity
                && tagChange.Name == (int)GameTag.ZONE
                && tagChange.Value == (int)Zone.PLAY;
            var valueSE = showEntity != null
                && showEntity.Entity == entity.Entity
                && showEntity.GetTag(GameTag.ZONE) == (int)Zone.PLAY;
            return valueTC || valueSE;
        }

        private static GameStateShortSmallEntity BuildSmallEntity(BaseEntity entity, Options options, Dictionary<int, FullEntity> fullEntitiesMap, List<FullEntity> fullEntities)
        {
            string cardId = null;
            if (entity.GetType() == typeof(FullEntity))
            {
                cardId = (entity as FullEntity).CardId;
            }
            var newTags = entity.GetTagsCopy();
            return new GameStateShortSmallEntity()
            {
                entityId = entity.Id,
                cardId = cardId,
                attack = entity.GetTag(GameTag.ATK),
                health = entity.GetTag(GameTag.HEALTH),
                durability = entity.GetTag(GameTag.DURABILITY_DEPRECATED) == -1 ? entity.GetTag(GameTag.HEALTH) : entity.GetTag(GameTag.DURABILITY_DEPRECATED),
                // Doesn't work because we get the options after the game state
                //validOption = options != null && options.OptionList != null 
                //    ? options.OptionList
                //        .Where(option => option.Error == (int)PlayReq.NONE)
                //        .Any(option => option.Entity == entity.Id) 
                //    : false,
                tags = newTags,
                enchantments = fullEntities
                    ?.Where(e => e.GetTagSecure(GameTag.ATTACHED) == entity.Id)
                    ?.Where(e => e.GetZone() == (int)Zone.PLAY)
                    .Select(e => {
                        var enchantmentCardId = e.CardId == CardIds.PolarizingBeatboxer_PolarizedEnchantment
                            ? "" + fullEntitiesMap
                                .GetValueOrDefault(e.GetTag(GameTag.CREATOR))
                                ?.GetTag(GameTag.ENTITY_AS_ENCHANTMENT)
                            : e.CardId;
                        return new GameStateShortEnchantment()
                        {
                            entityId = e.Entity,
                            cardId = enchantmentCardId,
                            tags = e.GetTagsCopy(),
                        };
                    })
                    .ToList()

            };
        }

        private static object BuildSmallHeroEntity(BaseEntity entity)
        {
            string cardId = null;
            if (entity.GetType() == typeof(FullEntity))
            {
                cardId = (entity as FullEntity).CardId;
            }
            return new
            {
                entityId = entity.Id,
                cardId = cardId,
                attack = entity.GetTag(GameTag.ATK),
                health = entity.GetTag(GameTag.HEALTH),
                tags = entity.GetTagsCopy()
            };
        }
    }

    public class GameEventDebug
    {
        public string CreationLogLine;
        public DateTime Timestamp;
        public int Index;

    }
}
