
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Property
 * 
 */
export type Property = $Result.DefaultSelection<Prisma.$PropertyPayload>
/**
 * Model Media
 * 
 */
export type Media = $Result.DefaultSelection<Prisma.$MediaPayload>
/**
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>
/**
 * Model IcalFeed
 * 
 */
export type IcalFeed = $Result.DefaultSelection<Prisma.$IcalFeedPayload>
/**
 * Model Booking
 * 
 */
export type Booking = $Result.DefaultSelection<Prisma.$BookingPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  ADMIN: 'ADMIN',
  VIEWER: 'VIEWER'
};

export type Role = (typeof Role)[keyof typeof Role]


export const MediaType: {
  PHOTO: 'PHOTO',
  VIDEO: 'VIDEO'
};

export type MediaType = (typeof MediaType)[keyof typeof MediaType]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type MediaType = $Enums.MediaType

export const MediaType: typeof $Enums.MediaType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.property`: Exposes CRUD operations for the **Property** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Properties
    * const properties = await prisma.property.findMany()
    * ```
    */
  get property(): Prisma.PropertyDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.media`: Exposes CRUD operations for the **Media** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Media
    * const media = await prisma.media.findMany()
    * ```
    */
  get media(): Prisma.MediaDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.message`: Exposes CRUD operations for the **Message** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Messages
    * const messages = await prisma.message.findMany()
    * ```
    */
  get message(): Prisma.MessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.icalFeed`: Exposes CRUD operations for the **IcalFeed** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more IcalFeeds
    * const icalFeeds = await prisma.icalFeed.findMany()
    * ```
    */
  get icalFeed(): Prisma.IcalFeedDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.booking`: Exposes CRUD operations for the **Booking** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Bookings
    * const bookings = await prisma.booking.findMany()
    * ```
    */
  get booking(): Prisma.BookingDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Property: 'Property',
    Media: 'Media',
    Message: 'Message',
    IcalFeed: 'IcalFeed',
    Booking: 'Booking'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "property" | "media" | "message" | "icalFeed" | "booking"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Property: {
        payload: Prisma.$PropertyPayload<ExtArgs>
        fields: Prisma.PropertyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PropertyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PropertyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload>
          }
          findFirst: {
            args: Prisma.PropertyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PropertyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload>
          }
          findMany: {
            args: Prisma.PropertyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload>[]
          }
          create: {
            args: Prisma.PropertyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload>
          }
          createMany: {
            args: Prisma.PropertyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PropertyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload>[]
          }
          delete: {
            args: Prisma.PropertyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload>
          }
          update: {
            args: Prisma.PropertyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload>
          }
          deleteMany: {
            args: Prisma.PropertyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PropertyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PropertyUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload>[]
          }
          upsert: {
            args: Prisma.PropertyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PropertyPayload>
          }
          aggregate: {
            args: Prisma.PropertyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProperty>
          }
          groupBy: {
            args: Prisma.PropertyGroupByArgs<ExtArgs>
            result: $Utils.Optional<PropertyGroupByOutputType>[]
          }
          count: {
            args: Prisma.PropertyCountArgs<ExtArgs>
            result: $Utils.Optional<PropertyCountAggregateOutputType> | number
          }
        }
      }
      Media: {
        payload: Prisma.$MediaPayload<ExtArgs>
        fields: Prisma.MediaFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MediaFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MediaFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload>
          }
          findFirst: {
            args: Prisma.MediaFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MediaFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload>
          }
          findMany: {
            args: Prisma.MediaFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload>[]
          }
          create: {
            args: Prisma.MediaCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload>
          }
          createMany: {
            args: Prisma.MediaCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MediaCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload>[]
          }
          delete: {
            args: Prisma.MediaDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload>
          }
          update: {
            args: Prisma.MediaUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload>
          }
          deleteMany: {
            args: Prisma.MediaDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MediaUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MediaUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload>[]
          }
          upsert: {
            args: Prisma.MediaUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaPayload>
          }
          aggregate: {
            args: Prisma.MediaAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMedia>
          }
          groupBy: {
            args: Prisma.MediaGroupByArgs<ExtArgs>
            result: $Utils.Optional<MediaGroupByOutputType>[]
          }
          count: {
            args: Prisma.MediaCountArgs<ExtArgs>
            result: $Utils.Optional<MediaCountAggregateOutputType> | number
          }
        }
      }
      Message: {
        payload: Prisma.$MessagePayload<ExtArgs>
        fields: Prisma.MessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findFirst: {
            args: Prisma.MessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findMany: {
            args: Prisma.MessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          create: {
            args: Prisma.MessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          createMany: {
            args: Prisma.MessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          delete: {
            args: Prisma.MessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          update: {
            args: Prisma.MessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          deleteMany: {
            args: Prisma.MessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          upsert: {
            args: Prisma.MessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          aggregate: {
            args: Prisma.MessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessage>
          }
          groupBy: {
            args: Prisma.MessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.MessageCountArgs<ExtArgs>
            result: $Utils.Optional<MessageCountAggregateOutputType> | number
          }
        }
      }
      IcalFeed: {
        payload: Prisma.$IcalFeedPayload<ExtArgs>
        fields: Prisma.IcalFeedFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IcalFeedFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IcalFeedFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload>
          }
          findFirst: {
            args: Prisma.IcalFeedFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IcalFeedFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload>
          }
          findMany: {
            args: Prisma.IcalFeedFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload>[]
          }
          create: {
            args: Prisma.IcalFeedCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload>
          }
          createMany: {
            args: Prisma.IcalFeedCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IcalFeedCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload>[]
          }
          delete: {
            args: Prisma.IcalFeedDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload>
          }
          update: {
            args: Prisma.IcalFeedUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload>
          }
          deleteMany: {
            args: Prisma.IcalFeedDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IcalFeedUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IcalFeedUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload>[]
          }
          upsert: {
            args: Prisma.IcalFeedUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IcalFeedPayload>
          }
          aggregate: {
            args: Prisma.IcalFeedAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIcalFeed>
          }
          groupBy: {
            args: Prisma.IcalFeedGroupByArgs<ExtArgs>
            result: $Utils.Optional<IcalFeedGroupByOutputType>[]
          }
          count: {
            args: Prisma.IcalFeedCountArgs<ExtArgs>
            result: $Utils.Optional<IcalFeedCountAggregateOutputType> | number
          }
        }
      }
      Booking: {
        payload: Prisma.$BookingPayload<ExtArgs>
        fields: Prisma.BookingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BookingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BookingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          findFirst: {
            args: Prisma.BookingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BookingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          findMany: {
            args: Prisma.BookingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          create: {
            args: Prisma.BookingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          createMany: {
            args: Prisma.BookingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BookingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          delete: {
            args: Prisma.BookingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          update: {
            args: Prisma.BookingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          deleteMany: {
            args: Prisma.BookingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BookingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BookingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          upsert: {
            args: Prisma.BookingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          aggregate: {
            args: Prisma.BookingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBooking>
          }
          groupBy: {
            args: Prisma.BookingGroupByArgs<ExtArgs>
            result: $Utils.Optional<BookingGroupByOutputType>[]
          }
          count: {
            args: Prisma.BookingCountArgs<ExtArgs>
            result: $Utils.Optional<BookingCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    property?: PropertyOmit
    media?: MediaOmit
    message?: MessageOmit
    icalFeed?: IcalFeedOmit
    booking?: BookingOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    properties: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    properties?: boolean | UserCountOutputTypeCountPropertiesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPropertiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PropertyWhereInput
  }


  /**
   * Count Type PropertyCountOutputType
   */

  export type PropertyCountOutputType = {
    media: number
    messages: number
    icalFeeds: number
    bookings: number
  }

  export type PropertyCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    media?: boolean | PropertyCountOutputTypeCountMediaArgs
    messages?: boolean | PropertyCountOutputTypeCountMessagesArgs
    icalFeeds?: boolean | PropertyCountOutputTypeCountIcalFeedsArgs
    bookings?: boolean | PropertyCountOutputTypeCountBookingsArgs
  }

  // Custom InputTypes
  /**
   * PropertyCountOutputType without action
   */
  export type PropertyCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PropertyCountOutputType
     */
    select?: PropertyCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PropertyCountOutputType without action
   */
  export type PropertyCountOutputTypeCountMediaArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MediaWhereInput
  }

  /**
   * PropertyCountOutputType without action
   */
  export type PropertyCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }

  /**
   * PropertyCountOutputType without action
   */
  export type PropertyCountOutputTypeCountIcalFeedsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IcalFeedWhereInput
  }

  /**
   * PropertyCountOutputType without action
   */
  export type PropertyCountOutputTypeCountBookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
  }


  /**
   * Count Type IcalFeedCountOutputType
   */

  export type IcalFeedCountOutputType = {
    bookings: number
  }

  export type IcalFeedCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    bookings?: boolean | IcalFeedCountOutputTypeCountBookingsArgs
  }

  // Custom InputTypes
  /**
   * IcalFeedCountOutputType without action
   */
  export type IcalFeedCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeedCountOutputType
     */
    select?: IcalFeedCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * IcalFeedCountOutputType without action
   */
  export type IcalFeedCountOutputTypeCountBookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    role: $Enums.Role | null
    createdAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    role: $Enums.Role | null
    createdAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    name: number
    role: number
    createdAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
    createdAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
    createdAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
    createdAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    name: string
    role: $Enums.Role
    createdAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    createdAt?: boolean
    properties?: boolean | User$propertiesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    createdAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "name" | "role" | "createdAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    properties?: boolean | User$propertiesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      properties: Prisma.$PropertyPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      name: string
      role: $Enums.Role
      createdAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    properties<T extends User$propertiesArgs<ExtArgs> = {}>(args?: Subset<T, User$propertiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'Role'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.properties
   */
  export type User$propertiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
    where?: PropertyWhereInput
    orderBy?: PropertyOrderByWithRelationInput | PropertyOrderByWithRelationInput[]
    cursor?: PropertyWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PropertyScalarFieldEnum | PropertyScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Property
   */

  export type AggregateProperty = {
    _count: PropertyCountAggregateOutputType | null
    _avg: PropertyAvgAggregateOutputType | null
    _sum: PropertySumAggregateOutputType | null
    _min: PropertyMinAggregateOutputType | null
    _max: PropertyMaxAggregateOutputType | null
  }

  export type PropertyAvgAggregateOutputType = {
    maxGuests: number | null
    bedrooms: number | null
    bathrooms: number | null
  }

  export type PropertySumAggregateOutputType = {
    maxGuests: number | null
    bedrooms: number | null
    bathrooms: number | null
  }

  export type PropertyMinAggregateOutputType = {
    id: string | null
    slug: string | null
    titleEs: string | null
    titleEn: string | null
    titleFr: string | null
    descEs: string | null
    descEn: string | null
    descFr: string | null
    address: string | null
    city: string | null
    maxGuests: number | null
    bedrooms: number | null
    bathrooms: number | null
    published: boolean | null
    ownerId: string | null
    createdAt: Date | null
  }

  export type PropertyMaxAggregateOutputType = {
    id: string | null
    slug: string | null
    titleEs: string | null
    titleEn: string | null
    titleFr: string | null
    descEs: string | null
    descEn: string | null
    descFr: string | null
    address: string | null
    city: string | null
    maxGuests: number | null
    bedrooms: number | null
    bathrooms: number | null
    published: boolean | null
    ownerId: string | null
    createdAt: Date | null
  }

  export type PropertyCountAggregateOutputType = {
    id: number
    slug: number
    titleEs: number
    titleEn: number
    titleFr: number
    descEs: number
    descEn: number
    descFr: number
    address: number
    city: number
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published: number
    ownerId: number
    createdAt: number
    _all: number
  }


  export type PropertyAvgAggregateInputType = {
    maxGuests?: true
    bedrooms?: true
    bathrooms?: true
  }

  export type PropertySumAggregateInputType = {
    maxGuests?: true
    bedrooms?: true
    bathrooms?: true
  }

  export type PropertyMinAggregateInputType = {
    id?: true
    slug?: true
    titleEs?: true
    titleEn?: true
    titleFr?: true
    descEs?: true
    descEn?: true
    descFr?: true
    address?: true
    city?: true
    maxGuests?: true
    bedrooms?: true
    bathrooms?: true
    published?: true
    ownerId?: true
    createdAt?: true
  }

  export type PropertyMaxAggregateInputType = {
    id?: true
    slug?: true
    titleEs?: true
    titleEn?: true
    titleFr?: true
    descEs?: true
    descEn?: true
    descFr?: true
    address?: true
    city?: true
    maxGuests?: true
    bedrooms?: true
    bathrooms?: true
    published?: true
    ownerId?: true
    createdAt?: true
  }

  export type PropertyCountAggregateInputType = {
    id?: true
    slug?: true
    titleEs?: true
    titleEn?: true
    titleFr?: true
    descEs?: true
    descEn?: true
    descFr?: true
    address?: true
    city?: true
    maxGuests?: true
    bedrooms?: true
    bathrooms?: true
    published?: true
    ownerId?: true
    createdAt?: true
    _all?: true
  }

  export type PropertyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Property to aggregate.
     */
    where?: PropertyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Properties to fetch.
     */
    orderBy?: PropertyOrderByWithRelationInput | PropertyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PropertyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Properties from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Properties.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Properties
    **/
    _count?: true | PropertyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PropertyAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PropertySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PropertyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PropertyMaxAggregateInputType
  }

  export type GetPropertyAggregateType<T extends PropertyAggregateArgs> = {
        [P in keyof T & keyof AggregateProperty]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProperty[P]>
      : GetScalarType<T[P], AggregateProperty[P]>
  }




  export type PropertyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PropertyWhereInput
    orderBy?: PropertyOrderByWithAggregationInput | PropertyOrderByWithAggregationInput[]
    by: PropertyScalarFieldEnum[] | PropertyScalarFieldEnum
    having?: PropertyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PropertyCountAggregateInputType | true
    _avg?: PropertyAvgAggregateInputType
    _sum?: PropertySumAggregateInputType
    _min?: PropertyMinAggregateInputType
    _max?: PropertyMaxAggregateInputType
  }

  export type PropertyGroupByOutputType = {
    id: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published: boolean
    ownerId: string
    createdAt: Date
    _count: PropertyCountAggregateOutputType | null
    _avg: PropertyAvgAggregateOutputType | null
    _sum: PropertySumAggregateOutputType | null
    _min: PropertyMinAggregateOutputType | null
    _max: PropertyMaxAggregateOutputType | null
  }

  type GetPropertyGroupByPayload<T extends PropertyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PropertyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PropertyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PropertyGroupByOutputType[P]>
            : GetScalarType<T[P], PropertyGroupByOutputType[P]>
        }
      >
    >


  export type PropertySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    titleEs?: boolean
    titleEn?: boolean
    titleFr?: boolean
    descEs?: boolean
    descEn?: boolean
    descFr?: boolean
    address?: boolean
    city?: boolean
    maxGuests?: boolean
    bedrooms?: boolean
    bathrooms?: boolean
    published?: boolean
    ownerId?: boolean
    createdAt?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
    media?: boolean | Property$mediaArgs<ExtArgs>
    messages?: boolean | Property$messagesArgs<ExtArgs>
    icalFeeds?: boolean | Property$icalFeedsArgs<ExtArgs>
    bookings?: boolean | Property$bookingsArgs<ExtArgs>
    _count?: boolean | PropertyCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["property"]>

  export type PropertySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    titleEs?: boolean
    titleEn?: boolean
    titleFr?: boolean
    descEs?: boolean
    descEn?: boolean
    descFr?: boolean
    address?: boolean
    city?: boolean
    maxGuests?: boolean
    bedrooms?: boolean
    bathrooms?: boolean
    published?: boolean
    ownerId?: boolean
    createdAt?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["property"]>

  export type PropertySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    titleEs?: boolean
    titleEn?: boolean
    titleFr?: boolean
    descEs?: boolean
    descEn?: boolean
    descFr?: boolean
    address?: boolean
    city?: boolean
    maxGuests?: boolean
    bedrooms?: boolean
    bathrooms?: boolean
    published?: boolean
    ownerId?: boolean
    createdAt?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["property"]>

  export type PropertySelectScalar = {
    id?: boolean
    slug?: boolean
    titleEs?: boolean
    titleEn?: boolean
    titleFr?: boolean
    descEs?: boolean
    descEn?: boolean
    descFr?: boolean
    address?: boolean
    city?: boolean
    maxGuests?: boolean
    bedrooms?: boolean
    bathrooms?: boolean
    published?: boolean
    ownerId?: boolean
    createdAt?: boolean
  }

  export type PropertyOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "slug" | "titleEs" | "titleEn" | "titleFr" | "descEs" | "descEn" | "descFr" | "address" | "city" | "maxGuests" | "bedrooms" | "bathrooms" | "published" | "ownerId" | "createdAt", ExtArgs["result"]["property"]>
  export type PropertyInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
    media?: boolean | Property$mediaArgs<ExtArgs>
    messages?: boolean | Property$messagesArgs<ExtArgs>
    icalFeeds?: boolean | Property$icalFeedsArgs<ExtArgs>
    bookings?: boolean | Property$bookingsArgs<ExtArgs>
    _count?: boolean | PropertyCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PropertyIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PropertyIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $PropertyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Property"
    objects: {
      owner: Prisma.$UserPayload<ExtArgs>
      media: Prisma.$MediaPayload<ExtArgs>[]
      messages: Prisma.$MessagePayload<ExtArgs>[]
      icalFeeds: Prisma.$IcalFeedPayload<ExtArgs>[]
      bookings: Prisma.$BookingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      slug: string
      titleEs: string
      titleEn: string
      titleFr: string
      descEs: string
      descEn: string
      descFr: string
      address: string
      city: string
      maxGuests: number
      bedrooms: number
      bathrooms: number
      published: boolean
      ownerId: string
      createdAt: Date
    }, ExtArgs["result"]["property"]>
    composites: {}
  }

  type PropertyGetPayload<S extends boolean | null | undefined | PropertyDefaultArgs> = $Result.GetResult<Prisma.$PropertyPayload, S>

  type PropertyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PropertyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PropertyCountAggregateInputType | true
    }

  export interface PropertyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Property'], meta: { name: 'Property' } }
    /**
     * Find zero or one Property that matches the filter.
     * @param {PropertyFindUniqueArgs} args - Arguments to find a Property
     * @example
     * // Get one Property
     * const property = await prisma.property.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PropertyFindUniqueArgs>(args: SelectSubset<T, PropertyFindUniqueArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Property that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PropertyFindUniqueOrThrowArgs} args - Arguments to find a Property
     * @example
     * // Get one Property
     * const property = await prisma.property.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PropertyFindUniqueOrThrowArgs>(args: SelectSubset<T, PropertyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Property that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PropertyFindFirstArgs} args - Arguments to find a Property
     * @example
     * // Get one Property
     * const property = await prisma.property.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PropertyFindFirstArgs>(args?: SelectSubset<T, PropertyFindFirstArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Property that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PropertyFindFirstOrThrowArgs} args - Arguments to find a Property
     * @example
     * // Get one Property
     * const property = await prisma.property.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PropertyFindFirstOrThrowArgs>(args?: SelectSubset<T, PropertyFindFirstOrThrowArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Properties that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PropertyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Properties
     * const properties = await prisma.property.findMany()
     * 
     * // Get first 10 Properties
     * const properties = await prisma.property.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const propertyWithIdOnly = await prisma.property.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PropertyFindManyArgs>(args?: SelectSubset<T, PropertyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Property.
     * @param {PropertyCreateArgs} args - Arguments to create a Property.
     * @example
     * // Create one Property
     * const Property = await prisma.property.create({
     *   data: {
     *     // ... data to create a Property
     *   }
     * })
     * 
     */
    create<T extends PropertyCreateArgs>(args: SelectSubset<T, PropertyCreateArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Properties.
     * @param {PropertyCreateManyArgs} args - Arguments to create many Properties.
     * @example
     * // Create many Properties
     * const property = await prisma.property.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PropertyCreateManyArgs>(args?: SelectSubset<T, PropertyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Properties and returns the data saved in the database.
     * @param {PropertyCreateManyAndReturnArgs} args - Arguments to create many Properties.
     * @example
     * // Create many Properties
     * const property = await prisma.property.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Properties and only return the `id`
     * const propertyWithIdOnly = await prisma.property.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PropertyCreateManyAndReturnArgs>(args?: SelectSubset<T, PropertyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Property.
     * @param {PropertyDeleteArgs} args - Arguments to delete one Property.
     * @example
     * // Delete one Property
     * const Property = await prisma.property.delete({
     *   where: {
     *     // ... filter to delete one Property
     *   }
     * })
     * 
     */
    delete<T extends PropertyDeleteArgs>(args: SelectSubset<T, PropertyDeleteArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Property.
     * @param {PropertyUpdateArgs} args - Arguments to update one Property.
     * @example
     * // Update one Property
     * const property = await prisma.property.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PropertyUpdateArgs>(args: SelectSubset<T, PropertyUpdateArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Properties.
     * @param {PropertyDeleteManyArgs} args - Arguments to filter Properties to delete.
     * @example
     * // Delete a few Properties
     * const { count } = await prisma.property.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PropertyDeleteManyArgs>(args?: SelectSubset<T, PropertyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Properties.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PropertyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Properties
     * const property = await prisma.property.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PropertyUpdateManyArgs>(args: SelectSubset<T, PropertyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Properties and returns the data updated in the database.
     * @param {PropertyUpdateManyAndReturnArgs} args - Arguments to update many Properties.
     * @example
     * // Update many Properties
     * const property = await prisma.property.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Properties and only return the `id`
     * const propertyWithIdOnly = await prisma.property.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PropertyUpdateManyAndReturnArgs>(args: SelectSubset<T, PropertyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Property.
     * @param {PropertyUpsertArgs} args - Arguments to update or create a Property.
     * @example
     * // Update or create a Property
     * const property = await prisma.property.upsert({
     *   create: {
     *     // ... data to create a Property
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Property we want to update
     *   }
     * })
     */
    upsert<T extends PropertyUpsertArgs>(args: SelectSubset<T, PropertyUpsertArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Properties.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PropertyCountArgs} args - Arguments to filter Properties to count.
     * @example
     * // Count the number of Properties
     * const count = await prisma.property.count({
     *   where: {
     *     // ... the filter for the Properties we want to count
     *   }
     * })
    **/
    count<T extends PropertyCountArgs>(
      args?: Subset<T, PropertyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PropertyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Property.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PropertyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PropertyAggregateArgs>(args: Subset<T, PropertyAggregateArgs>): Prisma.PrismaPromise<GetPropertyAggregateType<T>>

    /**
     * Group by Property.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PropertyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PropertyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PropertyGroupByArgs['orderBy'] }
        : { orderBy?: PropertyGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PropertyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPropertyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Property model
   */
  readonly fields: PropertyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Property.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PropertyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    owner<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    media<T extends Property$mediaArgs<ExtArgs> = {}>(args?: Subset<T, Property$mediaArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    messages<T extends Property$messagesArgs<ExtArgs> = {}>(args?: Subset<T, Property$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    icalFeeds<T extends Property$icalFeedsArgs<ExtArgs> = {}>(args?: Subset<T, Property$icalFeedsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    bookings<T extends Property$bookingsArgs<ExtArgs> = {}>(args?: Subset<T, Property$bookingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Property model
   */
  interface PropertyFieldRefs {
    readonly id: FieldRef<"Property", 'String'>
    readonly slug: FieldRef<"Property", 'String'>
    readonly titleEs: FieldRef<"Property", 'String'>
    readonly titleEn: FieldRef<"Property", 'String'>
    readonly titleFr: FieldRef<"Property", 'String'>
    readonly descEs: FieldRef<"Property", 'String'>
    readonly descEn: FieldRef<"Property", 'String'>
    readonly descFr: FieldRef<"Property", 'String'>
    readonly address: FieldRef<"Property", 'String'>
    readonly city: FieldRef<"Property", 'String'>
    readonly maxGuests: FieldRef<"Property", 'Int'>
    readonly bedrooms: FieldRef<"Property", 'Int'>
    readonly bathrooms: FieldRef<"Property", 'Float'>
    readonly published: FieldRef<"Property", 'Boolean'>
    readonly ownerId: FieldRef<"Property", 'String'>
    readonly createdAt: FieldRef<"Property", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Property findUnique
   */
  export type PropertyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
    /**
     * Filter, which Property to fetch.
     */
    where: PropertyWhereUniqueInput
  }

  /**
   * Property findUniqueOrThrow
   */
  export type PropertyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
    /**
     * Filter, which Property to fetch.
     */
    where: PropertyWhereUniqueInput
  }

  /**
   * Property findFirst
   */
  export type PropertyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
    /**
     * Filter, which Property to fetch.
     */
    where?: PropertyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Properties to fetch.
     */
    orderBy?: PropertyOrderByWithRelationInput | PropertyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Properties.
     */
    cursor?: PropertyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Properties from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Properties.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Properties.
     */
    distinct?: PropertyScalarFieldEnum | PropertyScalarFieldEnum[]
  }

  /**
   * Property findFirstOrThrow
   */
  export type PropertyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
    /**
     * Filter, which Property to fetch.
     */
    where?: PropertyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Properties to fetch.
     */
    orderBy?: PropertyOrderByWithRelationInput | PropertyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Properties.
     */
    cursor?: PropertyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Properties from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Properties.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Properties.
     */
    distinct?: PropertyScalarFieldEnum | PropertyScalarFieldEnum[]
  }

  /**
   * Property findMany
   */
  export type PropertyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
    /**
     * Filter, which Properties to fetch.
     */
    where?: PropertyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Properties to fetch.
     */
    orderBy?: PropertyOrderByWithRelationInput | PropertyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Properties.
     */
    cursor?: PropertyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Properties from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Properties.
     */
    skip?: number
    distinct?: PropertyScalarFieldEnum | PropertyScalarFieldEnum[]
  }

  /**
   * Property create
   */
  export type PropertyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
    /**
     * The data needed to create a Property.
     */
    data: XOR<PropertyCreateInput, PropertyUncheckedCreateInput>
  }

  /**
   * Property createMany
   */
  export type PropertyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Properties.
     */
    data: PropertyCreateManyInput | PropertyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Property createManyAndReturn
   */
  export type PropertyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * The data used to create many Properties.
     */
    data: PropertyCreateManyInput | PropertyCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Property update
   */
  export type PropertyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
    /**
     * The data needed to update a Property.
     */
    data: XOR<PropertyUpdateInput, PropertyUncheckedUpdateInput>
    /**
     * Choose, which Property to update.
     */
    where: PropertyWhereUniqueInput
  }

  /**
   * Property updateMany
   */
  export type PropertyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Properties.
     */
    data: XOR<PropertyUpdateManyMutationInput, PropertyUncheckedUpdateManyInput>
    /**
     * Filter which Properties to update
     */
    where?: PropertyWhereInput
    /**
     * Limit how many Properties to update.
     */
    limit?: number
  }

  /**
   * Property updateManyAndReturn
   */
  export type PropertyUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * The data used to update Properties.
     */
    data: XOR<PropertyUpdateManyMutationInput, PropertyUncheckedUpdateManyInput>
    /**
     * Filter which Properties to update
     */
    where?: PropertyWhereInput
    /**
     * Limit how many Properties to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Property upsert
   */
  export type PropertyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
    /**
     * The filter to search for the Property to update in case it exists.
     */
    where: PropertyWhereUniqueInput
    /**
     * In case the Property found by the `where` argument doesn't exist, create a new Property with this data.
     */
    create: XOR<PropertyCreateInput, PropertyUncheckedCreateInput>
    /**
     * In case the Property was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PropertyUpdateInput, PropertyUncheckedUpdateInput>
  }

  /**
   * Property delete
   */
  export type PropertyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
    /**
     * Filter which Property to delete.
     */
    where: PropertyWhereUniqueInput
  }

  /**
   * Property deleteMany
   */
  export type PropertyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Properties to delete
     */
    where?: PropertyWhereInput
    /**
     * Limit how many Properties to delete.
     */
    limit?: number
  }

  /**
   * Property.media
   */
  export type Property$mediaArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
    where?: MediaWhereInput
    orderBy?: MediaOrderByWithRelationInput | MediaOrderByWithRelationInput[]
    cursor?: MediaWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MediaScalarFieldEnum | MediaScalarFieldEnum[]
  }

  /**
   * Property.messages
   */
  export type Property$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Property.icalFeeds
   */
  export type Property$icalFeedsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    where?: IcalFeedWhereInput
    orderBy?: IcalFeedOrderByWithRelationInput | IcalFeedOrderByWithRelationInput[]
    cursor?: IcalFeedWhereUniqueInput
    take?: number
    skip?: number
    distinct?: IcalFeedScalarFieldEnum | IcalFeedScalarFieldEnum[]
  }

  /**
   * Property.bookings
   */
  export type Property$bookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    cursor?: BookingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Property without action
   */
  export type PropertyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Property
     */
    select?: PropertySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Property
     */
    omit?: PropertyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PropertyInclude<ExtArgs> | null
  }


  /**
   * Model Media
   */

  export type AggregateMedia = {
    _count: MediaCountAggregateOutputType | null
    _avg: MediaAvgAggregateOutputType | null
    _sum: MediaSumAggregateOutputType | null
    _min: MediaMinAggregateOutputType | null
    _max: MediaMaxAggregateOutputType | null
  }

  export type MediaAvgAggregateOutputType = {
    order: number | null
  }

  export type MediaSumAggregateOutputType = {
    order: number | null
  }

  export type MediaMinAggregateOutputType = {
    id: string | null
    propertyId: string | null
    url: string | null
    type: $Enums.MediaType | null
    order: number | null
  }

  export type MediaMaxAggregateOutputType = {
    id: string | null
    propertyId: string | null
    url: string | null
    type: $Enums.MediaType | null
    order: number | null
  }

  export type MediaCountAggregateOutputType = {
    id: number
    propertyId: number
    url: number
    type: number
    order: number
    _all: number
  }


  export type MediaAvgAggregateInputType = {
    order?: true
  }

  export type MediaSumAggregateInputType = {
    order?: true
  }

  export type MediaMinAggregateInputType = {
    id?: true
    propertyId?: true
    url?: true
    type?: true
    order?: true
  }

  export type MediaMaxAggregateInputType = {
    id?: true
    propertyId?: true
    url?: true
    type?: true
    order?: true
  }

  export type MediaCountAggregateInputType = {
    id?: true
    propertyId?: true
    url?: true
    type?: true
    order?: true
    _all?: true
  }

  export type MediaAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Media to aggregate.
     */
    where?: MediaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Media to fetch.
     */
    orderBy?: MediaOrderByWithRelationInput | MediaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MediaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Media from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Media.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Media
    **/
    _count?: true | MediaCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MediaAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MediaSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MediaMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MediaMaxAggregateInputType
  }

  export type GetMediaAggregateType<T extends MediaAggregateArgs> = {
        [P in keyof T & keyof AggregateMedia]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMedia[P]>
      : GetScalarType<T[P], AggregateMedia[P]>
  }




  export type MediaGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MediaWhereInput
    orderBy?: MediaOrderByWithAggregationInput | MediaOrderByWithAggregationInput[]
    by: MediaScalarFieldEnum[] | MediaScalarFieldEnum
    having?: MediaScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MediaCountAggregateInputType | true
    _avg?: MediaAvgAggregateInputType
    _sum?: MediaSumAggregateInputType
    _min?: MediaMinAggregateInputType
    _max?: MediaMaxAggregateInputType
  }

  export type MediaGroupByOutputType = {
    id: string
    propertyId: string
    url: string
    type: $Enums.MediaType
    order: number
    _count: MediaCountAggregateOutputType | null
    _avg: MediaAvgAggregateOutputType | null
    _sum: MediaSumAggregateOutputType | null
    _min: MediaMinAggregateOutputType | null
    _max: MediaMaxAggregateOutputType | null
  }

  type GetMediaGroupByPayload<T extends MediaGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MediaGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MediaGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MediaGroupByOutputType[P]>
            : GetScalarType<T[P], MediaGroupByOutputType[P]>
        }
      >
    >


  export type MediaSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    url?: boolean
    type?: boolean
    order?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["media"]>

  export type MediaSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    url?: boolean
    type?: boolean
    order?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["media"]>

  export type MediaSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    url?: boolean
    type?: boolean
    order?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["media"]>

  export type MediaSelectScalar = {
    id?: boolean
    propertyId?: boolean
    url?: boolean
    type?: boolean
    order?: boolean
  }

  export type MediaOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "propertyId" | "url" | "type" | "order", ExtArgs["result"]["media"]>
  export type MediaInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }
  export type MediaIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }
  export type MediaIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }

  export type $MediaPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Media"
    objects: {
      property: Prisma.$PropertyPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      propertyId: string
      url: string
      type: $Enums.MediaType
      order: number
    }, ExtArgs["result"]["media"]>
    composites: {}
  }

  type MediaGetPayload<S extends boolean | null | undefined | MediaDefaultArgs> = $Result.GetResult<Prisma.$MediaPayload, S>

  type MediaCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MediaFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MediaCountAggregateInputType | true
    }

  export interface MediaDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Media'], meta: { name: 'Media' } }
    /**
     * Find zero or one Media that matches the filter.
     * @param {MediaFindUniqueArgs} args - Arguments to find a Media
     * @example
     * // Get one Media
     * const media = await prisma.media.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MediaFindUniqueArgs>(args: SelectSubset<T, MediaFindUniqueArgs<ExtArgs>>): Prisma__MediaClient<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Media that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MediaFindUniqueOrThrowArgs} args - Arguments to find a Media
     * @example
     * // Get one Media
     * const media = await prisma.media.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MediaFindUniqueOrThrowArgs>(args: SelectSubset<T, MediaFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MediaClient<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Media that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaFindFirstArgs} args - Arguments to find a Media
     * @example
     * // Get one Media
     * const media = await prisma.media.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MediaFindFirstArgs>(args?: SelectSubset<T, MediaFindFirstArgs<ExtArgs>>): Prisma__MediaClient<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Media that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaFindFirstOrThrowArgs} args - Arguments to find a Media
     * @example
     * // Get one Media
     * const media = await prisma.media.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MediaFindFirstOrThrowArgs>(args?: SelectSubset<T, MediaFindFirstOrThrowArgs<ExtArgs>>): Prisma__MediaClient<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Media that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Media
     * const media = await prisma.media.findMany()
     * 
     * // Get first 10 Media
     * const media = await prisma.media.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const mediaWithIdOnly = await prisma.media.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MediaFindManyArgs>(args?: SelectSubset<T, MediaFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Media.
     * @param {MediaCreateArgs} args - Arguments to create a Media.
     * @example
     * // Create one Media
     * const Media = await prisma.media.create({
     *   data: {
     *     // ... data to create a Media
     *   }
     * })
     * 
     */
    create<T extends MediaCreateArgs>(args: SelectSubset<T, MediaCreateArgs<ExtArgs>>): Prisma__MediaClient<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Media.
     * @param {MediaCreateManyArgs} args - Arguments to create many Media.
     * @example
     * // Create many Media
     * const media = await prisma.media.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MediaCreateManyArgs>(args?: SelectSubset<T, MediaCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Media and returns the data saved in the database.
     * @param {MediaCreateManyAndReturnArgs} args - Arguments to create many Media.
     * @example
     * // Create many Media
     * const media = await prisma.media.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Media and only return the `id`
     * const mediaWithIdOnly = await prisma.media.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MediaCreateManyAndReturnArgs>(args?: SelectSubset<T, MediaCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Media.
     * @param {MediaDeleteArgs} args - Arguments to delete one Media.
     * @example
     * // Delete one Media
     * const Media = await prisma.media.delete({
     *   where: {
     *     // ... filter to delete one Media
     *   }
     * })
     * 
     */
    delete<T extends MediaDeleteArgs>(args: SelectSubset<T, MediaDeleteArgs<ExtArgs>>): Prisma__MediaClient<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Media.
     * @param {MediaUpdateArgs} args - Arguments to update one Media.
     * @example
     * // Update one Media
     * const media = await prisma.media.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MediaUpdateArgs>(args: SelectSubset<T, MediaUpdateArgs<ExtArgs>>): Prisma__MediaClient<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Media.
     * @param {MediaDeleteManyArgs} args - Arguments to filter Media to delete.
     * @example
     * // Delete a few Media
     * const { count } = await prisma.media.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MediaDeleteManyArgs>(args?: SelectSubset<T, MediaDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Media.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Media
     * const media = await prisma.media.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MediaUpdateManyArgs>(args: SelectSubset<T, MediaUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Media and returns the data updated in the database.
     * @param {MediaUpdateManyAndReturnArgs} args - Arguments to update many Media.
     * @example
     * // Update many Media
     * const media = await prisma.media.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Media and only return the `id`
     * const mediaWithIdOnly = await prisma.media.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MediaUpdateManyAndReturnArgs>(args: SelectSubset<T, MediaUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Media.
     * @param {MediaUpsertArgs} args - Arguments to update or create a Media.
     * @example
     * // Update or create a Media
     * const media = await prisma.media.upsert({
     *   create: {
     *     // ... data to create a Media
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Media we want to update
     *   }
     * })
     */
    upsert<T extends MediaUpsertArgs>(args: SelectSubset<T, MediaUpsertArgs<ExtArgs>>): Prisma__MediaClient<$Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Media.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaCountArgs} args - Arguments to filter Media to count.
     * @example
     * // Count the number of Media
     * const count = await prisma.media.count({
     *   where: {
     *     // ... the filter for the Media we want to count
     *   }
     * })
    **/
    count<T extends MediaCountArgs>(
      args?: Subset<T, MediaCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MediaCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Media.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MediaAggregateArgs>(args: Subset<T, MediaAggregateArgs>): Prisma.PrismaPromise<GetMediaAggregateType<T>>

    /**
     * Group by Media.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MediaGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MediaGroupByArgs['orderBy'] }
        : { orderBy?: MediaGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MediaGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMediaGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Media model
   */
  readonly fields: MediaFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Media.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MediaClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    property<T extends PropertyDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PropertyDefaultArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Media model
   */
  interface MediaFieldRefs {
    readonly id: FieldRef<"Media", 'String'>
    readonly propertyId: FieldRef<"Media", 'String'>
    readonly url: FieldRef<"Media", 'String'>
    readonly type: FieldRef<"Media", 'MediaType'>
    readonly order: FieldRef<"Media", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Media findUnique
   */
  export type MediaFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
    /**
     * Filter, which Media to fetch.
     */
    where: MediaWhereUniqueInput
  }

  /**
   * Media findUniqueOrThrow
   */
  export type MediaFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
    /**
     * Filter, which Media to fetch.
     */
    where: MediaWhereUniqueInput
  }

  /**
   * Media findFirst
   */
  export type MediaFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
    /**
     * Filter, which Media to fetch.
     */
    where?: MediaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Media to fetch.
     */
    orderBy?: MediaOrderByWithRelationInput | MediaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Media.
     */
    cursor?: MediaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Media from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Media.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Media.
     */
    distinct?: MediaScalarFieldEnum | MediaScalarFieldEnum[]
  }

  /**
   * Media findFirstOrThrow
   */
  export type MediaFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
    /**
     * Filter, which Media to fetch.
     */
    where?: MediaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Media to fetch.
     */
    orderBy?: MediaOrderByWithRelationInput | MediaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Media.
     */
    cursor?: MediaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Media from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Media.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Media.
     */
    distinct?: MediaScalarFieldEnum | MediaScalarFieldEnum[]
  }

  /**
   * Media findMany
   */
  export type MediaFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
    /**
     * Filter, which Media to fetch.
     */
    where?: MediaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Media to fetch.
     */
    orderBy?: MediaOrderByWithRelationInput | MediaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Media.
     */
    cursor?: MediaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Media from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Media.
     */
    skip?: number
    distinct?: MediaScalarFieldEnum | MediaScalarFieldEnum[]
  }

  /**
   * Media create
   */
  export type MediaCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
    /**
     * The data needed to create a Media.
     */
    data: XOR<MediaCreateInput, MediaUncheckedCreateInput>
  }

  /**
   * Media createMany
   */
  export type MediaCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Media.
     */
    data: MediaCreateManyInput | MediaCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Media createManyAndReturn
   */
  export type MediaCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * The data used to create many Media.
     */
    data: MediaCreateManyInput | MediaCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Media update
   */
  export type MediaUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
    /**
     * The data needed to update a Media.
     */
    data: XOR<MediaUpdateInput, MediaUncheckedUpdateInput>
    /**
     * Choose, which Media to update.
     */
    where: MediaWhereUniqueInput
  }

  /**
   * Media updateMany
   */
  export type MediaUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Media.
     */
    data: XOR<MediaUpdateManyMutationInput, MediaUncheckedUpdateManyInput>
    /**
     * Filter which Media to update
     */
    where?: MediaWhereInput
    /**
     * Limit how many Media to update.
     */
    limit?: number
  }

  /**
   * Media updateManyAndReturn
   */
  export type MediaUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * The data used to update Media.
     */
    data: XOR<MediaUpdateManyMutationInput, MediaUncheckedUpdateManyInput>
    /**
     * Filter which Media to update
     */
    where?: MediaWhereInput
    /**
     * Limit how many Media to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Media upsert
   */
  export type MediaUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
    /**
     * The filter to search for the Media to update in case it exists.
     */
    where: MediaWhereUniqueInput
    /**
     * In case the Media found by the `where` argument doesn't exist, create a new Media with this data.
     */
    create: XOR<MediaCreateInput, MediaUncheckedCreateInput>
    /**
     * In case the Media was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MediaUpdateInput, MediaUncheckedUpdateInput>
  }

  /**
   * Media delete
   */
  export type MediaDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
    /**
     * Filter which Media to delete.
     */
    where: MediaWhereUniqueInput
  }

  /**
   * Media deleteMany
   */
  export type MediaDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Media to delete
     */
    where?: MediaWhereInput
    /**
     * Limit how many Media to delete.
     */
    limit?: number
  }

  /**
   * Media without action
   */
  export type MediaDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Media
     */
    select?: MediaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Media
     */
    omit?: MediaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MediaInclude<ExtArgs> | null
  }


  /**
   * Model Message
   */

  export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  export type MessageMinAggregateOutputType = {
    id: string | null
    propertyId: string | null
    name: string | null
    email: string | null
    phone: string | null
    lang: string | null
    body: string | null
    startDate: Date | null
    endDate: Date | null
    read: boolean | null
    createdAt: Date | null
  }

  export type MessageMaxAggregateOutputType = {
    id: string | null
    propertyId: string | null
    name: string | null
    email: string | null
    phone: string | null
    lang: string | null
    body: string | null
    startDate: Date | null
    endDate: Date | null
    read: boolean | null
    createdAt: Date | null
  }

  export type MessageCountAggregateOutputType = {
    id: number
    propertyId: number
    name: number
    email: number
    phone: number
    lang: number
    body: number
    startDate: number
    endDate: number
    read: number
    createdAt: number
    _all: number
  }


  export type MessageMinAggregateInputType = {
    id?: true
    propertyId?: true
    name?: true
    email?: true
    phone?: true
    lang?: true
    body?: true
    startDate?: true
    endDate?: true
    read?: true
    createdAt?: true
  }

  export type MessageMaxAggregateInputType = {
    id?: true
    propertyId?: true
    name?: true
    email?: true
    phone?: true
    lang?: true
    body?: true
    startDate?: true
    endDate?: true
    read?: true
    createdAt?: true
  }

  export type MessageCountAggregateInputType = {
    id?: true
    propertyId?: true
    name?: true
    email?: true
    phone?: true
    lang?: true
    body?: true
    startDate?: true
    endDate?: true
    read?: true
    createdAt?: true
    _all?: true
  }

  export type MessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Message to aggregate.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Messages
    **/
    _count?: true | MessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageMaxAggregateInputType
  }

  export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
        [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessage[P]>
      : GetScalarType<T[P], AggregateMessage[P]>
  }




  export type MessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithAggregationInput | MessageOrderByWithAggregationInput[]
    by: MessageScalarFieldEnum[] | MessageScalarFieldEnum
    having?: MessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageCountAggregateInputType | true
    _min?: MessageMinAggregateInputType
    _max?: MessageMaxAggregateInputType
  }

  export type MessageGroupByOutputType = {
    id: string
    propertyId: string
    name: string
    email: string
    phone: string | null
    lang: string
    body: string
    startDate: Date | null
    endDate: Date | null
    read: boolean
    createdAt: Date
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageGroupByOutputType[P]>
            : GetScalarType<T[P], MessageGroupByOutputType[P]>
        }
      >
    >


  export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    lang?: boolean
    body?: boolean
    startDate?: boolean
    endDate?: boolean
    read?: boolean
    createdAt?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    lang?: boolean
    body?: boolean
    startDate?: boolean
    endDate?: boolean
    read?: boolean
    createdAt?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    lang?: boolean
    body?: boolean
    startDate?: boolean
    endDate?: boolean
    read?: boolean
    createdAt?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectScalar = {
    id?: boolean
    propertyId?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    lang?: boolean
    body?: boolean
    startDate?: boolean
    endDate?: boolean
    read?: boolean
    createdAt?: boolean
  }

  export type MessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "propertyId" | "name" | "email" | "phone" | "lang" | "body" | "startDate" | "endDate" | "read" | "createdAt", ExtArgs["result"]["message"]>
  export type MessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }
  export type MessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }
  export type MessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }

  export type $MessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Message"
    objects: {
      property: Prisma.$PropertyPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      propertyId: string
      name: string
      email: string
      phone: string | null
      lang: string
      body: string
      startDate: Date | null
      endDate: Date | null
      read: boolean
      createdAt: Date
    }, ExtArgs["result"]["message"]>
    composites: {}
  }

  type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>

  type MessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MessageCountAggregateInputType | true
    }

  export interface MessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Message'], meta: { name: 'Message' } }
    /**
     * Find zero or one Message that matches the filter.
     * @param {MessageFindUniqueArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageFindUniqueArgs>(args: SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Message that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MessageFindUniqueOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageFindFirstArgs>(args?: SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Messages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Messages
     * const messages = await prisma.message.findMany()
     * 
     * // Get first 10 Messages
     * const messages = await prisma.message.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageWithIdOnly = await prisma.message.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageFindManyArgs>(args?: SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Message.
     * @param {MessageCreateArgs} args - Arguments to create a Message.
     * @example
     * // Create one Message
     * const Message = await prisma.message.create({
     *   data: {
     *     // ... data to create a Message
     *   }
     * })
     * 
     */
    create<T extends MessageCreateArgs>(args: SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Messages.
     * @param {MessageCreateManyArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageCreateManyArgs>(args?: SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Messages and returns the data saved in the database.
     * @param {MessageCreateManyAndReturnArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MessageCreateManyAndReturnArgs>(args?: SelectSubset<T, MessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Message.
     * @param {MessageDeleteArgs} args - Arguments to delete one Message.
     * @example
     * // Delete one Message
     * const Message = await prisma.message.delete({
     *   where: {
     *     // ... filter to delete one Message
     *   }
     * })
     * 
     */
    delete<T extends MessageDeleteArgs>(args: SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Message.
     * @param {MessageUpdateArgs} args - Arguments to update one Message.
     * @example
     * // Update one Message
     * const message = await prisma.message.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageUpdateArgs>(args: SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Messages.
     * @param {MessageDeleteManyArgs} args - Arguments to filter Messages to delete.
     * @example
     * // Delete a few Messages
     * const { count } = await prisma.message.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageDeleteManyArgs>(args?: SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageUpdateManyArgs>(args: SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages and returns the data updated in the database.
     * @param {MessageUpdateManyAndReturnArgs} args - Arguments to update many Messages.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MessageUpdateManyAndReturnArgs>(args: SelectSubset<T, MessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Message.
     * @param {MessageUpsertArgs} args - Arguments to update or create a Message.
     * @example
     * // Update or create a Message
     * const message = await prisma.message.upsert({
     *   create: {
     *     // ... data to create a Message
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Message we want to update
     *   }
     * })
     */
    upsert<T extends MessageUpsertArgs>(args: SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageCountArgs} args - Arguments to filter Messages to count.
     * @example
     * // Count the number of Messages
     * const count = await prisma.message.count({
     *   where: {
     *     // ... the filter for the Messages we want to count
     *   }
     * })
    **/
    count<T extends MessageCountArgs>(
      args?: Subset<T, MessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MessageAggregateArgs>(args: Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>

    /**
     * Group by Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageGroupByArgs['orderBy'] }
        : { orderBy?: MessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Message model
   */
  readonly fields: MessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Message.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    property<T extends PropertyDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PropertyDefaultArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Message model
   */
  interface MessageFieldRefs {
    readonly id: FieldRef<"Message", 'String'>
    readonly propertyId: FieldRef<"Message", 'String'>
    readonly name: FieldRef<"Message", 'String'>
    readonly email: FieldRef<"Message", 'String'>
    readonly phone: FieldRef<"Message", 'String'>
    readonly lang: FieldRef<"Message", 'String'>
    readonly body: FieldRef<"Message", 'String'>
    readonly startDate: FieldRef<"Message", 'DateTime'>
    readonly endDate: FieldRef<"Message", 'DateTime'>
    readonly read: FieldRef<"Message", 'Boolean'>
    readonly createdAt: FieldRef<"Message", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Message findUnique
   */
  export type MessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findUniqueOrThrow
   */
  export type MessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findFirst
   */
  export type MessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findFirstOrThrow
   */
  export type MessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findMany
   */
  export type MessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Messages to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message create
   */
  export type MessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to create a Message.
     */
    data: XOR<MessageCreateInput, MessageUncheckedCreateInput>
  }

  /**
   * Message createMany
   */
  export type MessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Message createManyAndReturn
   */
  export type MessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message update
   */
  export type MessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to update a Message.
     */
    data: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
    /**
     * Choose, which Message to update.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message updateMany
   */
  export type MessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
  }

  /**
   * Message updateManyAndReturn
   */
  export type MessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message upsert
   */
  export type MessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The filter to search for the Message to update in case it exists.
     */
    where: MessageWhereUniqueInput
    /**
     * In case the Message found by the `where` argument doesn't exist, create a new Message with this data.
     */
    create: XOR<MessageCreateInput, MessageUncheckedCreateInput>
    /**
     * In case the Message was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
  }

  /**
   * Message delete
   */
  export type MessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter which Message to delete.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message deleteMany
   */
  export type MessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Messages to delete
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to delete.
     */
    limit?: number
  }

  /**
   * Message without action
   */
  export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
  }


  /**
   * Model IcalFeed
   */

  export type AggregateIcalFeed = {
    _count: IcalFeedCountAggregateOutputType | null
    _min: IcalFeedMinAggregateOutputType | null
    _max: IcalFeedMaxAggregateOutputType | null
  }

  export type IcalFeedMinAggregateOutputType = {
    id: string | null
    propertyId: string | null
    url: string | null
    source: string | null
    lastSyncedAt: Date | null
  }

  export type IcalFeedMaxAggregateOutputType = {
    id: string | null
    propertyId: string | null
    url: string | null
    source: string | null
    lastSyncedAt: Date | null
  }

  export type IcalFeedCountAggregateOutputType = {
    id: number
    propertyId: number
    url: number
    source: number
    lastSyncedAt: number
    _all: number
  }


  export type IcalFeedMinAggregateInputType = {
    id?: true
    propertyId?: true
    url?: true
    source?: true
    lastSyncedAt?: true
  }

  export type IcalFeedMaxAggregateInputType = {
    id?: true
    propertyId?: true
    url?: true
    source?: true
    lastSyncedAt?: true
  }

  export type IcalFeedCountAggregateInputType = {
    id?: true
    propertyId?: true
    url?: true
    source?: true
    lastSyncedAt?: true
    _all?: true
  }

  export type IcalFeedAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IcalFeed to aggregate.
     */
    where?: IcalFeedWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IcalFeeds to fetch.
     */
    orderBy?: IcalFeedOrderByWithRelationInput | IcalFeedOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IcalFeedWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IcalFeeds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IcalFeeds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned IcalFeeds
    **/
    _count?: true | IcalFeedCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IcalFeedMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IcalFeedMaxAggregateInputType
  }

  export type GetIcalFeedAggregateType<T extends IcalFeedAggregateArgs> = {
        [P in keyof T & keyof AggregateIcalFeed]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIcalFeed[P]>
      : GetScalarType<T[P], AggregateIcalFeed[P]>
  }




  export type IcalFeedGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IcalFeedWhereInput
    orderBy?: IcalFeedOrderByWithAggregationInput | IcalFeedOrderByWithAggregationInput[]
    by: IcalFeedScalarFieldEnum[] | IcalFeedScalarFieldEnum
    having?: IcalFeedScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IcalFeedCountAggregateInputType | true
    _min?: IcalFeedMinAggregateInputType
    _max?: IcalFeedMaxAggregateInputType
  }

  export type IcalFeedGroupByOutputType = {
    id: string
    propertyId: string
    url: string
    source: string
    lastSyncedAt: Date | null
    _count: IcalFeedCountAggregateOutputType | null
    _min: IcalFeedMinAggregateOutputType | null
    _max: IcalFeedMaxAggregateOutputType | null
  }

  type GetIcalFeedGroupByPayload<T extends IcalFeedGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IcalFeedGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IcalFeedGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IcalFeedGroupByOutputType[P]>
            : GetScalarType<T[P], IcalFeedGroupByOutputType[P]>
        }
      >
    >


  export type IcalFeedSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    url?: boolean
    source?: boolean
    lastSyncedAt?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
    bookings?: boolean | IcalFeed$bookingsArgs<ExtArgs>
    _count?: boolean | IcalFeedCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["icalFeed"]>

  export type IcalFeedSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    url?: boolean
    source?: boolean
    lastSyncedAt?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["icalFeed"]>

  export type IcalFeedSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    url?: boolean
    source?: boolean
    lastSyncedAt?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["icalFeed"]>

  export type IcalFeedSelectScalar = {
    id?: boolean
    propertyId?: boolean
    url?: boolean
    source?: boolean
    lastSyncedAt?: boolean
  }

  export type IcalFeedOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "propertyId" | "url" | "source" | "lastSyncedAt", ExtArgs["result"]["icalFeed"]>
  export type IcalFeedInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
    bookings?: boolean | IcalFeed$bookingsArgs<ExtArgs>
    _count?: boolean | IcalFeedCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type IcalFeedIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }
  export type IcalFeedIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
  }

  export type $IcalFeedPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "IcalFeed"
    objects: {
      property: Prisma.$PropertyPayload<ExtArgs>
      bookings: Prisma.$BookingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      propertyId: string
      url: string
      source: string
      lastSyncedAt: Date | null
    }, ExtArgs["result"]["icalFeed"]>
    composites: {}
  }

  type IcalFeedGetPayload<S extends boolean | null | undefined | IcalFeedDefaultArgs> = $Result.GetResult<Prisma.$IcalFeedPayload, S>

  type IcalFeedCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IcalFeedFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: IcalFeedCountAggregateInputType | true
    }

  export interface IcalFeedDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['IcalFeed'], meta: { name: 'IcalFeed' } }
    /**
     * Find zero or one IcalFeed that matches the filter.
     * @param {IcalFeedFindUniqueArgs} args - Arguments to find a IcalFeed
     * @example
     * // Get one IcalFeed
     * const icalFeed = await prisma.icalFeed.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IcalFeedFindUniqueArgs>(args: SelectSubset<T, IcalFeedFindUniqueArgs<ExtArgs>>): Prisma__IcalFeedClient<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one IcalFeed that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IcalFeedFindUniqueOrThrowArgs} args - Arguments to find a IcalFeed
     * @example
     * // Get one IcalFeed
     * const icalFeed = await prisma.icalFeed.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IcalFeedFindUniqueOrThrowArgs>(args: SelectSubset<T, IcalFeedFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IcalFeedClient<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IcalFeed that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IcalFeedFindFirstArgs} args - Arguments to find a IcalFeed
     * @example
     * // Get one IcalFeed
     * const icalFeed = await prisma.icalFeed.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IcalFeedFindFirstArgs>(args?: SelectSubset<T, IcalFeedFindFirstArgs<ExtArgs>>): Prisma__IcalFeedClient<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IcalFeed that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IcalFeedFindFirstOrThrowArgs} args - Arguments to find a IcalFeed
     * @example
     * // Get one IcalFeed
     * const icalFeed = await prisma.icalFeed.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IcalFeedFindFirstOrThrowArgs>(args?: SelectSubset<T, IcalFeedFindFirstOrThrowArgs<ExtArgs>>): Prisma__IcalFeedClient<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more IcalFeeds that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IcalFeedFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all IcalFeeds
     * const icalFeeds = await prisma.icalFeed.findMany()
     * 
     * // Get first 10 IcalFeeds
     * const icalFeeds = await prisma.icalFeed.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const icalFeedWithIdOnly = await prisma.icalFeed.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IcalFeedFindManyArgs>(args?: SelectSubset<T, IcalFeedFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a IcalFeed.
     * @param {IcalFeedCreateArgs} args - Arguments to create a IcalFeed.
     * @example
     * // Create one IcalFeed
     * const IcalFeed = await prisma.icalFeed.create({
     *   data: {
     *     // ... data to create a IcalFeed
     *   }
     * })
     * 
     */
    create<T extends IcalFeedCreateArgs>(args: SelectSubset<T, IcalFeedCreateArgs<ExtArgs>>): Prisma__IcalFeedClient<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many IcalFeeds.
     * @param {IcalFeedCreateManyArgs} args - Arguments to create many IcalFeeds.
     * @example
     * // Create many IcalFeeds
     * const icalFeed = await prisma.icalFeed.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IcalFeedCreateManyArgs>(args?: SelectSubset<T, IcalFeedCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many IcalFeeds and returns the data saved in the database.
     * @param {IcalFeedCreateManyAndReturnArgs} args - Arguments to create many IcalFeeds.
     * @example
     * // Create many IcalFeeds
     * const icalFeed = await prisma.icalFeed.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many IcalFeeds and only return the `id`
     * const icalFeedWithIdOnly = await prisma.icalFeed.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IcalFeedCreateManyAndReturnArgs>(args?: SelectSubset<T, IcalFeedCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a IcalFeed.
     * @param {IcalFeedDeleteArgs} args - Arguments to delete one IcalFeed.
     * @example
     * // Delete one IcalFeed
     * const IcalFeed = await prisma.icalFeed.delete({
     *   where: {
     *     // ... filter to delete one IcalFeed
     *   }
     * })
     * 
     */
    delete<T extends IcalFeedDeleteArgs>(args: SelectSubset<T, IcalFeedDeleteArgs<ExtArgs>>): Prisma__IcalFeedClient<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one IcalFeed.
     * @param {IcalFeedUpdateArgs} args - Arguments to update one IcalFeed.
     * @example
     * // Update one IcalFeed
     * const icalFeed = await prisma.icalFeed.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IcalFeedUpdateArgs>(args: SelectSubset<T, IcalFeedUpdateArgs<ExtArgs>>): Prisma__IcalFeedClient<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more IcalFeeds.
     * @param {IcalFeedDeleteManyArgs} args - Arguments to filter IcalFeeds to delete.
     * @example
     * // Delete a few IcalFeeds
     * const { count } = await prisma.icalFeed.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IcalFeedDeleteManyArgs>(args?: SelectSubset<T, IcalFeedDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IcalFeeds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IcalFeedUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many IcalFeeds
     * const icalFeed = await prisma.icalFeed.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IcalFeedUpdateManyArgs>(args: SelectSubset<T, IcalFeedUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IcalFeeds and returns the data updated in the database.
     * @param {IcalFeedUpdateManyAndReturnArgs} args - Arguments to update many IcalFeeds.
     * @example
     * // Update many IcalFeeds
     * const icalFeed = await prisma.icalFeed.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more IcalFeeds and only return the `id`
     * const icalFeedWithIdOnly = await prisma.icalFeed.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IcalFeedUpdateManyAndReturnArgs>(args: SelectSubset<T, IcalFeedUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one IcalFeed.
     * @param {IcalFeedUpsertArgs} args - Arguments to update or create a IcalFeed.
     * @example
     * // Update or create a IcalFeed
     * const icalFeed = await prisma.icalFeed.upsert({
     *   create: {
     *     // ... data to create a IcalFeed
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the IcalFeed we want to update
     *   }
     * })
     */
    upsert<T extends IcalFeedUpsertArgs>(args: SelectSubset<T, IcalFeedUpsertArgs<ExtArgs>>): Prisma__IcalFeedClient<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of IcalFeeds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IcalFeedCountArgs} args - Arguments to filter IcalFeeds to count.
     * @example
     * // Count the number of IcalFeeds
     * const count = await prisma.icalFeed.count({
     *   where: {
     *     // ... the filter for the IcalFeeds we want to count
     *   }
     * })
    **/
    count<T extends IcalFeedCountArgs>(
      args?: Subset<T, IcalFeedCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IcalFeedCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a IcalFeed.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IcalFeedAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IcalFeedAggregateArgs>(args: Subset<T, IcalFeedAggregateArgs>): Prisma.PrismaPromise<GetIcalFeedAggregateType<T>>

    /**
     * Group by IcalFeed.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IcalFeedGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IcalFeedGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IcalFeedGroupByArgs['orderBy'] }
        : { orderBy?: IcalFeedGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IcalFeedGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIcalFeedGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the IcalFeed model
   */
  readonly fields: IcalFeedFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for IcalFeed.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IcalFeedClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    property<T extends PropertyDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PropertyDefaultArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    bookings<T extends IcalFeed$bookingsArgs<ExtArgs> = {}>(args?: Subset<T, IcalFeed$bookingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the IcalFeed model
   */
  interface IcalFeedFieldRefs {
    readonly id: FieldRef<"IcalFeed", 'String'>
    readonly propertyId: FieldRef<"IcalFeed", 'String'>
    readonly url: FieldRef<"IcalFeed", 'String'>
    readonly source: FieldRef<"IcalFeed", 'String'>
    readonly lastSyncedAt: FieldRef<"IcalFeed", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * IcalFeed findUnique
   */
  export type IcalFeedFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    /**
     * Filter, which IcalFeed to fetch.
     */
    where: IcalFeedWhereUniqueInput
  }

  /**
   * IcalFeed findUniqueOrThrow
   */
  export type IcalFeedFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    /**
     * Filter, which IcalFeed to fetch.
     */
    where: IcalFeedWhereUniqueInput
  }

  /**
   * IcalFeed findFirst
   */
  export type IcalFeedFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    /**
     * Filter, which IcalFeed to fetch.
     */
    where?: IcalFeedWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IcalFeeds to fetch.
     */
    orderBy?: IcalFeedOrderByWithRelationInput | IcalFeedOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IcalFeeds.
     */
    cursor?: IcalFeedWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IcalFeeds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IcalFeeds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IcalFeeds.
     */
    distinct?: IcalFeedScalarFieldEnum | IcalFeedScalarFieldEnum[]
  }

  /**
   * IcalFeed findFirstOrThrow
   */
  export type IcalFeedFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    /**
     * Filter, which IcalFeed to fetch.
     */
    where?: IcalFeedWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IcalFeeds to fetch.
     */
    orderBy?: IcalFeedOrderByWithRelationInput | IcalFeedOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IcalFeeds.
     */
    cursor?: IcalFeedWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IcalFeeds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IcalFeeds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IcalFeeds.
     */
    distinct?: IcalFeedScalarFieldEnum | IcalFeedScalarFieldEnum[]
  }

  /**
   * IcalFeed findMany
   */
  export type IcalFeedFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    /**
     * Filter, which IcalFeeds to fetch.
     */
    where?: IcalFeedWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IcalFeeds to fetch.
     */
    orderBy?: IcalFeedOrderByWithRelationInput | IcalFeedOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing IcalFeeds.
     */
    cursor?: IcalFeedWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IcalFeeds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IcalFeeds.
     */
    skip?: number
    distinct?: IcalFeedScalarFieldEnum | IcalFeedScalarFieldEnum[]
  }

  /**
   * IcalFeed create
   */
  export type IcalFeedCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    /**
     * The data needed to create a IcalFeed.
     */
    data: XOR<IcalFeedCreateInput, IcalFeedUncheckedCreateInput>
  }

  /**
   * IcalFeed createMany
   */
  export type IcalFeedCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many IcalFeeds.
     */
    data: IcalFeedCreateManyInput | IcalFeedCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * IcalFeed createManyAndReturn
   */
  export type IcalFeedCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * The data used to create many IcalFeeds.
     */
    data: IcalFeedCreateManyInput | IcalFeedCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * IcalFeed update
   */
  export type IcalFeedUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    /**
     * The data needed to update a IcalFeed.
     */
    data: XOR<IcalFeedUpdateInput, IcalFeedUncheckedUpdateInput>
    /**
     * Choose, which IcalFeed to update.
     */
    where: IcalFeedWhereUniqueInput
  }

  /**
   * IcalFeed updateMany
   */
  export type IcalFeedUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update IcalFeeds.
     */
    data: XOR<IcalFeedUpdateManyMutationInput, IcalFeedUncheckedUpdateManyInput>
    /**
     * Filter which IcalFeeds to update
     */
    where?: IcalFeedWhereInput
    /**
     * Limit how many IcalFeeds to update.
     */
    limit?: number
  }

  /**
   * IcalFeed updateManyAndReturn
   */
  export type IcalFeedUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * The data used to update IcalFeeds.
     */
    data: XOR<IcalFeedUpdateManyMutationInput, IcalFeedUncheckedUpdateManyInput>
    /**
     * Filter which IcalFeeds to update
     */
    where?: IcalFeedWhereInput
    /**
     * Limit how many IcalFeeds to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * IcalFeed upsert
   */
  export type IcalFeedUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    /**
     * The filter to search for the IcalFeed to update in case it exists.
     */
    where: IcalFeedWhereUniqueInput
    /**
     * In case the IcalFeed found by the `where` argument doesn't exist, create a new IcalFeed with this data.
     */
    create: XOR<IcalFeedCreateInput, IcalFeedUncheckedCreateInput>
    /**
     * In case the IcalFeed was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IcalFeedUpdateInput, IcalFeedUncheckedUpdateInput>
  }

  /**
   * IcalFeed delete
   */
  export type IcalFeedDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    /**
     * Filter which IcalFeed to delete.
     */
    where: IcalFeedWhereUniqueInput
  }

  /**
   * IcalFeed deleteMany
   */
  export type IcalFeedDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IcalFeeds to delete
     */
    where?: IcalFeedWhereInput
    /**
     * Limit how many IcalFeeds to delete.
     */
    limit?: number
  }

  /**
   * IcalFeed.bookings
   */
  export type IcalFeed$bookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    cursor?: BookingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * IcalFeed without action
   */
  export type IcalFeedDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
  }


  /**
   * Model Booking
   */

  export type AggregateBooking = {
    _count: BookingCountAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  export type BookingMinAggregateOutputType = {
    id: string | null
    propertyId: string | null
    icalFeedId: string | null
    startDate: Date | null
    endDate: Date | null
    source: string | null
    createdAt: Date | null
  }

  export type BookingMaxAggregateOutputType = {
    id: string | null
    propertyId: string | null
    icalFeedId: string | null
    startDate: Date | null
    endDate: Date | null
    source: string | null
    createdAt: Date | null
  }

  export type BookingCountAggregateOutputType = {
    id: number
    propertyId: number
    icalFeedId: number
    startDate: number
    endDate: number
    source: number
    createdAt: number
    _all: number
  }


  export type BookingMinAggregateInputType = {
    id?: true
    propertyId?: true
    icalFeedId?: true
    startDate?: true
    endDate?: true
    source?: true
    createdAt?: true
  }

  export type BookingMaxAggregateInputType = {
    id?: true
    propertyId?: true
    icalFeedId?: true
    startDate?: true
    endDate?: true
    source?: true
    createdAt?: true
  }

  export type BookingCountAggregateInputType = {
    id?: true
    propertyId?: true
    icalFeedId?: true
    startDate?: true
    endDate?: true
    source?: true
    createdAt?: true
    _all?: true
  }

  export type BookingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Booking to aggregate.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Bookings
    **/
    _count?: true | BookingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BookingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BookingMaxAggregateInputType
  }

  export type GetBookingAggregateType<T extends BookingAggregateArgs> = {
        [P in keyof T & keyof AggregateBooking]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBooking[P]>
      : GetScalarType<T[P], AggregateBooking[P]>
  }




  export type BookingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithAggregationInput | BookingOrderByWithAggregationInput[]
    by: BookingScalarFieldEnum[] | BookingScalarFieldEnum
    having?: BookingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BookingCountAggregateInputType | true
    _min?: BookingMinAggregateInputType
    _max?: BookingMaxAggregateInputType
  }

  export type BookingGroupByOutputType = {
    id: string
    propertyId: string
    icalFeedId: string | null
    startDate: Date
    endDate: Date
    source: string
    createdAt: Date
    _count: BookingCountAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  type GetBookingGroupByPayload<T extends BookingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BookingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BookingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BookingGroupByOutputType[P]>
            : GetScalarType<T[P], BookingGroupByOutputType[P]>
        }
      >
    >


  export type BookingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    icalFeedId?: boolean
    startDate?: boolean
    endDate?: boolean
    source?: boolean
    createdAt?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
    icalFeed?: boolean | Booking$icalFeedArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    icalFeedId?: boolean
    startDate?: boolean
    endDate?: boolean
    source?: boolean
    createdAt?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
    icalFeed?: boolean | Booking$icalFeedArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    propertyId?: boolean
    icalFeedId?: boolean
    startDate?: boolean
    endDate?: boolean
    source?: boolean
    createdAt?: boolean
    property?: boolean | PropertyDefaultArgs<ExtArgs>
    icalFeed?: boolean | Booking$icalFeedArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectScalar = {
    id?: boolean
    propertyId?: boolean
    icalFeedId?: boolean
    startDate?: boolean
    endDate?: boolean
    source?: boolean
    createdAt?: boolean
  }

  export type BookingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "propertyId" | "icalFeedId" | "startDate" | "endDate" | "source" | "createdAt", ExtArgs["result"]["booking"]>
  export type BookingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
    icalFeed?: boolean | Booking$icalFeedArgs<ExtArgs>
  }
  export type BookingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
    icalFeed?: boolean | Booking$icalFeedArgs<ExtArgs>
  }
  export type BookingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    property?: boolean | PropertyDefaultArgs<ExtArgs>
    icalFeed?: boolean | Booking$icalFeedArgs<ExtArgs>
  }

  export type $BookingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Booking"
    objects: {
      property: Prisma.$PropertyPayload<ExtArgs>
      icalFeed: Prisma.$IcalFeedPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      propertyId: string
      icalFeedId: string | null
      startDate: Date
      endDate: Date
      source: string
      createdAt: Date
    }, ExtArgs["result"]["booking"]>
    composites: {}
  }

  type BookingGetPayload<S extends boolean | null | undefined | BookingDefaultArgs> = $Result.GetResult<Prisma.$BookingPayload, S>

  type BookingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BookingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BookingCountAggregateInputType | true
    }

  export interface BookingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Booking'], meta: { name: 'Booking' } }
    /**
     * Find zero or one Booking that matches the filter.
     * @param {BookingFindUniqueArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BookingFindUniqueArgs>(args: SelectSubset<T, BookingFindUniqueArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Booking that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BookingFindUniqueOrThrowArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BookingFindUniqueOrThrowArgs>(args: SelectSubset<T, BookingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Booking that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindFirstArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BookingFindFirstArgs>(args?: SelectSubset<T, BookingFindFirstArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Booking that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindFirstOrThrowArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BookingFindFirstOrThrowArgs>(args?: SelectSubset<T, BookingFindFirstOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Bookings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Bookings
     * const bookings = await prisma.booking.findMany()
     * 
     * // Get first 10 Bookings
     * const bookings = await prisma.booking.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const bookingWithIdOnly = await prisma.booking.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BookingFindManyArgs>(args?: SelectSubset<T, BookingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Booking.
     * @param {BookingCreateArgs} args - Arguments to create a Booking.
     * @example
     * // Create one Booking
     * const Booking = await prisma.booking.create({
     *   data: {
     *     // ... data to create a Booking
     *   }
     * })
     * 
     */
    create<T extends BookingCreateArgs>(args: SelectSubset<T, BookingCreateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Bookings.
     * @param {BookingCreateManyArgs} args - Arguments to create many Bookings.
     * @example
     * // Create many Bookings
     * const booking = await prisma.booking.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BookingCreateManyArgs>(args?: SelectSubset<T, BookingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Bookings and returns the data saved in the database.
     * @param {BookingCreateManyAndReturnArgs} args - Arguments to create many Bookings.
     * @example
     * // Create many Bookings
     * const booking = await prisma.booking.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Bookings and only return the `id`
     * const bookingWithIdOnly = await prisma.booking.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BookingCreateManyAndReturnArgs>(args?: SelectSubset<T, BookingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Booking.
     * @param {BookingDeleteArgs} args - Arguments to delete one Booking.
     * @example
     * // Delete one Booking
     * const Booking = await prisma.booking.delete({
     *   where: {
     *     // ... filter to delete one Booking
     *   }
     * })
     * 
     */
    delete<T extends BookingDeleteArgs>(args: SelectSubset<T, BookingDeleteArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Booking.
     * @param {BookingUpdateArgs} args - Arguments to update one Booking.
     * @example
     * // Update one Booking
     * const booking = await prisma.booking.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BookingUpdateArgs>(args: SelectSubset<T, BookingUpdateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Bookings.
     * @param {BookingDeleteManyArgs} args - Arguments to filter Bookings to delete.
     * @example
     * // Delete a few Bookings
     * const { count } = await prisma.booking.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BookingDeleteManyArgs>(args?: SelectSubset<T, BookingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Bookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Bookings
     * const booking = await prisma.booking.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BookingUpdateManyArgs>(args: SelectSubset<T, BookingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Bookings and returns the data updated in the database.
     * @param {BookingUpdateManyAndReturnArgs} args - Arguments to update many Bookings.
     * @example
     * // Update many Bookings
     * const booking = await prisma.booking.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Bookings and only return the `id`
     * const bookingWithIdOnly = await prisma.booking.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BookingUpdateManyAndReturnArgs>(args: SelectSubset<T, BookingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Booking.
     * @param {BookingUpsertArgs} args - Arguments to update or create a Booking.
     * @example
     * // Update or create a Booking
     * const booking = await prisma.booking.upsert({
     *   create: {
     *     // ... data to create a Booking
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Booking we want to update
     *   }
     * })
     */
    upsert<T extends BookingUpsertArgs>(args: SelectSubset<T, BookingUpsertArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Bookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingCountArgs} args - Arguments to filter Bookings to count.
     * @example
     * // Count the number of Bookings
     * const count = await prisma.booking.count({
     *   where: {
     *     // ... the filter for the Bookings we want to count
     *   }
     * })
    **/
    count<T extends BookingCountArgs>(
      args?: Subset<T, BookingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BookingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Booking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BookingAggregateArgs>(args: Subset<T, BookingAggregateArgs>): Prisma.PrismaPromise<GetBookingAggregateType<T>>

    /**
     * Group by Booking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BookingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BookingGroupByArgs['orderBy'] }
        : { orderBy?: BookingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BookingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBookingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Booking model
   */
  readonly fields: BookingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Booking.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BookingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    property<T extends PropertyDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PropertyDefaultArgs<ExtArgs>>): Prisma__PropertyClient<$Result.GetResult<Prisma.$PropertyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    icalFeed<T extends Booking$icalFeedArgs<ExtArgs> = {}>(args?: Subset<T, Booking$icalFeedArgs<ExtArgs>>): Prisma__IcalFeedClient<$Result.GetResult<Prisma.$IcalFeedPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Booking model
   */
  interface BookingFieldRefs {
    readonly id: FieldRef<"Booking", 'String'>
    readonly propertyId: FieldRef<"Booking", 'String'>
    readonly icalFeedId: FieldRef<"Booking", 'String'>
    readonly startDate: FieldRef<"Booking", 'DateTime'>
    readonly endDate: FieldRef<"Booking", 'DateTime'>
    readonly source: FieldRef<"Booking", 'String'>
    readonly createdAt: FieldRef<"Booking", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Booking findUnique
   */
  export type BookingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking findUniqueOrThrow
   */
  export type BookingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking findFirst
   */
  export type BookingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking findFirstOrThrow
   */
  export type BookingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking findMany
   */
  export type BookingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Bookings to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking create
   */
  export type BookingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The data needed to create a Booking.
     */
    data: XOR<BookingCreateInput, BookingUncheckedCreateInput>
  }

  /**
   * Booking createMany
   */
  export type BookingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Bookings.
     */
    data: BookingCreateManyInput | BookingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Booking createManyAndReturn
   */
  export type BookingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * The data used to create many Bookings.
     */
    data: BookingCreateManyInput | BookingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Booking update
   */
  export type BookingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The data needed to update a Booking.
     */
    data: XOR<BookingUpdateInput, BookingUncheckedUpdateInput>
    /**
     * Choose, which Booking to update.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking updateMany
   */
  export type BookingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Bookings.
     */
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyInput>
    /**
     * Filter which Bookings to update
     */
    where?: BookingWhereInput
    /**
     * Limit how many Bookings to update.
     */
    limit?: number
  }

  /**
   * Booking updateManyAndReturn
   */
  export type BookingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * The data used to update Bookings.
     */
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyInput>
    /**
     * Filter which Bookings to update
     */
    where?: BookingWhereInput
    /**
     * Limit how many Bookings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Booking upsert
   */
  export type BookingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The filter to search for the Booking to update in case it exists.
     */
    where: BookingWhereUniqueInput
    /**
     * In case the Booking found by the `where` argument doesn't exist, create a new Booking with this data.
     */
    create: XOR<BookingCreateInput, BookingUncheckedCreateInput>
    /**
     * In case the Booking was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BookingUpdateInput, BookingUncheckedUpdateInput>
  }

  /**
   * Booking delete
   */
  export type BookingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter which Booking to delete.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking deleteMany
   */
  export type BookingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Bookings to delete
     */
    where?: BookingWhereInput
    /**
     * Limit how many Bookings to delete.
     */
    limit?: number
  }

  /**
   * Booking.icalFeed
   */
  export type Booking$icalFeedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IcalFeed
     */
    select?: IcalFeedSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IcalFeed
     */
    omit?: IcalFeedOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: IcalFeedInclude<ExtArgs> | null
    where?: IcalFeedWhereInput
  }

  /**
   * Booking without action
   */
  export type BookingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    name: 'name',
    role: 'role',
    createdAt: 'createdAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const PropertyScalarFieldEnum: {
    id: 'id',
    slug: 'slug',
    titleEs: 'titleEs',
    titleEn: 'titleEn',
    titleFr: 'titleFr',
    descEs: 'descEs',
    descEn: 'descEn',
    descFr: 'descFr',
    address: 'address',
    city: 'city',
    maxGuests: 'maxGuests',
    bedrooms: 'bedrooms',
    bathrooms: 'bathrooms',
    published: 'published',
    ownerId: 'ownerId',
    createdAt: 'createdAt'
  };

  export type PropertyScalarFieldEnum = (typeof PropertyScalarFieldEnum)[keyof typeof PropertyScalarFieldEnum]


  export const MediaScalarFieldEnum: {
    id: 'id',
    propertyId: 'propertyId',
    url: 'url',
    type: 'type',
    order: 'order'
  };

  export type MediaScalarFieldEnum = (typeof MediaScalarFieldEnum)[keyof typeof MediaScalarFieldEnum]


  export const MessageScalarFieldEnum: {
    id: 'id',
    propertyId: 'propertyId',
    name: 'name',
    email: 'email',
    phone: 'phone',
    lang: 'lang',
    body: 'body',
    startDate: 'startDate',
    endDate: 'endDate',
    read: 'read',
    createdAt: 'createdAt'
  };

  export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum]


  export const IcalFeedScalarFieldEnum: {
    id: 'id',
    propertyId: 'propertyId',
    url: 'url',
    source: 'source',
    lastSyncedAt: 'lastSyncedAt'
  };

  export type IcalFeedScalarFieldEnum = (typeof IcalFeedScalarFieldEnum)[keyof typeof IcalFeedScalarFieldEnum]


  export const BookingScalarFieldEnum: {
    id: 'id',
    propertyId: 'propertyId',
    icalFeedId: 'icalFeedId',
    startDate: 'startDate',
    endDate: 'endDate',
    source: 'source',
    createdAt: 'createdAt'
  };

  export type BookingScalarFieldEnum = (typeof BookingScalarFieldEnum)[keyof typeof BookingScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'MediaType'
   */
  export type EnumMediaTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MediaType'>
    


  /**
   * Reference to a field of type 'MediaType[]'
   */
  export type ListEnumMediaTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'MediaType[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    createdAt?: DateTimeFilter<"User"> | Date | string
    properties?: PropertyListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    properties?: PropertyOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    createdAt?: DateTimeFilter<"User"> | Date | string
    properties?: PropertyListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type PropertyWhereInput = {
    AND?: PropertyWhereInput | PropertyWhereInput[]
    OR?: PropertyWhereInput[]
    NOT?: PropertyWhereInput | PropertyWhereInput[]
    id?: StringFilter<"Property"> | string
    slug?: StringFilter<"Property"> | string
    titleEs?: StringFilter<"Property"> | string
    titleEn?: StringFilter<"Property"> | string
    titleFr?: StringFilter<"Property"> | string
    descEs?: StringFilter<"Property"> | string
    descEn?: StringFilter<"Property"> | string
    descFr?: StringFilter<"Property"> | string
    address?: StringFilter<"Property"> | string
    city?: StringFilter<"Property"> | string
    maxGuests?: IntFilter<"Property"> | number
    bedrooms?: IntFilter<"Property"> | number
    bathrooms?: FloatFilter<"Property"> | number
    published?: BoolFilter<"Property"> | boolean
    ownerId?: StringFilter<"Property"> | string
    createdAt?: DateTimeFilter<"Property"> | Date | string
    owner?: XOR<UserScalarRelationFilter, UserWhereInput>
    media?: MediaListRelationFilter
    messages?: MessageListRelationFilter
    icalFeeds?: IcalFeedListRelationFilter
    bookings?: BookingListRelationFilter
  }

  export type PropertyOrderByWithRelationInput = {
    id?: SortOrder
    slug?: SortOrder
    titleEs?: SortOrder
    titleEn?: SortOrder
    titleFr?: SortOrder
    descEs?: SortOrder
    descEn?: SortOrder
    descFr?: SortOrder
    address?: SortOrder
    city?: SortOrder
    maxGuests?: SortOrder
    bedrooms?: SortOrder
    bathrooms?: SortOrder
    published?: SortOrder
    ownerId?: SortOrder
    createdAt?: SortOrder
    owner?: UserOrderByWithRelationInput
    media?: MediaOrderByRelationAggregateInput
    messages?: MessageOrderByRelationAggregateInput
    icalFeeds?: IcalFeedOrderByRelationAggregateInput
    bookings?: BookingOrderByRelationAggregateInput
  }

  export type PropertyWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: PropertyWhereInput | PropertyWhereInput[]
    OR?: PropertyWhereInput[]
    NOT?: PropertyWhereInput | PropertyWhereInput[]
    titleEs?: StringFilter<"Property"> | string
    titleEn?: StringFilter<"Property"> | string
    titleFr?: StringFilter<"Property"> | string
    descEs?: StringFilter<"Property"> | string
    descEn?: StringFilter<"Property"> | string
    descFr?: StringFilter<"Property"> | string
    address?: StringFilter<"Property"> | string
    city?: StringFilter<"Property"> | string
    maxGuests?: IntFilter<"Property"> | number
    bedrooms?: IntFilter<"Property"> | number
    bathrooms?: FloatFilter<"Property"> | number
    published?: BoolFilter<"Property"> | boolean
    ownerId?: StringFilter<"Property"> | string
    createdAt?: DateTimeFilter<"Property"> | Date | string
    owner?: XOR<UserScalarRelationFilter, UserWhereInput>
    media?: MediaListRelationFilter
    messages?: MessageListRelationFilter
    icalFeeds?: IcalFeedListRelationFilter
    bookings?: BookingListRelationFilter
  }, "id" | "slug">

  export type PropertyOrderByWithAggregationInput = {
    id?: SortOrder
    slug?: SortOrder
    titleEs?: SortOrder
    titleEn?: SortOrder
    titleFr?: SortOrder
    descEs?: SortOrder
    descEn?: SortOrder
    descFr?: SortOrder
    address?: SortOrder
    city?: SortOrder
    maxGuests?: SortOrder
    bedrooms?: SortOrder
    bathrooms?: SortOrder
    published?: SortOrder
    ownerId?: SortOrder
    createdAt?: SortOrder
    _count?: PropertyCountOrderByAggregateInput
    _avg?: PropertyAvgOrderByAggregateInput
    _max?: PropertyMaxOrderByAggregateInput
    _min?: PropertyMinOrderByAggregateInput
    _sum?: PropertySumOrderByAggregateInput
  }

  export type PropertyScalarWhereWithAggregatesInput = {
    AND?: PropertyScalarWhereWithAggregatesInput | PropertyScalarWhereWithAggregatesInput[]
    OR?: PropertyScalarWhereWithAggregatesInput[]
    NOT?: PropertyScalarWhereWithAggregatesInput | PropertyScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Property"> | string
    slug?: StringWithAggregatesFilter<"Property"> | string
    titleEs?: StringWithAggregatesFilter<"Property"> | string
    titleEn?: StringWithAggregatesFilter<"Property"> | string
    titleFr?: StringWithAggregatesFilter<"Property"> | string
    descEs?: StringWithAggregatesFilter<"Property"> | string
    descEn?: StringWithAggregatesFilter<"Property"> | string
    descFr?: StringWithAggregatesFilter<"Property"> | string
    address?: StringWithAggregatesFilter<"Property"> | string
    city?: StringWithAggregatesFilter<"Property"> | string
    maxGuests?: IntWithAggregatesFilter<"Property"> | number
    bedrooms?: IntWithAggregatesFilter<"Property"> | number
    bathrooms?: FloatWithAggregatesFilter<"Property"> | number
    published?: BoolWithAggregatesFilter<"Property"> | boolean
    ownerId?: StringWithAggregatesFilter<"Property"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Property"> | Date | string
  }

  export type MediaWhereInput = {
    AND?: MediaWhereInput | MediaWhereInput[]
    OR?: MediaWhereInput[]
    NOT?: MediaWhereInput | MediaWhereInput[]
    id?: StringFilter<"Media"> | string
    propertyId?: StringFilter<"Media"> | string
    url?: StringFilter<"Media"> | string
    type?: EnumMediaTypeFilter<"Media"> | $Enums.MediaType
    order?: IntFilter<"Media"> | number
    property?: XOR<PropertyScalarRelationFilter, PropertyWhereInput>
  }

  export type MediaOrderByWithRelationInput = {
    id?: SortOrder
    propertyId?: SortOrder
    url?: SortOrder
    type?: SortOrder
    order?: SortOrder
    property?: PropertyOrderByWithRelationInput
  }

  export type MediaWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MediaWhereInput | MediaWhereInput[]
    OR?: MediaWhereInput[]
    NOT?: MediaWhereInput | MediaWhereInput[]
    propertyId?: StringFilter<"Media"> | string
    url?: StringFilter<"Media"> | string
    type?: EnumMediaTypeFilter<"Media"> | $Enums.MediaType
    order?: IntFilter<"Media"> | number
    property?: XOR<PropertyScalarRelationFilter, PropertyWhereInput>
  }, "id">

  export type MediaOrderByWithAggregationInput = {
    id?: SortOrder
    propertyId?: SortOrder
    url?: SortOrder
    type?: SortOrder
    order?: SortOrder
    _count?: MediaCountOrderByAggregateInput
    _avg?: MediaAvgOrderByAggregateInput
    _max?: MediaMaxOrderByAggregateInput
    _min?: MediaMinOrderByAggregateInput
    _sum?: MediaSumOrderByAggregateInput
  }

  export type MediaScalarWhereWithAggregatesInput = {
    AND?: MediaScalarWhereWithAggregatesInput | MediaScalarWhereWithAggregatesInput[]
    OR?: MediaScalarWhereWithAggregatesInput[]
    NOT?: MediaScalarWhereWithAggregatesInput | MediaScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Media"> | string
    propertyId?: StringWithAggregatesFilter<"Media"> | string
    url?: StringWithAggregatesFilter<"Media"> | string
    type?: EnumMediaTypeWithAggregatesFilter<"Media"> | $Enums.MediaType
    order?: IntWithAggregatesFilter<"Media"> | number
  }

  export type MessageWhereInput = {
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    id?: StringFilter<"Message"> | string
    propertyId?: StringFilter<"Message"> | string
    name?: StringFilter<"Message"> | string
    email?: StringFilter<"Message"> | string
    phone?: StringNullableFilter<"Message"> | string | null
    lang?: StringFilter<"Message"> | string
    body?: StringFilter<"Message"> | string
    startDate?: DateTimeNullableFilter<"Message"> | Date | string | null
    endDate?: DateTimeNullableFilter<"Message"> | Date | string | null
    read?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
    property?: XOR<PropertyScalarRelationFilter, PropertyWhereInput>
  }

  export type MessageOrderByWithRelationInput = {
    id?: SortOrder
    propertyId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    lang?: SortOrder
    body?: SortOrder
    startDate?: SortOrderInput | SortOrder
    endDate?: SortOrderInput | SortOrder
    read?: SortOrder
    createdAt?: SortOrder
    property?: PropertyOrderByWithRelationInput
  }

  export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    propertyId?: StringFilter<"Message"> | string
    name?: StringFilter<"Message"> | string
    email?: StringFilter<"Message"> | string
    phone?: StringNullableFilter<"Message"> | string | null
    lang?: StringFilter<"Message"> | string
    body?: StringFilter<"Message"> | string
    startDate?: DateTimeNullableFilter<"Message"> | Date | string | null
    endDate?: DateTimeNullableFilter<"Message"> | Date | string | null
    read?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
    property?: XOR<PropertyScalarRelationFilter, PropertyWhereInput>
  }, "id">

  export type MessageOrderByWithAggregationInput = {
    id?: SortOrder
    propertyId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    lang?: SortOrder
    body?: SortOrder
    startDate?: SortOrderInput | SortOrder
    endDate?: SortOrderInput | SortOrder
    read?: SortOrder
    createdAt?: SortOrder
    _count?: MessageCountOrderByAggregateInput
    _max?: MessageMaxOrderByAggregateInput
    _min?: MessageMinOrderByAggregateInput
  }

  export type MessageScalarWhereWithAggregatesInput = {
    AND?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    OR?: MessageScalarWhereWithAggregatesInput[]
    NOT?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Message"> | string
    propertyId?: StringWithAggregatesFilter<"Message"> | string
    name?: StringWithAggregatesFilter<"Message"> | string
    email?: StringWithAggregatesFilter<"Message"> | string
    phone?: StringNullableWithAggregatesFilter<"Message"> | string | null
    lang?: StringWithAggregatesFilter<"Message"> | string
    body?: StringWithAggregatesFilter<"Message"> | string
    startDate?: DateTimeNullableWithAggregatesFilter<"Message"> | Date | string | null
    endDate?: DateTimeNullableWithAggregatesFilter<"Message"> | Date | string | null
    read?: BoolWithAggregatesFilter<"Message"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
  }

  export type IcalFeedWhereInput = {
    AND?: IcalFeedWhereInput | IcalFeedWhereInput[]
    OR?: IcalFeedWhereInput[]
    NOT?: IcalFeedWhereInput | IcalFeedWhereInput[]
    id?: StringFilter<"IcalFeed"> | string
    propertyId?: StringFilter<"IcalFeed"> | string
    url?: StringFilter<"IcalFeed"> | string
    source?: StringFilter<"IcalFeed"> | string
    lastSyncedAt?: DateTimeNullableFilter<"IcalFeed"> | Date | string | null
    property?: XOR<PropertyScalarRelationFilter, PropertyWhereInput>
    bookings?: BookingListRelationFilter
  }

  export type IcalFeedOrderByWithRelationInput = {
    id?: SortOrder
    propertyId?: SortOrder
    url?: SortOrder
    source?: SortOrder
    lastSyncedAt?: SortOrderInput | SortOrder
    property?: PropertyOrderByWithRelationInput
    bookings?: BookingOrderByRelationAggregateInput
  }

  export type IcalFeedWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: IcalFeedWhereInput | IcalFeedWhereInput[]
    OR?: IcalFeedWhereInput[]
    NOT?: IcalFeedWhereInput | IcalFeedWhereInput[]
    propertyId?: StringFilter<"IcalFeed"> | string
    url?: StringFilter<"IcalFeed"> | string
    source?: StringFilter<"IcalFeed"> | string
    lastSyncedAt?: DateTimeNullableFilter<"IcalFeed"> | Date | string | null
    property?: XOR<PropertyScalarRelationFilter, PropertyWhereInput>
    bookings?: BookingListRelationFilter
  }, "id">

  export type IcalFeedOrderByWithAggregationInput = {
    id?: SortOrder
    propertyId?: SortOrder
    url?: SortOrder
    source?: SortOrder
    lastSyncedAt?: SortOrderInput | SortOrder
    _count?: IcalFeedCountOrderByAggregateInput
    _max?: IcalFeedMaxOrderByAggregateInput
    _min?: IcalFeedMinOrderByAggregateInput
  }

  export type IcalFeedScalarWhereWithAggregatesInput = {
    AND?: IcalFeedScalarWhereWithAggregatesInput | IcalFeedScalarWhereWithAggregatesInput[]
    OR?: IcalFeedScalarWhereWithAggregatesInput[]
    NOT?: IcalFeedScalarWhereWithAggregatesInput | IcalFeedScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"IcalFeed"> | string
    propertyId?: StringWithAggregatesFilter<"IcalFeed"> | string
    url?: StringWithAggregatesFilter<"IcalFeed"> | string
    source?: StringWithAggregatesFilter<"IcalFeed"> | string
    lastSyncedAt?: DateTimeNullableWithAggregatesFilter<"IcalFeed"> | Date | string | null
  }

  export type BookingWhereInput = {
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    id?: StringFilter<"Booking"> | string
    propertyId?: StringFilter<"Booking"> | string
    icalFeedId?: StringNullableFilter<"Booking"> | string | null
    startDate?: DateTimeFilter<"Booking"> | Date | string
    endDate?: DateTimeFilter<"Booking"> | Date | string
    source?: StringFilter<"Booking"> | string
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    property?: XOR<PropertyScalarRelationFilter, PropertyWhereInput>
    icalFeed?: XOR<IcalFeedNullableScalarRelationFilter, IcalFeedWhereInput> | null
  }

  export type BookingOrderByWithRelationInput = {
    id?: SortOrder
    propertyId?: SortOrder
    icalFeedId?: SortOrderInput | SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    property?: PropertyOrderByWithRelationInput
    icalFeed?: IcalFeedOrderByWithRelationInput
  }

  export type BookingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    propertyId?: StringFilter<"Booking"> | string
    icalFeedId?: StringNullableFilter<"Booking"> | string | null
    startDate?: DateTimeFilter<"Booking"> | Date | string
    endDate?: DateTimeFilter<"Booking"> | Date | string
    source?: StringFilter<"Booking"> | string
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    property?: XOR<PropertyScalarRelationFilter, PropertyWhereInput>
    icalFeed?: XOR<IcalFeedNullableScalarRelationFilter, IcalFeedWhereInput> | null
  }, "id">

  export type BookingOrderByWithAggregationInput = {
    id?: SortOrder
    propertyId?: SortOrder
    icalFeedId?: SortOrderInput | SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    _count?: BookingCountOrderByAggregateInput
    _max?: BookingMaxOrderByAggregateInput
    _min?: BookingMinOrderByAggregateInput
  }

  export type BookingScalarWhereWithAggregatesInput = {
    AND?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    OR?: BookingScalarWhereWithAggregatesInput[]
    NOT?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Booking"> | string
    propertyId?: StringWithAggregatesFilter<"Booking"> | string
    icalFeedId?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    startDate?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    endDate?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    source?: StringWithAggregatesFilter<"Booking"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    name: string
    role?: $Enums.Role
    createdAt?: Date | string
    properties?: PropertyCreateNestedManyWithoutOwnerInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    name: string
    role?: $Enums.Role
    createdAt?: Date | string
    properties?: PropertyUncheckedCreateNestedManyWithoutOwnerInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    properties?: PropertyUpdateManyWithoutOwnerNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    properties?: PropertyUncheckedUpdateManyWithoutOwnerNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    name: string
    role?: $Enums.Role
    createdAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PropertyCreateInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    createdAt?: Date | string
    owner: UserCreateNestedOneWithoutPropertiesInput
    media?: MediaCreateNestedManyWithoutPropertyInput
    messages?: MessageCreateNestedManyWithoutPropertyInput
    icalFeeds?: IcalFeedCreateNestedManyWithoutPropertyInput
    bookings?: BookingCreateNestedManyWithoutPropertyInput
  }

  export type PropertyUncheckedCreateInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    ownerId: string
    createdAt?: Date | string
    media?: MediaUncheckedCreateNestedManyWithoutPropertyInput
    messages?: MessageUncheckedCreateNestedManyWithoutPropertyInput
    icalFeeds?: IcalFeedUncheckedCreateNestedManyWithoutPropertyInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPropertyInput
  }

  export type PropertyUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneRequiredWithoutPropertiesNestedInput
    media?: MediaUpdateManyWithoutPropertyNestedInput
    messages?: MessageUpdateManyWithoutPropertyNestedInput
    icalFeeds?: IcalFeedUpdateManyWithoutPropertyNestedInput
    bookings?: BookingUpdateManyWithoutPropertyNestedInput
  }

  export type PropertyUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    ownerId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    media?: MediaUncheckedUpdateManyWithoutPropertyNestedInput
    messages?: MessageUncheckedUpdateManyWithoutPropertyNestedInput
    icalFeeds?: IcalFeedUncheckedUpdateManyWithoutPropertyNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPropertyNestedInput
  }

  export type PropertyCreateManyInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    ownerId: string
    createdAt?: Date | string
  }

  export type PropertyUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PropertyUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    ownerId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MediaCreateInput = {
    id?: string
    url: string
    type?: $Enums.MediaType
    order?: number
    property: PropertyCreateNestedOneWithoutMediaInput
  }

  export type MediaUncheckedCreateInput = {
    id?: string
    propertyId: string
    url: string
    type?: $Enums.MediaType
    order?: number
  }

  export type MediaUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    type?: EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType
    order?: IntFieldUpdateOperationsInput | number
    property?: PropertyUpdateOneRequiredWithoutMediaNestedInput
  }

  export type MediaUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    type?: EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType
    order?: IntFieldUpdateOperationsInput | number
  }

  export type MediaCreateManyInput = {
    id?: string
    propertyId: string
    url: string
    type?: $Enums.MediaType
    order?: number
  }

  export type MediaUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    type?: EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType
    order?: IntFieldUpdateOperationsInput | number
  }

  export type MediaUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    type?: EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType
    order?: IntFieldUpdateOperationsInput | number
  }

  export type MessageCreateInput = {
    id?: string
    name: string
    email: string
    phone?: string | null
    lang?: string
    body: string
    startDate?: Date | string | null
    endDate?: Date | string | null
    read?: boolean
    createdAt?: Date | string
    property: PropertyCreateNestedOneWithoutMessagesInput
  }

  export type MessageUncheckedCreateInput = {
    id?: string
    propertyId: string
    name: string
    email: string
    phone?: string | null
    lang?: string
    body: string
    startDate?: Date | string | null
    endDate?: Date | string | null
    read?: boolean
    createdAt?: Date | string
  }

  export type MessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    lang?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    read?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    property?: PropertyUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type MessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    lang?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    read?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageCreateManyInput = {
    id?: string
    propertyId: string
    name: string
    email: string
    phone?: string | null
    lang?: string
    body: string
    startDate?: Date | string | null
    endDate?: Date | string | null
    read?: boolean
    createdAt?: Date | string
  }

  export type MessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    lang?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    read?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    lang?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    read?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IcalFeedCreateInput = {
    id?: string
    url: string
    source?: string
    lastSyncedAt?: Date | string | null
    property: PropertyCreateNestedOneWithoutIcalFeedsInput
    bookings?: BookingCreateNestedManyWithoutIcalFeedInput
  }

  export type IcalFeedUncheckedCreateInput = {
    id?: string
    propertyId: string
    url: string
    source?: string
    lastSyncedAt?: Date | string | null
    bookings?: BookingUncheckedCreateNestedManyWithoutIcalFeedInput
  }

  export type IcalFeedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    property?: PropertyUpdateOneRequiredWithoutIcalFeedsNestedInput
    bookings?: BookingUpdateManyWithoutIcalFeedNestedInput
  }

  export type IcalFeedUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bookings?: BookingUncheckedUpdateManyWithoutIcalFeedNestedInput
  }

  export type IcalFeedCreateManyInput = {
    id?: string
    propertyId: string
    url: string
    source?: string
    lastSyncedAt?: Date | string | null
  }

  export type IcalFeedUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type IcalFeedUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type BookingCreateInput = {
    id?: string
    startDate: Date | string
    endDate: Date | string
    source?: string
    createdAt?: Date | string
    property: PropertyCreateNestedOneWithoutBookingsInput
    icalFeed?: IcalFeedCreateNestedOneWithoutBookingsInput
  }

  export type BookingUncheckedCreateInput = {
    id?: string
    propertyId: string
    icalFeedId?: string | null
    startDate: Date | string
    endDate: Date | string
    source?: string
    createdAt?: Date | string
  }

  export type BookingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    property?: PropertyUpdateOneRequiredWithoutBookingsNestedInput
    icalFeed?: IcalFeedUpdateOneWithoutBookingsNestedInput
  }

  export type BookingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    icalFeedId?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingCreateManyInput = {
    id?: string
    propertyId: string
    icalFeedId?: string | null
    startDate: Date | string
    endDate: Date | string
    source?: string
    createdAt?: Date | string
  }

  export type BookingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    icalFeedId?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type PropertyListRelationFilter = {
    every?: PropertyWhereInput
    some?: PropertyWhereInput
    none?: PropertyWhereInput
  }

  export type PropertyOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type MediaListRelationFilter = {
    every?: MediaWhereInput
    some?: MediaWhereInput
    none?: MediaWhereInput
  }

  export type MessageListRelationFilter = {
    every?: MessageWhereInput
    some?: MessageWhereInput
    none?: MessageWhereInput
  }

  export type IcalFeedListRelationFilter = {
    every?: IcalFeedWhereInput
    some?: IcalFeedWhereInput
    none?: IcalFeedWhereInput
  }

  export type BookingListRelationFilter = {
    every?: BookingWhereInput
    some?: BookingWhereInput
    none?: BookingWhereInput
  }

  export type MediaOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IcalFeedOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BookingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PropertyCountOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    titleEs?: SortOrder
    titleEn?: SortOrder
    titleFr?: SortOrder
    descEs?: SortOrder
    descEn?: SortOrder
    descFr?: SortOrder
    address?: SortOrder
    city?: SortOrder
    maxGuests?: SortOrder
    bedrooms?: SortOrder
    bathrooms?: SortOrder
    published?: SortOrder
    ownerId?: SortOrder
    createdAt?: SortOrder
  }

  export type PropertyAvgOrderByAggregateInput = {
    maxGuests?: SortOrder
    bedrooms?: SortOrder
    bathrooms?: SortOrder
  }

  export type PropertyMaxOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    titleEs?: SortOrder
    titleEn?: SortOrder
    titleFr?: SortOrder
    descEs?: SortOrder
    descEn?: SortOrder
    descFr?: SortOrder
    address?: SortOrder
    city?: SortOrder
    maxGuests?: SortOrder
    bedrooms?: SortOrder
    bathrooms?: SortOrder
    published?: SortOrder
    ownerId?: SortOrder
    createdAt?: SortOrder
  }

  export type PropertyMinOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    titleEs?: SortOrder
    titleEn?: SortOrder
    titleFr?: SortOrder
    descEs?: SortOrder
    descEn?: SortOrder
    descFr?: SortOrder
    address?: SortOrder
    city?: SortOrder
    maxGuests?: SortOrder
    bedrooms?: SortOrder
    bathrooms?: SortOrder
    published?: SortOrder
    ownerId?: SortOrder
    createdAt?: SortOrder
  }

  export type PropertySumOrderByAggregateInput = {
    maxGuests?: SortOrder
    bedrooms?: SortOrder
    bathrooms?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumMediaTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.MediaType | EnumMediaTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MediaType[] | ListEnumMediaTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MediaType[] | ListEnumMediaTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMediaTypeFilter<$PrismaModel> | $Enums.MediaType
  }

  export type PropertyScalarRelationFilter = {
    is?: PropertyWhereInput
    isNot?: PropertyWhereInput
  }

  export type MediaCountOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    url?: SortOrder
    type?: SortOrder
    order?: SortOrder
  }

  export type MediaAvgOrderByAggregateInput = {
    order?: SortOrder
  }

  export type MediaMaxOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    url?: SortOrder
    type?: SortOrder
    order?: SortOrder
  }

  export type MediaMinOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    url?: SortOrder
    type?: SortOrder
    order?: SortOrder
  }

  export type MediaSumOrderByAggregateInput = {
    order?: SortOrder
  }

  export type EnumMediaTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MediaType | EnumMediaTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MediaType[] | ListEnumMediaTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MediaType[] | ListEnumMediaTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMediaTypeWithAggregatesFilter<$PrismaModel> | $Enums.MediaType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMediaTypeFilter<$PrismaModel>
    _max?: NestedEnumMediaTypeFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type MessageCountOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    lang?: SortOrder
    body?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    read?: SortOrder
    createdAt?: SortOrder
  }

  export type MessageMaxOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    lang?: SortOrder
    body?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    read?: SortOrder
    createdAt?: SortOrder
  }

  export type MessageMinOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    lang?: SortOrder
    body?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    read?: SortOrder
    createdAt?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IcalFeedCountOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    url?: SortOrder
    source?: SortOrder
    lastSyncedAt?: SortOrder
  }

  export type IcalFeedMaxOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    url?: SortOrder
    source?: SortOrder
    lastSyncedAt?: SortOrder
  }

  export type IcalFeedMinOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    url?: SortOrder
    source?: SortOrder
    lastSyncedAt?: SortOrder
  }

  export type IcalFeedNullableScalarRelationFilter = {
    is?: IcalFeedWhereInput | null
    isNot?: IcalFeedWhereInput | null
  }

  export type BookingCountOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    icalFeedId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
  }

  export type BookingMaxOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    icalFeedId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
  }

  export type BookingMinOrderByAggregateInput = {
    id?: SortOrder
    propertyId?: SortOrder
    icalFeedId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
  }

  export type PropertyCreateNestedManyWithoutOwnerInput = {
    create?: XOR<PropertyCreateWithoutOwnerInput, PropertyUncheckedCreateWithoutOwnerInput> | PropertyCreateWithoutOwnerInput[] | PropertyUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: PropertyCreateOrConnectWithoutOwnerInput | PropertyCreateOrConnectWithoutOwnerInput[]
    createMany?: PropertyCreateManyOwnerInputEnvelope
    connect?: PropertyWhereUniqueInput | PropertyWhereUniqueInput[]
  }

  export type PropertyUncheckedCreateNestedManyWithoutOwnerInput = {
    create?: XOR<PropertyCreateWithoutOwnerInput, PropertyUncheckedCreateWithoutOwnerInput> | PropertyCreateWithoutOwnerInput[] | PropertyUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: PropertyCreateOrConnectWithoutOwnerInput | PropertyCreateOrConnectWithoutOwnerInput[]
    createMany?: PropertyCreateManyOwnerInputEnvelope
    connect?: PropertyWhereUniqueInput | PropertyWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PropertyUpdateManyWithoutOwnerNestedInput = {
    create?: XOR<PropertyCreateWithoutOwnerInput, PropertyUncheckedCreateWithoutOwnerInput> | PropertyCreateWithoutOwnerInput[] | PropertyUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: PropertyCreateOrConnectWithoutOwnerInput | PropertyCreateOrConnectWithoutOwnerInput[]
    upsert?: PropertyUpsertWithWhereUniqueWithoutOwnerInput | PropertyUpsertWithWhereUniqueWithoutOwnerInput[]
    createMany?: PropertyCreateManyOwnerInputEnvelope
    set?: PropertyWhereUniqueInput | PropertyWhereUniqueInput[]
    disconnect?: PropertyWhereUniqueInput | PropertyWhereUniqueInput[]
    delete?: PropertyWhereUniqueInput | PropertyWhereUniqueInput[]
    connect?: PropertyWhereUniqueInput | PropertyWhereUniqueInput[]
    update?: PropertyUpdateWithWhereUniqueWithoutOwnerInput | PropertyUpdateWithWhereUniqueWithoutOwnerInput[]
    updateMany?: PropertyUpdateManyWithWhereWithoutOwnerInput | PropertyUpdateManyWithWhereWithoutOwnerInput[]
    deleteMany?: PropertyScalarWhereInput | PropertyScalarWhereInput[]
  }

  export type PropertyUncheckedUpdateManyWithoutOwnerNestedInput = {
    create?: XOR<PropertyCreateWithoutOwnerInput, PropertyUncheckedCreateWithoutOwnerInput> | PropertyCreateWithoutOwnerInput[] | PropertyUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: PropertyCreateOrConnectWithoutOwnerInput | PropertyCreateOrConnectWithoutOwnerInput[]
    upsert?: PropertyUpsertWithWhereUniqueWithoutOwnerInput | PropertyUpsertWithWhereUniqueWithoutOwnerInput[]
    createMany?: PropertyCreateManyOwnerInputEnvelope
    set?: PropertyWhereUniqueInput | PropertyWhereUniqueInput[]
    disconnect?: PropertyWhereUniqueInput | PropertyWhereUniqueInput[]
    delete?: PropertyWhereUniqueInput | PropertyWhereUniqueInput[]
    connect?: PropertyWhereUniqueInput | PropertyWhereUniqueInput[]
    update?: PropertyUpdateWithWhereUniqueWithoutOwnerInput | PropertyUpdateWithWhereUniqueWithoutOwnerInput[]
    updateMany?: PropertyUpdateManyWithWhereWithoutOwnerInput | PropertyUpdateManyWithWhereWithoutOwnerInput[]
    deleteMany?: PropertyScalarWhereInput | PropertyScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutPropertiesInput = {
    create?: XOR<UserCreateWithoutPropertiesInput, UserUncheckedCreateWithoutPropertiesInput>
    connectOrCreate?: UserCreateOrConnectWithoutPropertiesInput
    connect?: UserWhereUniqueInput
  }

  export type MediaCreateNestedManyWithoutPropertyInput = {
    create?: XOR<MediaCreateWithoutPropertyInput, MediaUncheckedCreateWithoutPropertyInput> | MediaCreateWithoutPropertyInput[] | MediaUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: MediaCreateOrConnectWithoutPropertyInput | MediaCreateOrConnectWithoutPropertyInput[]
    createMany?: MediaCreateManyPropertyInputEnvelope
    connect?: MediaWhereUniqueInput | MediaWhereUniqueInput[]
  }

  export type MessageCreateNestedManyWithoutPropertyInput = {
    create?: XOR<MessageCreateWithoutPropertyInput, MessageUncheckedCreateWithoutPropertyInput> | MessageCreateWithoutPropertyInput[] | MessageUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutPropertyInput | MessageCreateOrConnectWithoutPropertyInput[]
    createMany?: MessageCreateManyPropertyInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type IcalFeedCreateNestedManyWithoutPropertyInput = {
    create?: XOR<IcalFeedCreateWithoutPropertyInput, IcalFeedUncheckedCreateWithoutPropertyInput> | IcalFeedCreateWithoutPropertyInput[] | IcalFeedUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: IcalFeedCreateOrConnectWithoutPropertyInput | IcalFeedCreateOrConnectWithoutPropertyInput[]
    createMany?: IcalFeedCreateManyPropertyInputEnvelope
    connect?: IcalFeedWhereUniqueInput | IcalFeedWhereUniqueInput[]
  }

  export type BookingCreateNestedManyWithoutPropertyInput = {
    create?: XOR<BookingCreateWithoutPropertyInput, BookingUncheckedCreateWithoutPropertyInput> | BookingCreateWithoutPropertyInput[] | BookingUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutPropertyInput | BookingCreateOrConnectWithoutPropertyInput[]
    createMany?: BookingCreateManyPropertyInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type MediaUncheckedCreateNestedManyWithoutPropertyInput = {
    create?: XOR<MediaCreateWithoutPropertyInput, MediaUncheckedCreateWithoutPropertyInput> | MediaCreateWithoutPropertyInput[] | MediaUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: MediaCreateOrConnectWithoutPropertyInput | MediaCreateOrConnectWithoutPropertyInput[]
    createMany?: MediaCreateManyPropertyInputEnvelope
    connect?: MediaWhereUniqueInput | MediaWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutPropertyInput = {
    create?: XOR<MessageCreateWithoutPropertyInput, MessageUncheckedCreateWithoutPropertyInput> | MessageCreateWithoutPropertyInput[] | MessageUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutPropertyInput | MessageCreateOrConnectWithoutPropertyInput[]
    createMany?: MessageCreateManyPropertyInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type IcalFeedUncheckedCreateNestedManyWithoutPropertyInput = {
    create?: XOR<IcalFeedCreateWithoutPropertyInput, IcalFeedUncheckedCreateWithoutPropertyInput> | IcalFeedCreateWithoutPropertyInput[] | IcalFeedUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: IcalFeedCreateOrConnectWithoutPropertyInput | IcalFeedCreateOrConnectWithoutPropertyInput[]
    createMany?: IcalFeedCreateManyPropertyInputEnvelope
    connect?: IcalFeedWhereUniqueInput | IcalFeedWhereUniqueInput[]
  }

  export type BookingUncheckedCreateNestedManyWithoutPropertyInput = {
    create?: XOR<BookingCreateWithoutPropertyInput, BookingUncheckedCreateWithoutPropertyInput> | BookingCreateWithoutPropertyInput[] | BookingUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutPropertyInput | BookingCreateOrConnectWithoutPropertyInput[]
    createMany?: BookingCreateManyPropertyInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type UserUpdateOneRequiredWithoutPropertiesNestedInput = {
    create?: XOR<UserCreateWithoutPropertiesInput, UserUncheckedCreateWithoutPropertiesInput>
    connectOrCreate?: UserCreateOrConnectWithoutPropertiesInput
    upsert?: UserUpsertWithoutPropertiesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPropertiesInput, UserUpdateWithoutPropertiesInput>, UserUncheckedUpdateWithoutPropertiesInput>
  }

  export type MediaUpdateManyWithoutPropertyNestedInput = {
    create?: XOR<MediaCreateWithoutPropertyInput, MediaUncheckedCreateWithoutPropertyInput> | MediaCreateWithoutPropertyInput[] | MediaUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: MediaCreateOrConnectWithoutPropertyInput | MediaCreateOrConnectWithoutPropertyInput[]
    upsert?: MediaUpsertWithWhereUniqueWithoutPropertyInput | MediaUpsertWithWhereUniqueWithoutPropertyInput[]
    createMany?: MediaCreateManyPropertyInputEnvelope
    set?: MediaWhereUniqueInput | MediaWhereUniqueInput[]
    disconnect?: MediaWhereUniqueInput | MediaWhereUniqueInput[]
    delete?: MediaWhereUniqueInput | MediaWhereUniqueInput[]
    connect?: MediaWhereUniqueInput | MediaWhereUniqueInput[]
    update?: MediaUpdateWithWhereUniqueWithoutPropertyInput | MediaUpdateWithWhereUniqueWithoutPropertyInput[]
    updateMany?: MediaUpdateManyWithWhereWithoutPropertyInput | MediaUpdateManyWithWhereWithoutPropertyInput[]
    deleteMany?: MediaScalarWhereInput | MediaScalarWhereInput[]
  }

  export type MessageUpdateManyWithoutPropertyNestedInput = {
    create?: XOR<MessageCreateWithoutPropertyInput, MessageUncheckedCreateWithoutPropertyInput> | MessageCreateWithoutPropertyInput[] | MessageUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutPropertyInput | MessageCreateOrConnectWithoutPropertyInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutPropertyInput | MessageUpsertWithWhereUniqueWithoutPropertyInput[]
    createMany?: MessageCreateManyPropertyInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutPropertyInput | MessageUpdateWithWhereUniqueWithoutPropertyInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutPropertyInput | MessageUpdateManyWithWhereWithoutPropertyInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type IcalFeedUpdateManyWithoutPropertyNestedInput = {
    create?: XOR<IcalFeedCreateWithoutPropertyInput, IcalFeedUncheckedCreateWithoutPropertyInput> | IcalFeedCreateWithoutPropertyInput[] | IcalFeedUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: IcalFeedCreateOrConnectWithoutPropertyInput | IcalFeedCreateOrConnectWithoutPropertyInput[]
    upsert?: IcalFeedUpsertWithWhereUniqueWithoutPropertyInput | IcalFeedUpsertWithWhereUniqueWithoutPropertyInput[]
    createMany?: IcalFeedCreateManyPropertyInputEnvelope
    set?: IcalFeedWhereUniqueInput | IcalFeedWhereUniqueInput[]
    disconnect?: IcalFeedWhereUniqueInput | IcalFeedWhereUniqueInput[]
    delete?: IcalFeedWhereUniqueInput | IcalFeedWhereUniqueInput[]
    connect?: IcalFeedWhereUniqueInput | IcalFeedWhereUniqueInput[]
    update?: IcalFeedUpdateWithWhereUniqueWithoutPropertyInput | IcalFeedUpdateWithWhereUniqueWithoutPropertyInput[]
    updateMany?: IcalFeedUpdateManyWithWhereWithoutPropertyInput | IcalFeedUpdateManyWithWhereWithoutPropertyInput[]
    deleteMany?: IcalFeedScalarWhereInput | IcalFeedScalarWhereInput[]
  }

  export type BookingUpdateManyWithoutPropertyNestedInput = {
    create?: XOR<BookingCreateWithoutPropertyInput, BookingUncheckedCreateWithoutPropertyInput> | BookingCreateWithoutPropertyInput[] | BookingUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutPropertyInput | BookingCreateOrConnectWithoutPropertyInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutPropertyInput | BookingUpsertWithWhereUniqueWithoutPropertyInput[]
    createMany?: BookingCreateManyPropertyInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutPropertyInput | BookingUpdateWithWhereUniqueWithoutPropertyInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutPropertyInput | BookingUpdateManyWithWhereWithoutPropertyInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type MediaUncheckedUpdateManyWithoutPropertyNestedInput = {
    create?: XOR<MediaCreateWithoutPropertyInput, MediaUncheckedCreateWithoutPropertyInput> | MediaCreateWithoutPropertyInput[] | MediaUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: MediaCreateOrConnectWithoutPropertyInput | MediaCreateOrConnectWithoutPropertyInput[]
    upsert?: MediaUpsertWithWhereUniqueWithoutPropertyInput | MediaUpsertWithWhereUniqueWithoutPropertyInput[]
    createMany?: MediaCreateManyPropertyInputEnvelope
    set?: MediaWhereUniqueInput | MediaWhereUniqueInput[]
    disconnect?: MediaWhereUniqueInput | MediaWhereUniqueInput[]
    delete?: MediaWhereUniqueInput | MediaWhereUniqueInput[]
    connect?: MediaWhereUniqueInput | MediaWhereUniqueInput[]
    update?: MediaUpdateWithWhereUniqueWithoutPropertyInput | MediaUpdateWithWhereUniqueWithoutPropertyInput[]
    updateMany?: MediaUpdateManyWithWhereWithoutPropertyInput | MediaUpdateManyWithWhereWithoutPropertyInput[]
    deleteMany?: MediaScalarWhereInput | MediaScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutPropertyNestedInput = {
    create?: XOR<MessageCreateWithoutPropertyInput, MessageUncheckedCreateWithoutPropertyInput> | MessageCreateWithoutPropertyInput[] | MessageUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutPropertyInput | MessageCreateOrConnectWithoutPropertyInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutPropertyInput | MessageUpsertWithWhereUniqueWithoutPropertyInput[]
    createMany?: MessageCreateManyPropertyInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutPropertyInput | MessageUpdateWithWhereUniqueWithoutPropertyInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutPropertyInput | MessageUpdateManyWithWhereWithoutPropertyInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type IcalFeedUncheckedUpdateManyWithoutPropertyNestedInput = {
    create?: XOR<IcalFeedCreateWithoutPropertyInput, IcalFeedUncheckedCreateWithoutPropertyInput> | IcalFeedCreateWithoutPropertyInput[] | IcalFeedUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: IcalFeedCreateOrConnectWithoutPropertyInput | IcalFeedCreateOrConnectWithoutPropertyInput[]
    upsert?: IcalFeedUpsertWithWhereUniqueWithoutPropertyInput | IcalFeedUpsertWithWhereUniqueWithoutPropertyInput[]
    createMany?: IcalFeedCreateManyPropertyInputEnvelope
    set?: IcalFeedWhereUniqueInput | IcalFeedWhereUniqueInput[]
    disconnect?: IcalFeedWhereUniqueInput | IcalFeedWhereUniqueInput[]
    delete?: IcalFeedWhereUniqueInput | IcalFeedWhereUniqueInput[]
    connect?: IcalFeedWhereUniqueInput | IcalFeedWhereUniqueInput[]
    update?: IcalFeedUpdateWithWhereUniqueWithoutPropertyInput | IcalFeedUpdateWithWhereUniqueWithoutPropertyInput[]
    updateMany?: IcalFeedUpdateManyWithWhereWithoutPropertyInput | IcalFeedUpdateManyWithWhereWithoutPropertyInput[]
    deleteMany?: IcalFeedScalarWhereInput | IcalFeedScalarWhereInput[]
  }

  export type BookingUncheckedUpdateManyWithoutPropertyNestedInput = {
    create?: XOR<BookingCreateWithoutPropertyInput, BookingUncheckedCreateWithoutPropertyInput> | BookingCreateWithoutPropertyInput[] | BookingUncheckedCreateWithoutPropertyInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutPropertyInput | BookingCreateOrConnectWithoutPropertyInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutPropertyInput | BookingUpsertWithWhereUniqueWithoutPropertyInput[]
    createMany?: BookingCreateManyPropertyInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutPropertyInput | BookingUpdateWithWhereUniqueWithoutPropertyInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutPropertyInput | BookingUpdateManyWithWhereWithoutPropertyInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type PropertyCreateNestedOneWithoutMediaInput = {
    create?: XOR<PropertyCreateWithoutMediaInput, PropertyUncheckedCreateWithoutMediaInput>
    connectOrCreate?: PropertyCreateOrConnectWithoutMediaInput
    connect?: PropertyWhereUniqueInput
  }

  export type EnumMediaTypeFieldUpdateOperationsInput = {
    set?: $Enums.MediaType
  }

  export type PropertyUpdateOneRequiredWithoutMediaNestedInput = {
    create?: XOR<PropertyCreateWithoutMediaInput, PropertyUncheckedCreateWithoutMediaInput>
    connectOrCreate?: PropertyCreateOrConnectWithoutMediaInput
    upsert?: PropertyUpsertWithoutMediaInput
    connect?: PropertyWhereUniqueInput
    update?: XOR<XOR<PropertyUpdateToOneWithWhereWithoutMediaInput, PropertyUpdateWithoutMediaInput>, PropertyUncheckedUpdateWithoutMediaInput>
  }

  export type PropertyCreateNestedOneWithoutMessagesInput = {
    create?: XOR<PropertyCreateWithoutMessagesInput, PropertyUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: PropertyCreateOrConnectWithoutMessagesInput
    connect?: PropertyWhereUniqueInput
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type PropertyUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<PropertyCreateWithoutMessagesInput, PropertyUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: PropertyCreateOrConnectWithoutMessagesInput
    upsert?: PropertyUpsertWithoutMessagesInput
    connect?: PropertyWhereUniqueInput
    update?: XOR<XOR<PropertyUpdateToOneWithWhereWithoutMessagesInput, PropertyUpdateWithoutMessagesInput>, PropertyUncheckedUpdateWithoutMessagesInput>
  }

  export type PropertyCreateNestedOneWithoutIcalFeedsInput = {
    create?: XOR<PropertyCreateWithoutIcalFeedsInput, PropertyUncheckedCreateWithoutIcalFeedsInput>
    connectOrCreate?: PropertyCreateOrConnectWithoutIcalFeedsInput
    connect?: PropertyWhereUniqueInput
  }

  export type BookingCreateNestedManyWithoutIcalFeedInput = {
    create?: XOR<BookingCreateWithoutIcalFeedInput, BookingUncheckedCreateWithoutIcalFeedInput> | BookingCreateWithoutIcalFeedInput[] | BookingUncheckedCreateWithoutIcalFeedInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutIcalFeedInput | BookingCreateOrConnectWithoutIcalFeedInput[]
    createMany?: BookingCreateManyIcalFeedInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type BookingUncheckedCreateNestedManyWithoutIcalFeedInput = {
    create?: XOR<BookingCreateWithoutIcalFeedInput, BookingUncheckedCreateWithoutIcalFeedInput> | BookingCreateWithoutIcalFeedInput[] | BookingUncheckedCreateWithoutIcalFeedInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutIcalFeedInput | BookingCreateOrConnectWithoutIcalFeedInput[]
    createMany?: BookingCreateManyIcalFeedInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type PropertyUpdateOneRequiredWithoutIcalFeedsNestedInput = {
    create?: XOR<PropertyCreateWithoutIcalFeedsInput, PropertyUncheckedCreateWithoutIcalFeedsInput>
    connectOrCreate?: PropertyCreateOrConnectWithoutIcalFeedsInput
    upsert?: PropertyUpsertWithoutIcalFeedsInput
    connect?: PropertyWhereUniqueInput
    update?: XOR<XOR<PropertyUpdateToOneWithWhereWithoutIcalFeedsInput, PropertyUpdateWithoutIcalFeedsInput>, PropertyUncheckedUpdateWithoutIcalFeedsInput>
  }

  export type BookingUpdateManyWithoutIcalFeedNestedInput = {
    create?: XOR<BookingCreateWithoutIcalFeedInput, BookingUncheckedCreateWithoutIcalFeedInput> | BookingCreateWithoutIcalFeedInput[] | BookingUncheckedCreateWithoutIcalFeedInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutIcalFeedInput | BookingCreateOrConnectWithoutIcalFeedInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutIcalFeedInput | BookingUpsertWithWhereUniqueWithoutIcalFeedInput[]
    createMany?: BookingCreateManyIcalFeedInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutIcalFeedInput | BookingUpdateWithWhereUniqueWithoutIcalFeedInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutIcalFeedInput | BookingUpdateManyWithWhereWithoutIcalFeedInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type BookingUncheckedUpdateManyWithoutIcalFeedNestedInput = {
    create?: XOR<BookingCreateWithoutIcalFeedInput, BookingUncheckedCreateWithoutIcalFeedInput> | BookingCreateWithoutIcalFeedInput[] | BookingUncheckedCreateWithoutIcalFeedInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutIcalFeedInput | BookingCreateOrConnectWithoutIcalFeedInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutIcalFeedInput | BookingUpsertWithWhereUniqueWithoutIcalFeedInput[]
    createMany?: BookingCreateManyIcalFeedInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutIcalFeedInput | BookingUpdateWithWhereUniqueWithoutIcalFeedInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutIcalFeedInput | BookingUpdateManyWithWhereWithoutIcalFeedInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type PropertyCreateNestedOneWithoutBookingsInput = {
    create?: XOR<PropertyCreateWithoutBookingsInput, PropertyUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: PropertyCreateOrConnectWithoutBookingsInput
    connect?: PropertyWhereUniqueInput
  }

  export type IcalFeedCreateNestedOneWithoutBookingsInput = {
    create?: XOR<IcalFeedCreateWithoutBookingsInput, IcalFeedUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: IcalFeedCreateOrConnectWithoutBookingsInput
    connect?: IcalFeedWhereUniqueInput
  }

  export type PropertyUpdateOneRequiredWithoutBookingsNestedInput = {
    create?: XOR<PropertyCreateWithoutBookingsInput, PropertyUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: PropertyCreateOrConnectWithoutBookingsInput
    upsert?: PropertyUpsertWithoutBookingsInput
    connect?: PropertyWhereUniqueInput
    update?: XOR<XOR<PropertyUpdateToOneWithWhereWithoutBookingsInput, PropertyUpdateWithoutBookingsInput>, PropertyUncheckedUpdateWithoutBookingsInput>
  }

  export type IcalFeedUpdateOneWithoutBookingsNestedInput = {
    create?: XOR<IcalFeedCreateWithoutBookingsInput, IcalFeedUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: IcalFeedCreateOrConnectWithoutBookingsInput
    upsert?: IcalFeedUpsertWithoutBookingsInput
    disconnect?: IcalFeedWhereInput | boolean
    delete?: IcalFeedWhereInput | boolean
    connect?: IcalFeedWhereUniqueInput
    update?: XOR<XOR<IcalFeedUpdateToOneWithWhereWithoutBookingsInput, IcalFeedUpdateWithoutBookingsInput>, IcalFeedUncheckedUpdateWithoutBookingsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumMediaTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.MediaType | EnumMediaTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MediaType[] | ListEnumMediaTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MediaType[] | ListEnumMediaTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMediaTypeFilter<$PrismaModel> | $Enums.MediaType
  }

  export type NestedEnumMediaTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MediaType | EnumMediaTypeFieldRefInput<$PrismaModel>
    in?: $Enums.MediaType[] | ListEnumMediaTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.MediaType[] | ListEnumMediaTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumMediaTypeWithAggregatesFilter<$PrismaModel> | $Enums.MediaType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumMediaTypeFilter<$PrismaModel>
    _max?: NestedEnumMediaTypeFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type PropertyCreateWithoutOwnerInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    createdAt?: Date | string
    media?: MediaCreateNestedManyWithoutPropertyInput
    messages?: MessageCreateNestedManyWithoutPropertyInput
    icalFeeds?: IcalFeedCreateNestedManyWithoutPropertyInput
    bookings?: BookingCreateNestedManyWithoutPropertyInput
  }

  export type PropertyUncheckedCreateWithoutOwnerInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    createdAt?: Date | string
    media?: MediaUncheckedCreateNestedManyWithoutPropertyInput
    messages?: MessageUncheckedCreateNestedManyWithoutPropertyInput
    icalFeeds?: IcalFeedUncheckedCreateNestedManyWithoutPropertyInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPropertyInput
  }

  export type PropertyCreateOrConnectWithoutOwnerInput = {
    where: PropertyWhereUniqueInput
    create: XOR<PropertyCreateWithoutOwnerInput, PropertyUncheckedCreateWithoutOwnerInput>
  }

  export type PropertyCreateManyOwnerInputEnvelope = {
    data: PropertyCreateManyOwnerInput | PropertyCreateManyOwnerInput[]
    skipDuplicates?: boolean
  }

  export type PropertyUpsertWithWhereUniqueWithoutOwnerInput = {
    where: PropertyWhereUniqueInput
    update: XOR<PropertyUpdateWithoutOwnerInput, PropertyUncheckedUpdateWithoutOwnerInput>
    create: XOR<PropertyCreateWithoutOwnerInput, PropertyUncheckedCreateWithoutOwnerInput>
  }

  export type PropertyUpdateWithWhereUniqueWithoutOwnerInput = {
    where: PropertyWhereUniqueInput
    data: XOR<PropertyUpdateWithoutOwnerInput, PropertyUncheckedUpdateWithoutOwnerInput>
  }

  export type PropertyUpdateManyWithWhereWithoutOwnerInput = {
    where: PropertyScalarWhereInput
    data: XOR<PropertyUpdateManyMutationInput, PropertyUncheckedUpdateManyWithoutOwnerInput>
  }

  export type PropertyScalarWhereInput = {
    AND?: PropertyScalarWhereInput | PropertyScalarWhereInput[]
    OR?: PropertyScalarWhereInput[]
    NOT?: PropertyScalarWhereInput | PropertyScalarWhereInput[]
    id?: StringFilter<"Property"> | string
    slug?: StringFilter<"Property"> | string
    titleEs?: StringFilter<"Property"> | string
    titleEn?: StringFilter<"Property"> | string
    titleFr?: StringFilter<"Property"> | string
    descEs?: StringFilter<"Property"> | string
    descEn?: StringFilter<"Property"> | string
    descFr?: StringFilter<"Property"> | string
    address?: StringFilter<"Property"> | string
    city?: StringFilter<"Property"> | string
    maxGuests?: IntFilter<"Property"> | number
    bedrooms?: IntFilter<"Property"> | number
    bathrooms?: FloatFilter<"Property"> | number
    published?: BoolFilter<"Property"> | boolean
    ownerId?: StringFilter<"Property"> | string
    createdAt?: DateTimeFilter<"Property"> | Date | string
  }

  export type UserCreateWithoutPropertiesInput = {
    id?: string
    email: string
    name: string
    role?: $Enums.Role
    createdAt?: Date | string
  }

  export type UserUncheckedCreateWithoutPropertiesInput = {
    id?: string
    email: string
    name: string
    role?: $Enums.Role
    createdAt?: Date | string
  }

  export type UserCreateOrConnectWithoutPropertiesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPropertiesInput, UserUncheckedCreateWithoutPropertiesInput>
  }

  export type MediaCreateWithoutPropertyInput = {
    id?: string
    url: string
    type?: $Enums.MediaType
    order?: number
  }

  export type MediaUncheckedCreateWithoutPropertyInput = {
    id?: string
    url: string
    type?: $Enums.MediaType
    order?: number
  }

  export type MediaCreateOrConnectWithoutPropertyInput = {
    where: MediaWhereUniqueInput
    create: XOR<MediaCreateWithoutPropertyInput, MediaUncheckedCreateWithoutPropertyInput>
  }

  export type MediaCreateManyPropertyInputEnvelope = {
    data: MediaCreateManyPropertyInput | MediaCreateManyPropertyInput[]
    skipDuplicates?: boolean
  }

  export type MessageCreateWithoutPropertyInput = {
    id?: string
    name: string
    email: string
    phone?: string | null
    lang?: string
    body: string
    startDate?: Date | string | null
    endDate?: Date | string | null
    read?: boolean
    createdAt?: Date | string
  }

  export type MessageUncheckedCreateWithoutPropertyInput = {
    id?: string
    name: string
    email: string
    phone?: string | null
    lang?: string
    body: string
    startDate?: Date | string | null
    endDate?: Date | string | null
    read?: boolean
    createdAt?: Date | string
  }

  export type MessageCreateOrConnectWithoutPropertyInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutPropertyInput, MessageUncheckedCreateWithoutPropertyInput>
  }

  export type MessageCreateManyPropertyInputEnvelope = {
    data: MessageCreateManyPropertyInput | MessageCreateManyPropertyInput[]
    skipDuplicates?: boolean
  }

  export type IcalFeedCreateWithoutPropertyInput = {
    id?: string
    url: string
    source?: string
    lastSyncedAt?: Date | string | null
    bookings?: BookingCreateNestedManyWithoutIcalFeedInput
  }

  export type IcalFeedUncheckedCreateWithoutPropertyInput = {
    id?: string
    url: string
    source?: string
    lastSyncedAt?: Date | string | null
    bookings?: BookingUncheckedCreateNestedManyWithoutIcalFeedInput
  }

  export type IcalFeedCreateOrConnectWithoutPropertyInput = {
    where: IcalFeedWhereUniqueInput
    create: XOR<IcalFeedCreateWithoutPropertyInput, IcalFeedUncheckedCreateWithoutPropertyInput>
  }

  export type IcalFeedCreateManyPropertyInputEnvelope = {
    data: IcalFeedCreateManyPropertyInput | IcalFeedCreateManyPropertyInput[]
    skipDuplicates?: boolean
  }

  export type BookingCreateWithoutPropertyInput = {
    id?: string
    startDate: Date | string
    endDate: Date | string
    source?: string
    createdAt?: Date | string
    icalFeed?: IcalFeedCreateNestedOneWithoutBookingsInput
  }

  export type BookingUncheckedCreateWithoutPropertyInput = {
    id?: string
    icalFeedId?: string | null
    startDate: Date | string
    endDate: Date | string
    source?: string
    createdAt?: Date | string
  }

  export type BookingCreateOrConnectWithoutPropertyInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutPropertyInput, BookingUncheckedCreateWithoutPropertyInput>
  }

  export type BookingCreateManyPropertyInputEnvelope = {
    data: BookingCreateManyPropertyInput | BookingCreateManyPropertyInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutPropertiesInput = {
    update: XOR<UserUpdateWithoutPropertiesInput, UserUncheckedUpdateWithoutPropertiesInput>
    create: XOR<UserCreateWithoutPropertiesInput, UserUncheckedCreateWithoutPropertiesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPropertiesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPropertiesInput, UserUncheckedUpdateWithoutPropertiesInput>
  }

  export type UserUpdateWithoutPropertiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateWithoutPropertiesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MediaUpsertWithWhereUniqueWithoutPropertyInput = {
    where: MediaWhereUniqueInput
    update: XOR<MediaUpdateWithoutPropertyInput, MediaUncheckedUpdateWithoutPropertyInput>
    create: XOR<MediaCreateWithoutPropertyInput, MediaUncheckedCreateWithoutPropertyInput>
  }

  export type MediaUpdateWithWhereUniqueWithoutPropertyInput = {
    where: MediaWhereUniqueInput
    data: XOR<MediaUpdateWithoutPropertyInput, MediaUncheckedUpdateWithoutPropertyInput>
  }

  export type MediaUpdateManyWithWhereWithoutPropertyInput = {
    where: MediaScalarWhereInput
    data: XOR<MediaUpdateManyMutationInput, MediaUncheckedUpdateManyWithoutPropertyInput>
  }

  export type MediaScalarWhereInput = {
    AND?: MediaScalarWhereInput | MediaScalarWhereInput[]
    OR?: MediaScalarWhereInput[]
    NOT?: MediaScalarWhereInput | MediaScalarWhereInput[]
    id?: StringFilter<"Media"> | string
    propertyId?: StringFilter<"Media"> | string
    url?: StringFilter<"Media"> | string
    type?: EnumMediaTypeFilter<"Media"> | $Enums.MediaType
    order?: IntFilter<"Media"> | number
  }

  export type MessageUpsertWithWhereUniqueWithoutPropertyInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutPropertyInput, MessageUncheckedUpdateWithoutPropertyInput>
    create: XOR<MessageCreateWithoutPropertyInput, MessageUncheckedCreateWithoutPropertyInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutPropertyInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutPropertyInput, MessageUncheckedUpdateWithoutPropertyInput>
  }

  export type MessageUpdateManyWithWhereWithoutPropertyInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutPropertyInput>
  }

  export type MessageScalarWhereInput = {
    AND?: MessageScalarWhereInput | MessageScalarWhereInput[]
    OR?: MessageScalarWhereInput[]
    NOT?: MessageScalarWhereInput | MessageScalarWhereInput[]
    id?: StringFilter<"Message"> | string
    propertyId?: StringFilter<"Message"> | string
    name?: StringFilter<"Message"> | string
    email?: StringFilter<"Message"> | string
    phone?: StringNullableFilter<"Message"> | string | null
    lang?: StringFilter<"Message"> | string
    body?: StringFilter<"Message"> | string
    startDate?: DateTimeNullableFilter<"Message"> | Date | string | null
    endDate?: DateTimeNullableFilter<"Message"> | Date | string | null
    read?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
  }

  export type IcalFeedUpsertWithWhereUniqueWithoutPropertyInput = {
    where: IcalFeedWhereUniqueInput
    update: XOR<IcalFeedUpdateWithoutPropertyInput, IcalFeedUncheckedUpdateWithoutPropertyInput>
    create: XOR<IcalFeedCreateWithoutPropertyInput, IcalFeedUncheckedCreateWithoutPropertyInput>
  }

  export type IcalFeedUpdateWithWhereUniqueWithoutPropertyInput = {
    where: IcalFeedWhereUniqueInput
    data: XOR<IcalFeedUpdateWithoutPropertyInput, IcalFeedUncheckedUpdateWithoutPropertyInput>
  }

  export type IcalFeedUpdateManyWithWhereWithoutPropertyInput = {
    where: IcalFeedScalarWhereInput
    data: XOR<IcalFeedUpdateManyMutationInput, IcalFeedUncheckedUpdateManyWithoutPropertyInput>
  }

  export type IcalFeedScalarWhereInput = {
    AND?: IcalFeedScalarWhereInput | IcalFeedScalarWhereInput[]
    OR?: IcalFeedScalarWhereInput[]
    NOT?: IcalFeedScalarWhereInput | IcalFeedScalarWhereInput[]
    id?: StringFilter<"IcalFeed"> | string
    propertyId?: StringFilter<"IcalFeed"> | string
    url?: StringFilter<"IcalFeed"> | string
    source?: StringFilter<"IcalFeed"> | string
    lastSyncedAt?: DateTimeNullableFilter<"IcalFeed"> | Date | string | null
  }

  export type BookingUpsertWithWhereUniqueWithoutPropertyInput = {
    where: BookingWhereUniqueInput
    update: XOR<BookingUpdateWithoutPropertyInput, BookingUncheckedUpdateWithoutPropertyInput>
    create: XOR<BookingCreateWithoutPropertyInput, BookingUncheckedCreateWithoutPropertyInput>
  }

  export type BookingUpdateWithWhereUniqueWithoutPropertyInput = {
    where: BookingWhereUniqueInput
    data: XOR<BookingUpdateWithoutPropertyInput, BookingUncheckedUpdateWithoutPropertyInput>
  }

  export type BookingUpdateManyWithWhereWithoutPropertyInput = {
    where: BookingScalarWhereInput
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyWithoutPropertyInput>
  }

  export type BookingScalarWhereInput = {
    AND?: BookingScalarWhereInput | BookingScalarWhereInput[]
    OR?: BookingScalarWhereInput[]
    NOT?: BookingScalarWhereInput | BookingScalarWhereInput[]
    id?: StringFilter<"Booking"> | string
    propertyId?: StringFilter<"Booking"> | string
    icalFeedId?: StringNullableFilter<"Booking"> | string | null
    startDate?: DateTimeFilter<"Booking"> | Date | string
    endDate?: DateTimeFilter<"Booking"> | Date | string
    source?: StringFilter<"Booking"> | string
    createdAt?: DateTimeFilter<"Booking"> | Date | string
  }

  export type PropertyCreateWithoutMediaInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    createdAt?: Date | string
    owner: UserCreateNestedOneWithoutPropertiesInput
    messages?: MessageCreateNestedManyWithoutPropertyInput
    icalFeeds?: IcalFeedCreateNestedManyWithoutPropertyInput
    bookings?: BookingCreateNestedManyWithoutPropertyInput
  }

  export type PropertyUncheckedCreateWithoutMediaInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    ownerId: string
    createdAt?: Date | string
    messages?: MessageUncheckedCreateNestedManyWithoutPropertyInput
    icalFeeds?: IcalFeedUncheckedCreateNestedManyWithoutPropertyInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPropertyInput
  }

  export type PropertyCreateOrConnectWithoutMediaInput = {
    where: PropertyWhereUniqueInput
    create: XOR<PropertyCreateWithoutMediaInput, PropertyUncheckedCreateWithoutMediaInput>
  }

  export type PropertyUpsertWithoutMediaInput = {
    update: XOR<PropertyUpdateWithoutMediaInput, PropertyUncheckedUpdateWithoutMediaInput>
    create: XOR<PropertyCreateWithoutMediaInput, PropertyUncheckedCreateWithoutMediaInput>
    where?: PropertyWhereInput
  }

  export type PropertyUpdateToOneWithWhereWithoutMediaInput = {
    where?: PropertyWhereInput
    data: XOR<PropertyUpdateWithoutMediaInput, PropertyUncheckedUpdateWithoutMediaInput>
  }

  export type PropertyUpdateWithoutMediaInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneRequiredWithoutPropertiesNestedInput
    messages?: MessageUpdateManyWithoutPropertyNestedInput
    icalFeeds?: IcalFeedUpdateManyWithoutPropertyNestedInput
    bookings?: BookingUpdateManyWithoutPropertyNestedInput
  }

  export type PropertyUncheckedUpdateWithoutMediaInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    ownerId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: MessageUncheckedUpdateManyWithoutPropertyNestedInput
    icalFeeds?: IcalFeedUncheckedUpdateManyWithoutPropertyNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPropertyNestedInput
  }

  export type PropertyCreateWithoutMessagesInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    createdAt?: Date | string
    owner: UserCreateNestedOneWithoutPropertiesInput
    media?: MediaCreateNestedManyWithoutPropertyInput
    icalFeeds?: IcalFeedCreateNestedManyWithoutPropertyInput
    bookings?: BookingCreateNestedManyWithoutPropertyInput
  }

  export type PropertyUncheckedCreateWithoutMessagesInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    ownerId: string
    createdAt?: Date | string
    media?: MediaUncheckedCreateNestedManyWithoutPropertyInput
    icalFeeds?: IcalFeedUncheckedCreateNestedManyWithoutPropertyInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPropertyInput
  }

  export type PropertyCreateOrConnectWithoutMessagesInput = {
    where: PropertyWhereUniqueInput
    create: XOR<PropertyCreateWithoutMessagesInput, PropertyUncheckedCreateWithoutMessagesInput>
  }

  export type PropertyUpsertWithoutMessagesInput = {
    update: XOR<PropertyUpdateWithoutMessagesInput, PropertyUncheckedUpdateWithoutMessagesInput>
    create: XOR<PropertyCreateWithoutMessagesInput, PropertyUncheckedCreateWithoutMessagesInput>
    where?: PropertyWhereInput
  }

  export type PropertyUpdateToOneWithWhereWithoutMessagesInput = {
    where?: PropertyWhereInput
    data: XOR<PropertyUpdateWithoutMessagesInput, PropertyUncheckedUpdateWithoutMessagesInput>
  }

  export type PropertyUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneRequiredWithoutPropertiesNestedInput
    media?: MediaUpdateManyWithoutPropertyNestedInput
    icalFeeds?: IcalFeedUpdateManyWithoutPropertyNestedInput
    bookings?: BookingUpdateManyWithoutPropertyNestedInput
  }

  export type PropertyUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    ownerId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    media?: MediaUncheckedUpdateManyWithoutPropertyNestedInput
    icalFeeds?: IcalFeedUncheckedUpdateManyWithoutPropertyNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPropertyNestedInput
  }

  export type PropertyCreateWithoutIcalFeedsInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    createdAt?: Date | string
    owner: UserCreateNestedOneWithoutPropertiesInput
    media?: MediaCreateNestedManyWithoutPropertyInput
    messages?: MessageCreateNestedManyWithoutPropertyInput
    bookings?: BookingCreateNestedManyWithoutPropertyInput
  }

  export type PropertyUncheckedCreateWithoutIcalFeedsInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    ownerId: string
    createdAt?: Date | string
    media?: MediaUncheckedCreateNestedManyWithoutPropertyInput
    messages?: MessageUncheckedCreateNestedManyWithoutPropertyInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPropertyInput
  }

  export type PropertyCreateOrConnectWithoutIcalFeedsInput = {
    where: PropertyWhereUniqueInput
    create: XOR<PropertyCreateWithoutIcalFeedsInput, PropertyUncheckedCreateWithoutIcalFeedsInput>
  }

  export type BookingCreateWithoutIcalFeedInput = {
    id?: string
    startDate: Date | string
    endDate: Date | string
    source?: string
    createdAt?: Date | string
    property: PropertyCreateNestedOneWithoutBookingsInput
  }

  export type BookingUncheckedCreateWithoutIcalFeedInput = {
    id?: string
    propertyId: string
    startDate: Date | string
    endDate: Date | string
    source?: string
    createdAt?: Date | string
  }

  export type BookingCreateOrConnectWithoutIcalFeedInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutIcalFeedInput, BookingUncheckedCreateWithoutIcalFeedInput>
  }

  export type BookingCreateManyIcalFeedInputEnvelope = {
    data: BookingCreateManyIcalFeedInput | BookingCreateManyIcalFeedInput[]
    skipDuplicates?: boolean
  }

  export type PropertyUpsertWithoutIcalFeedsInput = {
    update: XOR<PropertyUpdateWithoutIcalFeedsInput, PropertyUncheckedUpdateWithoutIcalFeedsInput>
    create: XOR<PropertyCreateWithoutIcalFeedsInput, PropertyUncheckedCreateWithoutIcalFeedsInput>
    where?: PropertyWhereInput
  }

  export type PropertyUpdateToOneWithWhereWithoutIcalFeedsInput = {
    where?: PropertyWhereInput
    data: XOR<PropertyUpdateWithoutIcalFeedsInput, PropertyUncheckedUpdateWithoutIcalFeedsInput>
  }

  export type PropertyUpdateWithoutIcalFeedsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneRequiredWithoutPropertiesNestedInput
    media?: MediaUpdateManyWithoutPropertyNestedInput
    messages?: MessageUpdateManyWithoutPropertyNestedInput
    bookings?: BookingUpdateManyWithoutPropertyNestedInput
  }

  export type PropertyUncheckedUpdateWithoutIcalFeedsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    ownerId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    media?: MediaUncheckedUpdateManyWithoutPropertyNestedInput
    messages?: MessageUncheckedUpdateManyWithoutPropertyNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPropertyNestedInput
  }

  export type BookingUpsertWithWhereUniqueWithoutIcalFeedInput = {
    where: BookingWhereUniqueInput
    update: XOR<BookingUpdateWithoutIcalFeedInput, BookingUncheckedUpdateWithoutIcalFeedInput>
    create: XOR<BookingCreateWithoutIcalFeedInput, BookingUncheckedCreateWithoutIcalFeedInput>
  }

  export type BookingUpdateWithWhereUniqueWithoutIcalFeedInput = {
    where: BookingWhereUniqueInput
    data: XOR<BookingUpdateWithoutIcalFeedInput, BookingUncheckedUpdateWithoutIcalFeedInput>
  }

  export type BookingUpdateManyWithWhereWithoutIcalFeedInput = {
    where: BookingScalarWhereInput
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyWithoutIcalFeedInput>
  }

  export type PropertyCreateWithoutBookingsInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    createdAt?: Date | string
    owner: UserCreateNestedOneWithoutPropertiesInput
    media?: MediaCreateNestedManyWithoutPropertyInput
    messages?: MessageCreateNestedManyWithoutPropertyInput
    icalFeeds?: IcalFeedCreateNestedManyWithoutPropertyInput
  }

  export type PropertyUncheckedCreateWithoutBookingsInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    ownerId: string
    createdAt?: Date | string
    media?: MediaUncheckedCreateNestedManyWithoutPropertyInput
    messages?: MessageUncheckedCreateNestedManyWithoutPropertyInput
    icalFeeds?: IcalFeedUncheckedCreateNestedManyWithoutPropertyInput
  }

  export type PropertyCreateOrConnectWithoutBookingsInput = {
    where: PropertyWhereUniqueInput
    create: XOR<PropertyCreateWithoutBookingsInput, PropertyUncheckedCreateWithoutBookingsInput>
  }

  export type IcalFeedCreateWithoutBookingsInput = {
    id?: string
    url: string
    source?: string
    lastSyncedAt?: Date | string | null
    property: PropertyCreateNestedOneWithoutIcalFeedsInput
  }

  export type IcalFeedUncheckedCreateWithoutBookingsInput = {
    id?: string
    propertyId: string
    url: string
    source?: string
    lastSyncedAt?: Date | string | null
  }

  export type IcalFeedCreateOrConnectWithoutBookingsInput = {
    where: IcalFeedWhereUniqueInput
    create: XOR<IcalFeedCreateWithoutBookingsInput, IcalFeedUncheckedCreateWithoutBookingsInput>
  }

  export type PropertyUpsertWithoutBookingsInput = {
    update: XOR<PropertyUpdateWithoutBookingsInput, PropertyUncheckedUpdateWithoutBookingsInput>
    create: XOR<PropertyCreateWithoutBookingsInput, PropertyUncheckedCreateWithoutBookingsInput>
    where?: PropertyWhereInput
  }

  export type PropertyUpdateToOneWithWhereWithoutBookingsInput = {
    where?: PropertyWhereInput
    data: XOR<PropertyUpdateWithoutBookingsInput, PropertyUncheckedUpdateWithoutBookingsInput>
  }

  export type PropertyUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneRequiredWithoutPropertiesNestedInput
    media?: MediaUpdateManyWithoutPropertyNestedInput
    messages?: MessageUpdateManyWithoutPropertyNestedInput
    icalFeeds?: IcalFeedUpdateManyWithoutPropertyNestedInput
  }

  export type PropertyUncheckedUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    ownerId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    media?: MediaUncheckedUpdateManyWithoutPropertyNestedInput
    messages?: MessageUncheckedUpdateManyWithoutPropertyNestedInput
    icalFeeds?: IcalFeedUncheckedUpdateManyWithoutPropertyNestedInput
  }

  export type IcalFeedUpsertWithoutBookingsInput = {
    update: XOR<IcalFeedUpdateWithoutBookingsInput, IcalFeedUncheckedUpdateWithoutBookingsInput>
    create: XOR<IcalFeedCreateWithoutBookingsInput, IcalFeedUncheckedCreateWithoutBookingsInput>
    where?: IcalFeedWhereInput
  }

  export type IcalFeedUpdateToOneWithWhereWithoutBookingsInput = {
    where?: IcalFeedWhereInput
    data: XOR<IcalFeedUpdateWithoutBookingsInput, IcalFeedUncheckedUpdateWithoutBookingsInput>
  }

  export type IcalFeedUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    property?: PropertyUpdateOneRequiredWithoutIcalFeedsNestedInput
  }

  export type IcalFeedUncheckedUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PropertyCreateManyOwnerInput = {
    id?: string
    slug: string
    titleEs: string
    titleEn: string
    titleFr: string
    descEs: string
    descEn: string
    descFr: string
    address: string
    city: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    published?: boolean
    createdAt?: Date | string
  }

  export type PropertyUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    media?: MediaUpdateManyWithoutPropertyNestedInput
    messages?: MessageUpdateManyWithoutPropertyNestedInput
    icalFeeds?: IcalFeedUpdateManyWithoutPropertyNestedInput
    bookings?: BookingUpdateManyWithoutPropertyNestedInput
  }

  export type PropertyUncheckedUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    media?: MediaUncheckedUpdateManyWithoutPropertyNestedInput
    messages?: MessageUncheckedUpdateManyWithoutPropertyNestedInput
    icalFeeds?: IcalFeedUncheckedUpdateManyWithoutPropertyNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPropertyNestedInput
  }

  export type PropertyUncheckedUpdateManyWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    titleEs?: StringFieldUpdateOperationsInput | string
    titleEn?: StringFieldUpdateOperationsInput | string
    titleFr?: StringFieldUpdateOperationsInput | string
    descEs?: StringFieldUpdateOperationsInput | string
    descEn?: StringFieldUpdateOperationsInput | string
    descFr?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    maxGuests?: IntFieldUpdateOperationsInput | number
    bedrooms?: IntFieldUpdateOperationsInput | number
    bathrooms?: FloatFieldUpdateOperationsInput | number
    published?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MediaCreateManyPropertyInput = {
    id?: string
    url: string
    type?: $Enums.MediaType
    order?: number
  }

  export type MessageCreateManyPropertyInput = {
    id?: string
    name: string
    email: string
    phone?: string | null
    lang?: string
    body: string
    startDate?: Date | string | null
    endDate?: Date | string | null
    read?: boolean
    createdAt?: Date | string
  }

  export type IcalFeedCreateManyPropertyInput = {
    id?: string
    url: string
    source?: string
    lastSyncedAt?: Date | string | null
  }

  export type BookingCreateManyPropertyInput = {
    id?: string
    icalFeedId?: string | null
    startDate: Date | string
    endDate: Date | string
    source?: string
    createdAt?: Date | string
  }

  export type MediaUpdateWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    type?: EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType
    order?: IntFieldUpdateOperationsInput | number
  }

  export type MediaUncheckedUpdateWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    type?: EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType
    order?: IntFieldUpdateOperationsInput | number
  }

  export type MediaUncheckedUpdateManyWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    type?: EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType
    order?: IntFieldUpdateOperationsInput | number
  }

  export type MessageUpdateWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    lang?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    read?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    lang?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    read?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    lang?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    read?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IcalFeedUpdateWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bookings?: BookingUpdateManyWithoutIcalFeedNestedInput
  }

  export type IcalFeedUncheckedUpdateWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    bookings?: BookingUncheckedUpdateManyWithoutIcalFeedNestedInput
  }

  export type IcalFeedUncheckedUpdateManyWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type BookingUpdateWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    icalFeed?: IcalFeedUpdateOneWithoutBookingsNestedInput
  }

  export type BookingUncheckedUpdateWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    icalFeedId?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUncheckedUpdateManyWithoutPropertyInput = {
    id?: StringFieldUpdateOperationsInput | string
    icalFeedId?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingCreateManyIcalFeedInput = {
    id?: string
    propertyId: string
    startDate: Date | string
    endDate: Date | string
    source?: string
    createdAt?: Date | string
  }

  export type BookingUpdateWithoutIcalFeedInput = {
    id?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    property?: PropertyUpdateOneRequiredWithoutBookingsNestedInput
  }

  export type BookingUncheckedUpdateWithoutIcalFeedInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUncheckedUpdateManyWithoutIcalFeedInput = {
    id?: StringFieldUpdateOperationsInput | string
    propertyId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}