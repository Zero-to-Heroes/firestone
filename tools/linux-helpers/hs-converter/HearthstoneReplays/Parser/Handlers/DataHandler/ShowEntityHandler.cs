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
    internal class ShowEntityHandler
    {
        public static bool HandleShowEntity(DateTime timestamp, string data, ParserState state, int indentLevel, Helper helper)
        {
            var match = Regexes.ActionShowEntityRegex.Match(data);
            if (match.Success)
            {
                var rawEntity = match.Groups[1].Value;
                var cardId = match.Groups[2].Value;
                var entity = helper.ParseEntity(rawEntity);

                var showEntity = new ShowEntity { CardId = cardId, Entity = entity, Tags = new List<Tag>(), TimeStamp = timestamp };
                showEntity.SubSpellInEffect = state.CurrentSubSpell?.GetActiveSubSpell();
                state.UpdateCurrentNode(typeof(Game), typeof(Action));
                if (state.Node.Type == typeof(Game))
                    ((Game)state.Node.Object).AddData(showEntity);
                else if (state.Node.Type == typeof(Action))
                    ((Action)state.Node.Object).Data.Add(showEntity);
                else
                    throw new Exception("Invalid node " + state.Node.Type + " while parsing " + data);
                var newNode = new Node(typeof(ShowEntity), showEntity, indentLevel, state.Node, data);
                state.CreateNewNode(newNode);
                state.Node = newNode;
                return true;
            }
            return false;
        }
    }
}
