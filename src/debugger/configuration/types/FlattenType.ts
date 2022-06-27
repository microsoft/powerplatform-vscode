/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

/**
 * Primitives for flattening a type.
 */
type Primitive = string | number | boolean | undefined;
/**
 * Creates key-value tuples out of a given object.
 */
type CreateKeyValueTuple<T> = {
    [TKey in keyof T]: T[TKey] extends Primitive // Map over all the keys in the type
        ? [TKey, T[TKey]] // if the current key is a primitive, return a tuple with the key and the value. E.g. CreateKeyValuePair<{a: number}> = {a: [a, number]}
        : CreateKeyValueTuple<T[TKey]>; // if the current key is an object, recurse into the object and return a tuple with the key and the value primitive values.
}[keyof T] & // Create a union
    [PropertyKey, Primitive]; // Hack for the "Type instantiation is excessively deep and possibly infinite.";

/**
 * Flattens a given object type into a `Record<string, Primitive>`.
 * @param T The object type to flatten.
 * @returns A `Record<string, Primitive>` representing the flattened object.
 * @example
 * ```ts
 * // Test is {a: string, c: number, d: string, f: string}
 * type Test = FlattenType<{
 *    a: string;
 *    b: {
 *      c: number;
 *      d: string;
 *      e: {
 *        f: string;
 *      }
 *   }
 * }>;
 * ```
 */
export type FlattenType<T> = { [KV in CreateKeyValueTuple<T> as KV[0]]: KV[1] };
