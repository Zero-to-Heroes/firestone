#region

using System;
using System.Xml.Serialization;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Parser.ReplayData.Meta.Options;

#endregion

namespace HearthstoneReplays.Parser.ReplayData
{
    [XmlInclude(typeof(BaseEntity))]
    [XmlInclude(typeof(GameAction))]
    [XmlInclude(typeof(Choices))]
    [XmlInclude(typeof(SendChoices))]
    [XmlInclude(typeof(Options))]
    [XmlInclude(typeof(SendOption))]
    [XmlInclude(typeof(HideEntity))]
    [XmlInclude(typeof(ShowEntity))]
    [XmlInclude(typeof(MetaData))]
    [XmlInclude(typeof(ChosenEntities))]
    public abstract class GameData
    {

        [XmlIgnore]
        public DateTime TimeStamp { get; set; }

        [XmlIgnore]
        public GameData InternalParent { get; set; }

        [XmlAttribute("ts")]
        public string TsForXml
        {
            get
            {
                var hours = TimeStamp.Hour;
                if (hours < ReplayParser.start.Hour)
                {
                    hours += 24;
                }
                var timestampString = this.TimeStamp.ToString("HH:mm:ss.ffffff");
                var split = timestampString.Split(':');
                return ("" + hours).PadLeft(2, '0') + ":" + split[1] + ":" + split[2];
            }
            set {
                try
                {
                    this.TimeStamp = DateTime.Parse(value);
                }
                catch (Exception e)
                {
                    var split = value.Split(':');
                    var newValue = ("" + (int.Parse(split[0]) - 24)).PadLeft(2, '0') + ":" + split[1] + ":" + split[2];
                    this.TimeStamp = DateTime.Parse(newValue);
                }
            }
        }
    }
}