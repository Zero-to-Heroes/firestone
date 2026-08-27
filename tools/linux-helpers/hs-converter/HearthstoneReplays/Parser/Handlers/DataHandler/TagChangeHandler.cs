using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HearthstoneReplays.Events;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Parser.Handlers
{
    internal class TagChangeHandler
    {

        public static bool HandleTagChange(DateTime timestamp, string data, ParserState state, StateType stateType, StateFacade gameHelper, int indentLevel, Helper helper)
        {
            // Early check: only run regex if line contains "TAG_CHANGE"
            if (!data.Contains("TAG_CHANGE"))
            {
                return false;
            }
            var match = Regexes.ActionTagChangeRegex.Match(data);
            if (match.Success)
            {
                var rawEntity = match.Groups[1].Value;
                var tagName = match.Groups[2].Value;
                var value = match.Groups[3].Value;
                var defChange = match.Groups.Count >= 4 ? match.Groups[4].Value : null;
                Tag tag = null;
                try
                {
                    tag = helper.ParseTag(tagName, value);
                }
                catch (Exception e)
                {
                    Logger.Log("Warning when parsing TagChange: " + tagName + " with value " + value, e.Message);
                    return false;
                }
                state.GameState.UpdateEntityName(rawEntity);

                if (tag.Name == (int)GameTag.CURRENT_PLAYER)
                {
                    if (state.FirstPlayerEntityId == -1)
                    {
                        // If GameState logs, this is an int, in PowerTaskList, this is the player's BTag
                        int entityId = -1;
                        int.TryParse(rawEntity, out entityId);
                        if (entityId <= 0)
                        {
                            entityId = helper.GetPlayerIdFromName(rawEntity);
                        }
                        state.FirstPlayerEntityId = entityId;
                    }
                    UpdateCurrentPlayer(state, rawEntity, tag, helper);
                }

                if (stateType == StateType.PowerTaskList && tag.Name == (int)GameTag.PLAYSTATE && tag.Value == (int)PlayState.PLAYING)
                {
                    if (state.ReconnectionOngoing)
                    {
                        state.ReconnectionOngoing = false;
                        gameHelper.GsState.ReconnectionOngoing = false;
                        state.NodeParser.EnqueueGameEvent(new List<GameEventProvider> { GameEventProvider.Create(
                            timestamp,
                            "RECONNECT_OVER",
                            () => {
                                return new GameEvent
                                {
                                    Type = "RECONNECT_OVER",
                                };
                            },
                            false,
                            new Node(null, null, 0, null, data)) });
                    }
                }

                var entity = helper.ParseEntity(rawEntity);
                if (tag.Name == (int)GameTag.ENTITY_ID)
                {
                    entity = UpdatePlayerEntity(state, rawEntity, tag, entity);
                }

                // Ensure FullEntity for this entity is closed before processing TagChange.
                // When BLOCK_END is missing (e.g. DebugDump-only "Block End=(null)" between task lists),
                // the FullEntity may still be open and the entity not in CurrentEntities (e.g. Torch 181).
                if (state.Node?.Type == typeof(FullEntity) && (state.Node.Object as FullEntity).Id == entity)
                {
                    state.Node = state.Node.Parent ?? state.Node;
                }

                var tagChange = new TagChange
                {
                    Entity = entity,
                    Name = tag.Name,
                    Value = tag.Value,
                    TimeStamp = timestamp,
                    DefChange = defChange,
                    SubSpellInEffect = state.CurrentSubSpell?.GetActiveSubSpell(),
                };
                state.UpdateCurrentNode(typeof(Game), typeof(Action));
                state.CreateNewNode(new Node(typeof(TagChange), tagChange, indentLevel, state.Node, data));

                if (state.Node.Type == typeof(Game))
                    ((Game)state.Node.Object).AddData(tagChange);
                else if (state.Node.Type == typeof(Action))
                    ((Action)state.Node.Object).Data.Add(tagChange);
                else
                    throw new Exception("Invalid node " + state.Node.Type);

                state.GameState.TagChange(tagChange, defChange);

                // In BG, it sometimes happen that the BLOCK_END element is missing. This typically happens after 
                // a non-zero NUM_OPTIONS_PLAYED_THIS_TURN tag change.
                // From what I've seen, these should always go back to the root afterwards, so we force it here
                if (tagChange.Name == (int)GameTag.NUM_OPTIONS_PLAYED_THIS_TURN && tagChange.Value > 0)
                {
                    if (state.Node.Type != typeof(Game))
                    {
                        state.EndAction();
                    }
                    state.UpdateCurrentNode(typeof(Game));
                }
                return true;
            }
            return false;
        }

        private static void UpdateCurrentPlayer(ParserState state, string rawEntity, Tag tag, Helper helper)
        {
            if (tag.Value == 0)
            {
                try
                {
                    helper.ParseEntity(rawEntity);
                }
                catch
                {
                    var currentPlayer =
                        (PlayerEntity)state.CurrentGame.Data.Single(x => (x is PlayerEntity) && ((PlayerEntity)x).Id == state.CurrentPlayerId);
                    currentPlayer.Name = rawEntity;
                    currentPlayer.InitialName = Helper.innkeeperNames.Contains(rawEntity)
                        ? Helper.innkeeperNames[0]
                        : Helper.bobTavernNames.Contains(rawEntity)
                        ? Helper.bobTavernNames[0]
                        : rawEntity;
                }
            }
            else if (tag.Value == 1)
            {
                try
                {
                    helper.ParseEntity(rawEntity);
                }
                catch
                {
                    var currentPlayer =
                        (PlayerEntity)state.CurrentGame.Data.Single(x => (x is PlayerEntity) && ((PlayerEntity)x).Id != state.CurrentPlayerId);
                    currentPlayer.Name = rawEntity;
                    currentPlayer.InitialName = Helper.innkeeperNames.Contains(rawEntity)
                        ? Helper.innkeeperNames[0]
                        : Helper.bobTavernNames.Contains(rawEntity)
                        ? Helper.bobTavernNames[0]
                        : rawEntity;
                }
                state.CurrentPlayerId = helper.ParseEntity(rawEntity);
            }
        }

        private static int UpdatePlayerEntity(ParserState state, string rawEntity, Tag tag, int entity)
        {
            int tmp;
            if (!int.TryParse(rawEntity, out tmp) && !rawEntity.StartsWith("[") && rawEntity != "GameEntity")
            {
                if (entity != tag.Value)
                {
                    entity = tag.Value;
                    var tmpName = ((PlayerEntity)state.CurrentGame.Data[1]).Name;
                    ((PlayerEntity)state.CurrentGame.Data[1]).Name = ((PlayerEntity)state.CurrentGame.Data[2]).Name;
                    ((PlayerEntity)state.CurrentGame.Data[2]).Name = tmpName;

                    foreach (var dataObj in ((Game)state.Node.Object).Data)
                    {
                        var tChange = dataObj as TagChange;
                        if (tChange != null)
                            tChange.Entity = tChange.Entity == 2 ? 3 : 2;
                    }
                }
            }

            return entity;
        }
    }
}
