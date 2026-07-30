#region

using System;
using System.Collections.Generic;

#endregion

namespace HearthstoneReplays.Parser
{
	public class SubSpell
	{
		public DateTime Timestamp { get; set; }
		public string Prefab { get; set; }
		public int Source { get; set; }
		public IList<int> Targets { get; set; }

		public SubSpell Spell { 
			get {
				return _subSpell;
			}
			set
			{
				this._subSpell = value;
				if (this.Spell != null) { 
					this._subSpell.Parent = this;
				}
			}
		}
		private SubSpell _subSpell;

		public SubSpell Parent { get; private set; }

        public SubSpell GetActiveSubSpell()
        {
			var current = this;
			while (current?.Spell != null)
			{
				current = current.Spell;
			}
			return current;
        }
    }
}