#region

using System.Collections.Generic;
using System.Xml.Serialization;
using HearthstoneReplays.Enums;
using System.Linq;
using HearthstoneReplays.Parser.ReplayData.Entities;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.GameActions
{
    public class ShowEntity : GameData, IEntityData

    {
        [XmlAttribute("cardID")]
        public string CardId { get; set; }

        [XmlAttribute("entity")]
        public int Entity { get; set; }

        [XmlElement("Tag", typeof(Tag))]
        public List<Tag> Tags { get; set; }

        [XmlIgnore]
        public SubSpell SubSpellInEffect { get; set; }

        public int GetTag(GameTag tag, int defaultValue = -1)
        {
            var match = Tags.FirstOrDefault(t => t.Name == (int)tag);
            return match == null ? defaultValue : match.Value;
        }

        public string GetPlayerClass()
        {
            var playerClass = GetTag(GameTag.CLASS);
            return ((CardClass)playerClass).ToString();
        }

        internal int GetCardType()
        {
            return GetTag(GameTag.CARDTYPE);
        }

        internal int GetZone()
        {
            return GetTag(GameTag.ZONE);
        }

        internal int GetZonePosition()
        {
            return GetTag(GameTag.ZONE_POSITION);
        }
        internal int GetCost()
        {
            return GetTag(GameTag.COST, 0);
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

        public bool IsInPlay()
        {
            return GetTag(GameTag.ZONE) == (int)Zone.PLAY;
        }

        internal bool IsImmolateDiscard()
        {
            return GetTag(GameTag.IMMOLATING) == 1 && GetTag(GameTag.IMMOLATESTAGE) == 3;
        }

        internal bool IsMinionLike()
        {
            return GetTag(GameTag.CARDTYPE) == (int)CardType.MINION
                || GetTag(GameTag.CARDTYPE) == (int)CardType.LOCATION
                || GetTag(GameTag.CARDTYPE) == (int)CardType.BATTLEGROUND_SPELL;
        }

        public List<Tag> GetTagsCopy()
        {
            var tagsCopy = this.Tags
                .Select(tag => new Tag() { Name = tag.Name, Value = tag.Value, })
                .ToList();
            return tagsCopy;
        }
    }
}