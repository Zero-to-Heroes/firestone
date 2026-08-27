#region

using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization;
using System.Xml.Serialization;
using Force.DeepCloner;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Events;
using HearthstoneReplays.Events.Parsers.Utils;
using HearthstoneReplays.Parser.ReplayData.GameActions;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Entities
{
    [XmlRoot("FullEntity")]
    public class FullEntity : BaseEntity, IEntityData
    {
        public static IList<string> MANUAL_DREDGE = new List<string>()
        {
            CardIds.FromTheDepths,
            CardIds.Waveshaping_TIME_701,
        };

        [XmlAttribute("cardID")]
        public string CardId { get; set; }

        [XmlIgnore]
        public bool Hidden { get; set; }
        //[XmlIgnore]
        //public string ActualCardId { get; set; }
        //[XmlIgnore]
        //public int? ActualCreator { get; set; }

        [XmlIgnore]
        public int Entity
        {
            get
            {
                return Id;
            }

            set
            {
                Id = value;
            }
        }

        [XmlIgnore]
        public List<int> KnownEntityIds = new List<int>();

        [XmlIgnore]
        public List<int> PlayedWhileInHand = new List<int>();

        [XmlIgnore]
        public List<string> CardIdsToCreate = new List<string>();
        [XmlIgnore]
        public List<object> DynamicInfo = new List<object>();
        [XmlIgnore]
        public int CreatedIndex = 0;

        [XmlIgnore]
        public SubSpell SubSpellInEffect { get; set; }

        public bool ShouldSerializeCardId()
        {
            return !string.IsNullOrEmpty(CardId);
        }

        //private Newtonsoft.Json.JsonSerializerSettings _serializationSettings = new Newtonsoft.Json.JsonSerializerSettings
        //{
        //    ObjectCreationHandling = Newtonsoft.Json.ObjectCreationHandling.Replace,
        //    DefaultValueHandling = Newtonsoft.Json.DefaultValueHandling.Include,
        //    ContractResolver = new IncludeJsonIgnoreContractResolver() // Use the custom resolver
        //};

        internal FullEntity Clone()
        {
            try
            {
                return this.DeepClone();
            }
            catch (Exception e)
            {
                Logger.Log("Could not DeepClone", e.ToString());
                //string serializedObject = Newtonsoft.Json.JsonConvert.SerializeObject(this, _serializationSettings);
                //return Newtonsoft.Json.JsonConvert.DeserializeObject<FullEntity>(serializedObject, _serializationSettings);
                DataContractSerializer dcSer = new DataContractSerializer(this.GetType());
                MemoryStream memoryStream = new MemoryStream();

                dcSer.WriteObject(memoryStream, this);
                memoryStream.Position = 0;

                FullEntity newObject = (FullEntity)dcSer.ReadObject(memoryStream);
                return newObject;
            }
        }

        public string GetPlayerClass()
        {
            var playerClass = GetTag(GameTag.CLASS);
            return ((CardClass)playerClass).ToString();
        }

        internal int GetController()
        {
            return GetTag(GameTag.CONTROLLER);
        }

        internal bool InHand()
        {
            return GetZone() == (int)Zone.HAND;
        }
        internal bool InGraveyard()
        {
            return GetZone() == (int)Zone.GRAVEYARD;
        }

        internal int GetZone()
        {
            return GetTag(GameTag.ZONE);
        }

        internal int GetZone(TagChange tagChange)
        {
            return tagChange.Name == (int)GameTag.ZONE && tagChange.Entity == this.Entity
                ? tagChange.Value
                : GetTag(GameTag.ZONE);
        }

        internal bool IsMinionLike()
        {
            return GetTag(GameTag.CARDTYPE) == (int)CardType.MINION
                || GetTag(GameTag.CARDTYPE) == (int)CardType.LOCATION
                || GetTag(GameTag.CARDTYPE) == (int)CardType.BATTLEGROUND_SPELL;
        }

        internal bool IsLocation()
        {
            return GetTag(GameTag.CARDTYPE) == (int)CardType.LOCATION;
        }

        internal int GetZonePosition()
        {
            if (GetTag(GameTag.FAKE_ZONE_POSITION) >= 0)
            {
                return GetTag(GameTag.FAKE_ZONE_POSITION);
            }
            return GetTag(GameTag.ZONE_POSITION);
        }

        internal bool IsImmolateDiscard()
        {
            return GetTag(GameTag.IMMOLATING) == 1 && GetTag(GameTag.IMMOLATESTAGE) == 3;
        }

        internal int GetCardType()
        {
            return GetTag(GameTag.CARDTYPE);
        }

        internal bool IsHero()
        {
            return GetCardType() == (int)CardType.HERO;
        }

        internal bool IsInPlay()
        {
            return GetZone() == (int)Zone.PLAY;
        }

        internal bool IsInPlay(TagChange tagChange)
        {
            if (tagChange.Name != (int)GameTag.ZONE || tagChange.Entity != this.Entity)
            {
                return IsInPlay();
            }
            return tagChange.Value == (int)Zone.PLAY;
        }

        internal bool IsInGraveyard()
        {
            return GetZone() == (int)Zone.GRAVEYARD;
        }

        internal bool HasDredge()
        {
            return GetTag(GameTag.DREDGE) == 1 || IsManualDredge();
        }

        private bool IsManualDredge()
        {
            return MANUAL_DREDGE.Contains(this.CardId);
        }

        internal bool IsBaconGhost()
        {
            return GetTag(GameTag.BACON_IS_KEL_THUZAD) == 1 || BgsUtils.IsBaconGhost(this.CardId);
        }

        internal bool IsBaconBartender()
        {
            return GetTag(GameTag.BACON_BOB_SKIN) == 1 || BgsUtils.IsBaconBartender(this.CardId);
        }

        internal bool IsBaconEnchantment()
        {
            return BgsUtils.IsBaconEnchantment(this.CardId);
        }

        internal bool IsMinion()
        {
            return GetTag(GameTag.CARDTYPE) == (int)CardType.MINION;
        }

        internal bool IsSpell()
        {
            return GetTag(GameTag.CARDTYPE) == (int)CardType.SPELL;
        }

        internal object GetLeaderboardPosition(GameType gameType)
        {
            return gameType == GameType.GT_BATTLEGROUNDS_DUO
                || gameType == GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY
                || gameType == GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI
                || gameType == GameType.GT_BATTLEGROUNDS_DUO_VS_AI
                ? GetTag(GameTag.PLAYER_LEADERBOARD_PLACE) * 2 - GetTag(GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT, 0)
                : GetTag(GameTag.PLAYER_LEADERBOARD_PLACE);
        }

        internal bool IsStarshipPiece()
        {
            return GetTag(GameTag.STARSHIP_PIECE) == 1;
        }

        internal static FullEntity FromShowEntity(ShowEntity showEntity)
        {
            return new FullEntity()
            {
                CardId = showEntity.CardId,
                Entity = showEntity.Entity,
                Tags = showEntity.Tags,
            };
        }
    }
}