using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HearthstoneReplays.Parser.Handlers
{
    internal class TagHandler
    {
        public static bool HandleTag(DateTime timestamp, string data, ParserState state, Helper helper)
        {
            // This is not supported yet
            if (data.Contains("CACHED_TAG_FOR_DORMANT_CHANGE"))
            {
                return false;
            }

            // When in reconnect, we don't parse the GameEntity and 
            // PlayerEntity nodes, so the tags think they are parsed while 
            // under the Game root node
            if (state.Node.Type == typeof(Game))
            {
                return false;
            }

            var match = Regexes.ActionTagRegex.Match(data);
            if (match.Success)
            {
                var tagName = match.Groups[1].Value;
                var value = match.Groups[2].Value;
                //var debug = value == "BATTLEGROUND_TRINKET";
                Tag tag = null;
                try
                {
                    tag = helper.ParseTag(tagName, value);
                }
                catch (Exception e)
                {
                    Logger.Log("Warning when parsing Tag: " + tagName + " with value " + value, e.Message);
                    return false;
                }

                // To handle reconnects
                if (tag.Name == (int)GameTag.CURRENT_PLAYER && state.Node.Object is PlayerEntity)
                {
                    state.FirstPlayerEntityId = ((PlayerEntity)state.Node.Object).Id;
                }

                if (state.Node.Type == typeof(GameEntity))
                {
                    ((GameEntity)state.Node.Object).Tags.Add(tag);
                    if (tag.Name == (int)GameTag.GAME_SEED)
                    {
                        state.CurrentGame.GameSeed = tag.Value;
                    }
                }
                else if (state.Node.Type == typeof(PlayerEntity))
                    ((PlayerEntity)state.Node.Object).Tags.Add(tag);
                else if (state.Node.Type == typeof(FullEntity))
                {
                    var fullEntity = ((FullEntity)state.Node.Object);
                    fullEntity.Tags.Add(tag);
                    // Push the changes as they occur, so that it's ok if we miss a block end because of malformed logs
                    // UPDATE: this is in fact not possible, because I need to have the FullEntities in the state with their previous
                    // tags when applying CloseNode effects.
                    // It might be possible to work around that, but it will require too much work and it too risky
                    //state.GameState.CurrentEntities[((FullEntity)state.Node.Object).Entity].Tags.Add(tag);
                }
                else if (state.Node.Type == typeof(ShowEntity))
                {
                    ((ShowEntity)state.Node.Object).Tags.Add(tag);
                }
                else if (state.Node.Type == typeof(ChangeEntity))
                {
                    ((ChangeEntity)state.Node.Object).Tags.Add(tag);
                    state.GameState.Tag(tag, ((ChangeEntity)state.Node.Object).Entity);
                }
                else
                {
                    Logger.Log("Invalid node " + state.Node.Type, data);
                }
                return true;
            }
            return false;
        }
    }
}
