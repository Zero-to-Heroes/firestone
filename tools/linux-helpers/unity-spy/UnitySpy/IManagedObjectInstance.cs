namespace HackF5.UnitySpy
{
    using JetBrains.Annotations;
    using System;

    /// <summary>
    /// Represents an object instance in managed memory.
    /// </summary>
    [PublicAPI]
    public interface IManagedObjectInstance : IMemoryObject
    {
        /// <summary>
        /// Gets the <see cref="ITypeDefinition"/> that describes the type of this instance.
        /// </summary>
        ITypeDefinition TypeDefinition { get; }

        dynamic this[string fieldName] { get; }

        dynamic this[string fieldName, string typeFullName, bool exceptionOnMissingField = false] { get; }

        /// <summary>
        /// Gets the value of the field in the instance with the given <paramref name="fieldName"/>.
        /// </summary>
        /// <typeparam name="TValue">
        /// The type of the value to get. If unsure of the type you can always use <see cref="object"/>.
        /// </typeparam>
        /// <param name="fieldName">
        /// The name of the field.
        /// </param>
        /// <returns>
        /// The value of the field in the instance with the given <paramref name="fieldName"/>.
        /// </returns>
        TValue GetValue<TValue>(string fieldName, bool exceptionOnMissingField = false);

        /// <summary>
        /// Gets the value of the field in the instance with the given <paramref name="fieldName"/> that is declared
        /// in type with given <paramref name="typeFullName"/>.
        /// </summary>
        /// <typeparam name="TValue">
        /// The type of the value to get. If unsure of the type you can always use <see cref="object"/>.
        /// </typeparam>
        /// <param name="fieldName">
        /// The name of the field.
        /// </param>
        /// <param name="typeFullName">
        /// The name of the type in which the field is declared. In most cases this can be left <c>null</c>, however
        /// to access a private field in a subclass which has the same name as a field declared higher up in the
        /// hierarchy it is necessary to provide the full name of the declaring type.
        /// </param>
        /// <returns>
        /// The value of the field in the instance with the given <paramref name="fieldName"/>.
        /// </returns>
        TValue GetValue<TValue>(string fieldName, string typeFullName, bool exceptionOnMissingField = false);

        /// <summary>
        /// Reads a single element of the array stored in the field with the given <paramref name="fieldName"/>,
        /// without materializing the whole array. The index is bounds-checked against the live array length;
        /// out-of-range indices (e.g. after the array was reallocated smaller) return <c>default</c>.
        /// </summary>
        /// <typeparam name="TValue">
        /// The type of the element to get. If unsure of the type you can always use <see cref="object"/>.
        /// </typeparam>
        /// <param name="fieldName">
        /// The name of the array-typed field.
        /// </param>
        /// <param name="index">
        /// The zero-based element index.
        /// </param>
        TValue GetArrayValue<TValue>(string fieldName, int index);
    }
}