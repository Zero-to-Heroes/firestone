namespace HackF5.UnitySpy.Detail
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using JetBrains.Annotations;

    /// <summary>
    /// Represents an unmanaged _MonoClassField instance in a Mono process. This object describes a field in a
    /// managed class or struct. The .NET equivalent is <see cref="System.Reflection.FieldInfo"/>.
    /// See: _MonoImage in https://github.com/Unity-Technologies/mono/blob/unity-master/mono/metadata/class-internals.h.
    /// </summary>
    [PublicAPI]
    [DebuggerDisplay(
        "Field: {" + nameof(FieldDefinition.Offset) + "} - {" + nameof(FieldDefinition.Name) + "}")]
    public class FieldDefinition : MemoryObject, IFieldDefinition
    {
        private readonly List<TypeInfo> genericTypeArguments;

        public FieldDefinition([NotNull] TypeDefinition declaringType, IntPtr address)
            : base((declaringType ?? throw new ArgumentNullException(nameof(declaringType))).Image, address)
        {
            this.DeclaringType = declaringType;

            // MonoType        *type;
            this.TypeInfo = new TypeInfo(declaringType.Image, this.ReadPtr(0x0));

            // MonoType        *name;
            this.Name = this.ReadString(this.Process.SizeOfPtr);

            // wee need to skip MonoClass *parent field so we add
            // 3 pointer sizes (*type, *name, *parent) to the base address
            this.Offset = this.ReadInt32(this.Process.SizeOfPtr * 3);

            // Get the generic type arguments
            if (this.TypeInfo.TypeCode == TypeCode.GENERICINST)
            {
                var monoGenericClassAddress = this.TypeInfo.Data;
                var monoClassAddress = this.Process.ReadPtr(monoGenericClassAddress);
                TypeDefinition monoClass = this.Image.GetTypeDefinition(monoClassAddress);

                var monoGenericContainerPtr = monoClassAddress + this.Process.MonoLibraryOffsets.TypeDefinitionGenericContainer;
                var monoGenericContainerAddress = this.Process.ReadPtr(monoGenericContainerPtr);

                var monoGenericContextPtr = monoGenericClassAddress + this.Process.SizeOfPtr;
                var monoGenericInsPtr = this.Process.ReadPtr(monoGenericContextPtr);

                // var argumentCount = this.Process.ReadInt32(monoGenericInsPtr + 0x4);
                var argumentCount = this.Process.ReadInt32(monoGenericContainerAddress + (4 * this.Process.SizeOfPtr));
                var typeArgVPtr = monoGenericInsPtr + 0x8;
                this.genericTypeArguments = new List<TypeInfo>(argumentCount);
                for (int i = 0; i < argumentCount; i++)
                {
                    var genericTypeArgumentPtr = this.Process.ReadPtr(typeArgVPtr + (i * this.Process.SizeOfPtr));
                    this.genericTypeArguments.Add(new TypeInfo(this.Image, genericTypeArgumentPtr));
                }
            }
            else
            {
                this.genericTypeArguments = null;
            }
        }

        ITypeDefinition IFieldDefinition.DeclaringType => this.DeclaringType;

        public string Name { get; }

        ITypeInfo IFieldDefinition.TypeInfo => this.TypeInfo;

        public TypeDefinition DeclaringType { get; }

        public int Offset { get; set; }

        public TypeInfo TypeInfo { get; }

        public TValue GetValue<TValue>(IntPtr address)
        {
            return this.GetValue<TValue>(this.genericTypeArguments, address);
        }

        public TValue GetValue<TValue>(List<TypeInfo> genericTypeArguments, IntPtr address)
        {
            var offset = this.GetOffset(genericTypeArguments);

            if (this.genericTypeArguments != null)
            {
                return (TValue)this.TypeInfo.GetValue(this.genericTypeArguments, address + offset);
            }
            else
            {
                return (TValue)this.TypeInfo.GetValue(genericTypeArguments, address + offset);
            }
        }

        /// <summary>
        /// Reads a single element of the array stored in this (array-typed) field, without materializing the
        /// whole array. See <see cref="ProcessFacade.ReadManagedArrayElement"/>.
        /// </summary>
        public TValue GetArrayValue<TValue>(List<TypeInfo> genericTypeArguments, IntPtr address, int index)
        {
            var offset = this.GetOffset(genericTypeArguments);
            var args = this.genericTypeArguments ?? genericTypeArguments;
            return (TValue)this.Process.ReadManagedArrayElement(this.TypeInfo, args, address + offset, index);
        }

        private int GetOffset(List<TypeInfo> genericTypeArguments)
        {
            if (this.DeclaringType.IsValueType && !this.TypeInfo.IsStatic)
            {
                // Mono stores field offsets against the OPEN generic definition, where generic-parameter (VAR)
                // fields occupy a full pointer-sized slot. In the actual instantiation those fields are packed to
                // their real size/alignment, so any field laid out after a sub-pointer value-type generic argument
                // (e.g. the `value` of a Dictionary<int, int>+Entry, which follows the `int` key) ends up at the
                // wrong offset. Recompute the offset from the real inflated layout when the struct contains generic
                // fields; otherwise fall back to the simple header-relative offset.
                var structArgs = this.genericTypeArguments ?? genericTypeArguments;
                if (this.TryGetInflatedValueTypeOffset(structArgs, out var inflatedOffset))
                {
                    return inflatedOffset;
                }

                return this.Offset - (this.Process.SizeOfPtr * 2);
            }

            return this.Offset;
        }

        /// <summary>
        /// Recomputes this field's data offset (relative to the start of the value-type instance) for the real
        /// instantiated layout, rather than the open generic definition's layout. Returns <c>false</c> (so the
        /// caller falls back to the legacy offset) when the declaring struct has no generic fields or when any
        /// field's inflated size cannot be determined safely.
        /// </summary>
        private bool TryGetInflatedValueTypeOffset(List<TypeInfo> structGenericArguments, out int dataOffset)
        {
            dataOffset = 0;

            var fields = this.DeclaringType.Fields
                .Where(f => !(f.TypeInfo?.IsStatic ?? true))
                .OrderBy(f => f.Offset)
                .ToList();

            // Only the instantiation-dependent layout (a struct with generic VAR fields) needs correcting.
            if (!fields.Any(f => f.TypeInfo?.TypeCode == TypeCode.VAR))
            {
                return false;
            }

            var cur = 0;
            var found = false;
            foreach (var field in fields)
            {
                var size = this.GetInflatedFieldSize(field, structGenericArguments);
                if (size <= 0)
                {
                    // Unknown / inline value-type field: don't risk a wrong layout, use the legacy offset.
                    return false;
                }

                // Natural alignment for primitives and pointers equals their size (all powers of two <= 8).
                cur = AlignUp(cur, size);
                if (ReferenceEquals(field, this))
                {
                    dataOffset = cur;
                    found = true;
                }

                cur += size;
            }

            return found;
        }

        /// <summary>
        /// Returns the size in bytes of a field within an instantiated value type, resolving generic parameter
        /// (VAR) fields against the supplied type arguments. Returns -1 when the size cannot be determined safely
        /// (e.g. inline value-type or unresolved generic fields), signalling the caller to fall back.
        /// </summary>
        private int GetInflatedFieldSize(FieldDefinition field, List<TypeInfo> structGenericArguments)
        {
            var typeInfo = field.TypeInfo;
            if (typeInfo == null)
            {
                return -1;
            }

            var typeCode = typeInfo.TypeCode;
            if (typeCode == TypeCode.VAR)
            {
                if (structGenericArguments == null)
                {
                    return -1;
                }

                var argumentIndex = this.Process.ReadInt32(typeInfo.Data + this.Process.SizeOfPtr);
                if (argumentIndex < 0 || argumentIndex >= structGenericArguments.Count)
                {
                    return -1;
                }

                typeCode = structGenericArguments[argumentIndex].TypeCode;
                if (typeCode == TypeCode.VAR || typeCode == TypeCode.MVAR)
                {
                    return -1;
                }
            }

            switch (typeCode)
            {
                case TypeCode.BOOLEAN:
                case TypeCode.I1:
                case TypeCode.U1:
                    return 1;

                case TypeCode.CHAR:
                case TypeCode.I2:
                case TypeCode.U2:
                    return 2;

                case TypeCode.I4:
                case TypeCode.U4:
                case TypeCode.R4:
                    return 4;

                case TypeCode.I8:
                case TypeCode.U8:
                case TypeCode.R8:
                    return 8;

                case TypeCode.STRING:
                case TypeCode.SZARRAY:
                case TypeCode.CLASS:
                case TypeCode.OBJECT:
                case TypeCode.ARRAY:
                case TypeCode.PTR:
                case TypeCode.FNPTR:
                case TypeCode.BYREF:
                    return this.Process.SizeOfPtr;

                default:
                    // VALUETYPE / GENERICINST (inline struct), ENUM, native int, etc.: size not safely known here.
                    return -1;
            }
        }

        private static int AlignUp(int offset, int alignment)
        {
            if (alignment <= 1)
            {
                return offset;
            }

            return (offset + (alignment - 1)) & ~(alignment - 1);
        }
    }
}