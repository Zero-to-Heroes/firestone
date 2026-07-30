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
    internal class DeepSpaceCurator
    {
        public static List<Tag> GuessTags(GameState gameState, string creatorCardId, int creatorEntityId, Node node, StateFacade stateFacade)
        {
            if (node.Parent?.Parent?.Type != typeof(Action))
            {
                return null;
            }
            
            var act = node.Parent.Parent.Object as Action;
            if (act.Type != (int)BlockType.PLAY)
            {
                return null;
            }

            var playedEntityId = act.Entity;
            var showEntity = act.Data
                .Where(d => d is ShowEntity)
                .Select(d => d as ShowEntity)
                .Where(e => e.Entity == playedEntityId)
                .FirstOrDefault();
            var guessedTags = new List<Tag>();
            if (showEntity != null)
            {
                guessedTags.Add(new Tag() { Name = (int)GameTag.COST, Value = showEntity.GetTag(GameTag.COST) });
            }
            return guessedTags;
        }
    }
}
