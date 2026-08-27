using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData.Entities;
using static HearthstoneReplays.Events.CardIds;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events
{
    internal class Obfuscator
    {
        internal static bool shouldObfuscateCardDraw(FullEntity entity, GameState gameState, Node node, bool isPlayer, bool revealed = false)
        {
            var updatedEntity = gameState.CurrentEntities.GetValueOrDefault(entity.Id);
            if (node?.Parent?.Type == typeof(Action))
            {
                var action = node.Parent.Object as Action;
                var actionEntityId = action.Entity;
                var actionEntity = gameState.CurrentEntities.GetValueOrDefault(actionEntityId);
                if (action.Type == (int)BlockType.POWER)
                {
                    var actionCardId = actionEntity?.CardId;
                    switch (actionCardId)
                    {
                        case SirFinleySeaGuide:
                            return true;
                    }
                }
            }

            // Avoid info leaks for cards that have been traded into the deck. This is necessary because they
            // are logged in clear in the Power.log
            if (!isPlayer && entity.AllPreviousTags.Find(t => t.Name == (int)GameTag.IS_USING_TRADE_OPTION && t.Value == 1) != null) {
                return true;
            }
            // What can happen is the card is revealed when drawn (eg Temporal Anomaly), then immediately hidden again
            if (!isPlayer && entity.Hidden && !revealed && (entity.GetTag(GameTag.CASTS_WHEN_DRAWN) != 1 && entity.GetTag(GameTag.SUMMONED_WHEN_DRAWN) != 1))
            {
                return true;
            }

            return false;
        }
    }
}
