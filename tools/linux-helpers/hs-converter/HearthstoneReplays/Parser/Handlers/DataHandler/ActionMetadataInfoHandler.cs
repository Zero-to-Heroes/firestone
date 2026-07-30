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
using HearthstoneReplays.Parser.ReplayData.Meta;

namespace HearthstoneReplays.Parser.Handlers
{
    internal class ActionMetadataInfoHandler
    {
        public static bool HandleActionMetaDataInfo(DateTime timestamp, string data, ParserState state, int indentLevel, Helper helper)
        {
            var match = Regexes.ActionMetaDataInfoRegex.Match(data);
            if (match.Success)
            {
                var index = match.Groups[1].Value;
                var rawEntity = match.Groups[2].Value;
                var entity = helper.ParseEntity(rawEntity);
                var metaInfo = new Info { Id = entity, Index = int.Parse(index), Entity = entity, TimeStamp = timestamp };
                if (state.Node.Type == typeof(MetaData))
                    ((MetaData)state.Node.Object).MetaInfo.Add(metaInfo);
                else
                    throw new Exception("Invalid node " + state.Node.Type + " while parsing " + data);
                state.CreateNewNode(new Node(typeof(Info), metaInfo, indentLevel, state.Node, data));
                return true;
            }
            return false;
        }
    }
}
