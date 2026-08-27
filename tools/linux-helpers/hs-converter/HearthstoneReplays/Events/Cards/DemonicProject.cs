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
    internal class DemonicProject
    {
        public static string PredctCardId(GameState gameState, int entityId, int creatorEntityId, Node node, StateFacade stateFacade)
        {
            if (node.Parent?.Type != typeof(Action))
            {
                return null;
            }

            var act = node.Parent.Object as Action;
            var actionEntity = gameState.CurrentEntities.GetValueOrDefault(act.Entity);
            var createdEntity = gameState.CurrentEntities.GetValueOrDefault(entityId);

            var transformedEntity1 = gameState.CurrentEntities.GetValueOrDefault(actionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_ENT_1));
            if (transformedEntity1?.GetController() == createdEntity.GetController())
            {
                var dbfId = actionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
                return "" + dbfId;
            }

            var transformedEntity2 = gameState.CurrentEntities.GetValueOrDefault(actionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_ENT_2));
            if (transformedEntity2?.GetController() == createdEntity.GetController())
            {
                var dbfId = actionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2);
                return "" + dbfId;
            }
            return null;
        }
    }
}
