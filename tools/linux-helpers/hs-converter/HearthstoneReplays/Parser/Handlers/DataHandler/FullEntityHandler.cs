using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Parser.Handlers
{
    internal class FullEntityHandler
    {
        public static bool HandleFullEntity(DateTime timestamp, string data, ParserState state, int indentLevel, Helper helper)
        {
            var match = Regexes.ActionFullEntityUpdatingRegex.Match(data);
            if (!match.Success)
            {
                match = Regexes.ActionFullEntityCreatingRegex.Match(data);
            }
            if (match.Success)
            {
                var rawEntity = match.Groups[1].Value;
                var cardId = match.Groups[2].Value;
                var entity = helper.ParseEntity(rawEntity);
                state.GameState.UpdateEntityName(rawEntity);

                var fullEntity = new FullEntity { CardId = cardId, Id = entity, Tags = new List<Tag>(), TimeStamp = timestamp };
                fullEntity.SubSpellInEffect = state.CurrentSubSpell?.GetActiveSubSpell();
                //state.GameState.FullEntity(fullEntity, false);

                state.UpdateCurrentNode(typeof(Game), typeof(Action));

                var newNode = new Node(typeof(FullEntity), fullEntity, indentLevel, state.Node, data);
                if (state.Node.Type == typeof(Game))
                    ((Game)state.Node.Object).AddData(fullEntity);
                else if (state.Node.Type == typeof(Action))
                    ((Action)state.Node.Object).Data.Add(fullEntity);
                else
                    throw new Exception("Invalid node " + state.Node.Type);
                state.CreateNewNode(newNode);
                state.Node = newNode;
                return true;
            }
            return false;
        }
    }
}
