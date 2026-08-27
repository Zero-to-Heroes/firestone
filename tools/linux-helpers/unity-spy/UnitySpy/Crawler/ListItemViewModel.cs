using System;
using System.Collections.Generic;

namespace HackF5.UnitySpy.Crawler
{
    public class ListItemViewModel
    {
        public ListItemViewModel(object item, int index)
        {
            this.Item = item;
            this.Index = index;
        }

        //public delegate ListItemViewModel Factory(object item, int index);

        public object Item { get; }

        public int Index { get; }
    }
}