using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using System.Linq;
using Newtonsoft.Json;

namespace HearthstoneReplays.Events.Parsers
{
    public class DamageParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade Helper { get; set; }

        public DamageParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.Helper = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.DAMAGE
                // Rogue Damage tags, like the ones used to indicate the other heroes health change in BGS
                && node.Parent.Type != typeof(Parser.ReplayData.GameActions.Action);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(Parser.ReplayData.GameActions.Action)
                && HasDamageTag(node.Object as Parser.ReplayData.GameActions.Action);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var impactedEntity = GameState.CurrentEntities[tagChange.Entity];
            // We want the damage dealt to heroes by the player to be sent by the meta tags, because 
            // that way we can build the stats
            // They changed the timing for this. Now, it triggers before the attack completes, so we can't rely 
            // on the hero being in play or defending anymore
            var gameEntity = GameState.GetGameEntity();
            var playerHero = GameState.CurrentEntities.Values
                .Where(entity => entity.IsHero())
                .Where(entity => entity.GetTag(GameTag.CONTROLLER) == Helper.LocalPlayer.PlayerId)
                .FirstOrDefault();
            var opponentCardId = GameState.CurrentEntities.Values
                .Where(entity => entity.IsHero())
                .Where(entity => entity.GetTag(GameTag.PLAYER_ID) == playerHero.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID))
                .FirstOrDefault();
            var targetCardId = impactedEntity?.CardId;

            if (Helper.IsBattlegrounds()
                    && impactedEntity.IsHero()
                    // It seems to be that, if we are in a battle, the "next opponent" damage is the one we will do in battle
                    && (gameEntity.GetTag(GameTag.BOARD_VISUAL_STATE) == 2 || gameEntity.GetTag(GameTag.BOARD_VISUAL_STATE) == -1)
                    && (opponentCardId?.CardId == targetCardId || opponentCardId?.CardId == "TB_BaconShop_HERO_PH"))
                    //&& impactedEntity.IsInPlay()
                    //&& impactedEntity.GetTag(GameTag.DEFENDING) == 1)
            {
                return null;
            }
            var previousDamage = impactedEntity.GetTag(GameTag.DAMAGE, 0);
            //var gameState = GameEvent.BuildGameState(ParserState, Helper, GameState, tagChange, null);
            var targetEntityId = impactedEntity?.Entity;
            // If the target is a hero card in BG, the controller will refer to Bob, which is not what we want
            var targetControllerId = impactedEntity.HasTag(GameTag.BACON_HERO_CAN_BE_DRAFTED)
                ? impactedEntity.GetTag(GameTag.PLAYER_ID)
                : impactedEntity.GetEffectiveController();
            var actualDamage = Math.Max(0, tagChange.Value - previousDamage - impactedEntity.GetTag(GameTag.ARMOR, 0));
            // If there is a META block with the same info, this means the event will already be sent
            // when parsing that block, with more detailed info (like the source of the damage), so 
            // we ignore it
            // Some thoughts:
            // - there might be a bug here (where the damage is counted twice), both in the current implementation
            // and the offline parser. Since for now they give the same results, I'll keep this consistency and will
            // revisit that assumption later (maybe there is a fix to do on both parsers to ignore the tagchange
            // if a damage is already done in a meta tag)
            // - the events don't seem to send the damage info twice, so maybe there's no issue after all?
            // - this doesn't work in BG, because the damage is done once during the combat, then applied again, to 
            // another entityId, outside of the combat block. 
            // So for BG I will simply ignore META damages done to entities that are in play, and if that entity 
            // is a hero. All damage done in combat in BG should happen with META tags, so there should be no loss of 
            // info doing that
            // One issue though: we lose the source of the damage, which means we can't compute the hero damage stats anymore
            var damages = new Dictionary<string, DamageInternal>();
            damages[targetCardId + "-" + targetEntityId] = new DamageInternal
            {
                SourceControllerId = -1,
                SourceEntityId = -1,
                TargetControllerId = targetControllerId,
                TargetEntityId = tagChange.Entity,
                TargetCardId = targetCardId,
                Damage = actualDamage,
                Timestamp = tagChange.TimeStamp,
            };
            var activePlayerId = GameState.GetActivePlayerId();
            return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "DAMAGE",
                    // The structure of this event is too specific to be added to the generic GameEvent.CreateProvider() method
                    () => new GameEvent
                    {
                        Type = "DAMAGE",
                        Value = new
                        {
                            Targets = damages,
                            LocalPlayer = Helper.LocalPlayer,
                            OpponentPlayer = Helper.OpponentPlayer,
                            ActivePlayerId = activePlayerId,
                        }
                    },
                    true,
                    node) 
            };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Parser.ReplayData.GameActions.Action;
            // NOTE: it looks like that, if the parent action is a PLAY action, the damage comes from
            // simply paying stuff with health. The assumption is that, for cards that deal damage as
            // an effect, a POWER block is used instead
            var isPayingWithHealth = action.Type == (int)BlockType.PLAY;
            var damageTags = action.Data
                .Where((d) => d.GetType() == typeof(MetaData))
                .Select((meta) => meta as MetaData)
                .Where((meta) => meta.Meta == (int)MetaDataType.DAMAGE);
            Dictionary<string, Dictionary<string, DamageInternal>> totalDamages = new Dictionary<string, Dictionary<string, DamageInternal>>();
            //var gameState = GameEvent.BuildGameState(ParserState, Helper, GameState, null, null);
            foreach (var damageTag in damageTags)
            {
                foreach (var info in damageTag.MetaInfo)
                {
                    var damageTarget = GameState.CurrentEntities[info.Entity];
                    // See comment in the TAG_CHANGE parser above
                    // The exception is for the local player, since there is no extraneous tag_change to 
                    // correct the damage info
                    if (Helper.IsBattlegrounds() 
                        && damageTarget.IsHero() 
                        && damageTarget.IsInPlay()
                        && damageTarget.GetController() != Helper.LocalPlayer.PlayerId
                        // When dealing damage to the enemy hero, we want to have the damage source
                        && !IsDefendingDuringAction(action, info.Entity))
                    {
                        continue;
                    }

                    // If source or target are player entities, they don't have any 
                    // attached cardId
                    var targetEntityId = damageTarget.Id;
                    var targetCardId = GameState.GetCardIdForEntity(damageTarget.Id);
                    // If the target is a hero card in BG, the controller will refer to Bob, which is not what we want
                    var targetControllerId = damageTarget.HasTag(GameTag.BACON_HERO_CAN_BE_DRAFTED) 
                        ? damageTarget.GetTag(GameTag.PLAYER_ID) 
                        : damageTarget.GetEffectiveController();
                    var damageSource = GetDamageSource(damageTarget, action, damageTag);
                    var sourceEntityId = damageSource.Id;
                    var sourceCardId = GameState.GetCardIdForEntity(damageSource.Id);
                    var sourceControllerId = damageSource.HasTag(GameTag.BACON_HERO_CAN_BE_DRAFTED)
                        ? damageSource.GetTag(GameTag.PLAYER_ID)
                        : damageSource.GetEffectiveController();
                    Dictionary<string, DamageInternal> currentSourceDamages = null;
                    if (totalDamages.ContainsKey(sourceCardId + "-" + sourceEntityId))
                    {
                        currentSourceDamages = totalDamages[sourceCardId + "-" + sourceEntityId];
                    }
                    else
                    {
                        currentSourceDamages = new Dictionary<string, DamageInternal>();
                        totalDamages[sourceCardId + "-" + sourceEntityId] = currentSourceDamages;
                    }

                    DamageInternal currentTargetDamages = null;
                    if (currentSourceDamages.ContainsKey(targetCardId + "-" + targetEntityId))
                    {
                        currentTargetDamages = currentSourceDamages[targetCardId + "-" + targetEntityId];
                    }
                    else
                    {
                        currentTargetDamages = new DamageInternal
                        {
                            SourceEntityId = sourceEntityId,
                            SourceControllerId = sourceControllerId,
                            TargetEntityId = targetEntityId,
                            TargetControllerId = targetControllerId,
                            TargetCardId = targetCardId,
                            Damage = 0,
                            Hits = 0,
                            Timestamp = info.TimeStamp,
                            IsPayingWithHealth = isPayingWithHealth
                        };
                        currentSourceDamages[targetCardId + "-" + targetEntityId] = currentTargetDamages;
                    }
                    // FIXME: this doesn't work when armor is involved?
                    currentTargetDamages.Damage = currentTargetDamages.Damage + damageTag.Data;
                    currentTargetDamages.Hits += 1;
                }
            }

            List<GameEventProvider> result = new List<GameEventProvider>();
            // Now send one event per source
            foreach (var damageSource in totalDamages.Keys)
            {
                var sourceCardId = damageSource.Split('-')[0];
                var targets = totalDamages[damageSource];
                var timestamp = totalDamages[damageSource].First().Value.Timestamp;
                var sourceEntityId = totalDamages[damageSource].First().Value.SourceEntityId;
                var sourceControllerId = totalDamages[damageSource].First().Value.SourceControllerId;
                var activePlayerId = GameState.GetActivePlayerId();
                result.Add(GameEventProvider.Create(
                    timestamp,
                    "DAMAGE",
                    // The structure of this event is too specific to be added to the generic GameEvent.CreateProvider() method
                    () => new GameEvent
                    {
                        Type = "DAMAGE",
                        Value = new
                        {
                            SourceCardId = sourceCardId,
                            SourceEntityId = sourceEntityId,
                            SourceControllerId = sourceControllerId,
                            Targets = targets,
                            LocalPlayer = Helper.LocalPlayer,
                            OpponentPlayer = Helper.OpponentPlayer,
                            ActivePlayerId = activePlayerId,
                        }
                    },
                    true,
                    node));
            }

            return result;
        }

        private bool IsDefendingDuringAction(Parser.ReplayData.GameActions.Action action, int entity)
        {
            return action.Data
                .Where(data => data is TagChange)
                .Select(data => data as TagChange)
                .Where(tag => tag.Name == (int)GameTag.DEFENDING && tag.Value == 1)
                .Where(tag => tag.Entity == entity)
                .Count() > 0;
        }

        private bool HasDamageTag(Parser.ReplayData.GameActions.Action action)
        {
            var data = action.Data;
            var numberOfDamageTags = data
                .Where((d) => d.GetType() == typeof(MetaData))
                .Where((meta) => (meta as MetaData).Meta == (int)MetaDataType.DAMAGE)
                .Count();
            return numberOfDamageTags > 0;
        }

        private FullEntity GetDamageSource(FullEntity target, Parser.ReplayData.GameActions.Action action, MetaData meta)
        {
            var actionSource = GameState.CurrentEntities[action.Entity];
            if (action.Type == (int)BlockType.ATTACK)
            {
                var damageSource = action.Entity;
                if (target.Id == action.Entity)
                {
                    // This doesn't work, because once the action is ended the PROPOSED_DEFENDER is reset
                    // var defender = GameState.GetGameEntity().GetTag(GameTag.PROPOSED_DEFENDER);
                    // We still want to handle the attack at the global level (so that we can group 
                    // damage events), so we need to use a trick
                    var metaIndex = action.Data.IndexOf(meta);
                    for (var i = 0; i < metaIndex; i++)
                    {
                        var data = action.Data[i];
                        if (data.GetType() == typeof(TagChange) 
                            && (data as TagChange).Name == (int)GameTag.PROPOSED_DEFENDER
                            && (data as TagChange).Entity == GameState.GetGameEntity().Id)
                        {
                            damageSource = (data as TagChange).Value;
                        }
                    }
                }
                return GameState.CurrentEntities[damageSource];
            }
            return actionSource;
        }

        private class DamageInternal
        {
            public string SourceCardId;
            public int SourceEntityId;
            public int SourceControllerId;
            public int TargetEntityId;
            public int TargetControllerId;
            public string TargetCardId;
            public int Damage;
            public int Hits;
            public DateTime Timestamp;
            public bool IsPayingWithHealth;

            public override string ToString()
            {
                return JsonConvert.SerializeObject(this);
            }
        }
    }
}
