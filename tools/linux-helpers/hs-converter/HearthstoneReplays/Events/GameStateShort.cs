using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HearthstoneReplays.Events
{
    public class GameStateShort
    {
        public int ActivePlayerId { get; set; }
        public GameStateShortPlayer Player { get; set; }
        public GameStateShortPlayer Opponent { get; set; }
    }

    public class GameStateShortPlayer
    {
        public GameStateShortSmallEntity PlayerEntity { get; set; }
        public GameStateShortSmallEntity Hero { get; set; }
        public GameStateShortSmallEntity Weapon { get; set; }
        public List<GameStateShortSmallEntity> Hand { get; set; }
        public List<GameStateShortSmallEntity> Board { get; set; }
        public List<GameStateShortSmallEntity> Secrets { get; set; }
        public List<GameStateShortSmallEntity> Deck { get; set; }
        public List<GameStateShortSmallEntity> AllEntities { get; set; }
        public List<GameStateShortSmallEntity> LettuceAbilities { get; set; }
    }

    public class GameStateShortSmallEntity
    {
        public int entityId { get; set; }
        public string cardId { get; set; }
        public int attack { get; set; }
        public int health { get; set; }
        public int durability { get; set; }
        public List<Tag> tags { get; set; }
        public List<GameStateShortEnchantment> enchantments { get; set; }

        public int GetTag(GameTag tag, int defaultValue = -1)
        {
            var match = tags.FirstOrDefault(t => t.Name == (int)tag);
            return match == null ? defaultValue : match.Value;
        }
        public int GetEffectiveController()
        {
            var lettuceControllerId = GetTag(GameTag.LETTUCE_CONTROLLER);
            if (lettuceControllerId != -1)
            {
                return lettuceControllerId;
            }
            return GetTag(GameTag.CONTROLLER);
        }
        internal bool IsMinionLike()
        {
            return GetTag(GameTag.CARDTYPE) == (int)CardType.MINION
                || GetTag(GameTag.CARDTYPE) == (int)CardType.LOCATION
                || GetTag(GameTag.CARDTYPE) == (int)CardType.BATTLEGROUND_SPELL;
        }
    }

    public class GameStateShortEnchantment
    {
        public int entityId { get; set; }
        public string cardId { get; set; }
        public List<Tag> tags { get; set; }

    }
}
