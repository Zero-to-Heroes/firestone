namespace HackF5.UnitySpy.Detail
{
    using System;

    /// <summary>
    /// The base type for all objects accessed in a process' memory. Every object has an address in memory
    /// and all information about that object is accessed via an offset from that address.
    /// </summary>
    public abstract class MemoryObject : IMemoryObject
    {
        protected MemoryObject(AssemblyImage image, IntPtr address)
        {
            this.Image = image;
            this.Address = address;
        }

        IAssemblyImage IMemoryObject.Image => this.Image;

        public virtual AssemblyImage Image { get; }

        public virtual ProcessFacade Process => this.Image.Process;

        protected IntPtr Address { get; }

        protected int ReadInt32(int offset) => this.Process.ReadInt32(this.Address + offset);

        protected IntPtr ReadPtr(int offset) => this.Process.ReadPtr(this.Address + offset);

        protected string ReadString(int offset) => this.Process.ReadAsciiStringPtr(this.Address + offset);

        protected uint ReadUInt32(int offset) => this.Process.ReadUInt32(this.Address + offset);

        protected byte ReadByte(int offset) => this.Process.ReadByte(this.Address + offset);
    }
}