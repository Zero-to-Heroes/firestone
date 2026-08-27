using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using HearthstoneReplays.Parser.ReplayData.Entities;

namespace HearthstoneReplays.Events.Cards
{
    internal class RunicAdornment
    {
        public static string PredctCardId(GameState gameState, string creatorCardId, int creatorEntityId, Node node, StateFacade stateFacade)
        {
            if (node.Parent?.Type != typeof(Action))
            {
                return null;
            }
            
            var act = node.Parent.Parent.Object as Action;
            if (act.Type != (int)BlockType.PLAY)
            {
                return null;
            }

            var triggerAction = act.Data
                .Where(d => d is Action)
                .Select(d => d as Action)
                .Where(a => a.Type == (int)BlockType.POWER && a.Entity == act.Entity)
                .FirstOrDefault();
            if (triggerAction == null)
            {
                return null;
            }

            var tagChange = triggerAction.Data
                .Where(d => d is TagChange)
                .Select(d => d as TagChange)
                .Where(d => d.Name == (int)GameTag.ZONE && d.Value == (int)Zone.HAND)
                .FirstOrDefault();
            if (tagChange == null)
            {
                return null;
            }

            var entity = gameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            return entity?.CardId;
        }
    }
}
