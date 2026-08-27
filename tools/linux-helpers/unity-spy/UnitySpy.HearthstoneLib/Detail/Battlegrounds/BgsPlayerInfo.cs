using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.Battlegrounds
{
    public class BgsTeamInfo
    {
        public BgsPlayerInfo Player;
        public BgsPlayerInfo Teammate;
    }

    public class BgsPlayerInfo
    {
        public BgsEntity Hero;
        public BgsEntity HeroPower;
        public List<BgsEntity> Board;
        public List<BgsEntity> BoardDebug;
        public List<BgsEntity> Hand;
        public List<BgsEntity> Secrets;
        public List<BgsEntity> Trinkets;
    }

    public class BgsEntity
    {
        public string CardId;
        public List<EntityTag> Tags;
        public List<BgsEntity> Enchantments;

        private int? _entityId;

        // Lazy index over Tags: entities are queried for tags many times per read (zone, controller, card
        // type, ... - often inside loops over all entities), and each Tags.Find was a linear scan. First
        // match wins, mirroring Find's semantics for duplicate tag names.
        private Dictionary<int, int> _tagIndex;

        private Dictionary<int, int> TagIndex
        {
            get
            {
                if (this._tagIndex == null)
                {
                    var index = new Dictionary<int, int>(this.Tags?.Count ?? 0);
                    if (this.Tags != null)
                    {
                        foreach (var tag in this.Tags)
                        {
                            if (!index.ContainsKey(tag.Name))
                            {
                                index.Add(tag.Name, tag.Value);
                            }
                        }
                    }

                    this._tagIndex = index;
                }

                return this._tagIndex;
            }
        }

        public int EntityId()
        {
            if (this._entityId != null)
            {
                return this._entityId.Value;
            }
            this._entityId = GetTag(GameTag.ENTITY_ID);
            return this._entityId.Value;
        }

        public int GetTag(GameTag tag, int defaultValue = 0)
        {
            return this.TagIndex.TryGetValue((int)tag, out var value) ? value : defaultValue;
        }

        public Zone GetZone()
        {
            return (Zone)GetTag(GameTag.ZONE, (int)Zone.INVALID);
        }

        public int GetZonePosition()
        {
            return GetTag(GameTag.ZONE_POSITION);
        }

        public int GetController()
        {
            return GetTag(GameTag.CONTROLLER);
        }

        public CardType GetCardType()
        {
            return (CardType)GetTag(GameTag.CARDTYPE, (int)CardType.INVALID);
        }

        public bool IsOnBoard()
        {
            var cardType = GetCardType();
            return cardType == CardType.MINION || cardType == CardType.BATTLEGROUND_SPELL || cardType == CardType.LOCATION;
        }

        public bool IsTrinket()
        {
            var cardType = GetCardType();
            return cardType == CardType.BATTLEGROUND_TRINKET;
        }

        public SpellSchool GetSpellSchool()
        {
            var cardType = GetCardType();
            return (SpellSchool)GetTag(GameTag.SPELL_SCHOOL);
        }

        public override bool Equals(object obj)
        {
            if (!(obj is BgsEntity))
            {
                return false;
            }
            var other = obj as BgsEntity;
            return this.CardId == other.CardId
                && this.GetTag(GameTag.ATK) == other.GetTag(GameTag.ATK)
                && this.GetTag(GameTag.HEALTH) == other.GetTag(GameTag.HEALTH)
                && this.GetTag(GameTag.DIVINE_SHIELD) == other.GetTag(GameTag.DIVINE_SHIELD)
                && this.GetTag(GameTag.TAUNT) == other.GetTag(GameTag.TAUNT);
        }

        public override int GetHashCode()
        {
            return 1;
        }
    }

    public class EntityTag
    {
        public int Name;
        public int Value;

        public override string ToString()
        {
            return $"{Name}: {Value}";
        }
    }
}
