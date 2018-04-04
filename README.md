# KnexConnector

SQL connector for [NextModel](https://github.com/tamino-martinius/node-next-model) package using [Knex](http://knexjs.org/). [![Build Status](https://travis-ci.org/tamino-martinius/node-next-model-knex-connector.svg?branch=master)](https://travis-ci.org/tamino-martinius/node-next-model-knex-connector)

Allows you to use **Knex** as Database Connector for NextModel:

Supports:

* pg
* sqlite3
* mysql
* mysql2
* mariasql (**not** tested)
* strong-oracle (**not** tested)
* oracle
* mssql (**not** tested)

## Roadmap / Where can i contribute

See [GitHub](https://github.com/tamino-martinius/node-next-model-knex-connector/projects/1) project for current progress/tasks

* Fix Typos
* CI is missing for some Databases
* Add more **examples**
* Add **exists**, **join** and **subqueries**
* There are already some **tests**, but not every test case is covered.

## TOC

* [Example](#example)
  * [Create Connector](#create-connector)
  * [Use Connector](#use-connector)
* [Build Queries](#build-queries)
  * [query](#query)
  * [find](#find)
  * [And](#and)
  * [Or](#or)
  * [Not](#not)
  * [Nesting](#nesting)
  * [Null](#null)
  * [NotNull](#notnull)
  * [Equation](#equation)
  * [In](#in)
  * [NotIn](#notin)
  * [Between](#between)
  * [NotBetween](#notbetween)
  * [Raw](#raw)
  * [Execute](#execute)
* [Changelog](#changelog)

## Example

### Create Connector

Constructor options are passed to [Knex](http://knexjs.org/).

Its recommended to set `useNullAsDefault` to true unless all model attributes are set.

The client parameter is required and determines which client adapter will be used with the library.

The connection options are passed directly to the appropriate database client to create the connection, and may be either an object, or a connection string

~~~js
import KnexConnector from '@next-model/knex-connector';

const connector = new KnexConnector({
  client: 'mysql',
  connection: {
    host : '127.0.0.1',
    user : 'your_database_user',
    password : 'your_database_password',
    database : 'myapp_test'
  },
});
~~~

~~~js
import KnexConnector from '@next-model/knex-connector';

const connector = new KnexConnector({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
  searchPath: 'knex,public'
});
~~~

_Note: When you use the SQLite3 adapter, there is a filename required, not a network connection. For example:_

~~~js
import KnexConnector from '@next-model/knex-connector';

const connector = new KnexConnector({
  client: 'sqlite3',
  connection: {
    filename: "./mydb.sqlite"
  }
});
~~~

### Use Connector

The connector is used to connect your models to a database.

~~~js
const User = class User extends NextModel<UserSchema>() {
  static get connector() {
    return connector;
  }

  static get modelName() {
    return 'User';
  }

  static get schema() {
    return {
      id: { type: 'integer' },
      name: { type: 'string' },
    };
  }
}
~~~

Create an base model with the connector to use it with multiple models.

~~~js
function BaseModel<T extends Identifiable>() {
  return class extends NextModel<T>() {
    static get connector() {
      return new Connector<T>();
    }
  }
};

const User = class User extends BaseModel<UserSchema>() {
  static get modelName() {
    return 'User';
  }

  static get schema() {
    return {
      id: { type: 'integer' },
      name: { type: 'string' },
    };
  }
}

const Address = class Address extends BaseModel<AddressSchema>() {
  static get modelName() {
    return 'Address';
  }

  static get schema() {
    return {
      id: { type: 'integer' },
      street: { type: 'string' },
    };
  }
}
~~~

## Build Queries

This connector uses Knex to query SQL databases, but the query syntax is different from the Knex documentation. Samples of possible queries are listed below.

### Query

An object passed to `query` will filter for object property and value.

~~~js
User.query({ name: 'foo' });
~~~

~~~sql
select "users".* from "users" where ("name" = 'foo')
~~~

If the Object has multiple properties the properties are connected with `and`.

~~~js
User.query({ name: 'foo', age: 18 });
~~~

~~~sql
select "users".* from "users" where ("name" = 'foo' and "age" = 18)
~~~

An `query` connected with another `query`. A second query will encapsulate the query on the topmost layer.

~~~js
User.query({ name: 'foo', age: 18 }).query({ name: 'bar' });
~~~

~~~sql
select "users".* from "users" where (("name" = 'foo' and "age" = 18) and ("name" = 'bar'))
~~~

### And

Special properties are starting with an `$` sign. The `$and` property connects all values which are passed as `Array` with an SQL `and` operator.

~~~js
User.query({ $and: [
  { name: 'foo' },
]});
~~~

~~~sql
select "users".* from "users" where (("name" = 'foo'))
~~~

~~~js
User.query({ $and: [
  { name: 'foo' },
  { age: 18 },
]});
~~~

~~~sql
select "users".* from "users" where (("name" = 'foo') and ("age" = 18))
~~~

The special properties can also chained with other `where` queries.

~~~js
User.query({ $and: [
  { name: 'foo' },
  { age: 18 },
]}).query({ $and: [
  { name: 'bar' },
  { age: 21 },
]});
~~~

~~~sql
select "users".* from "users" where ((("name" = 'foo') and ("age" = 18)) and (("name" = 'bar') and ("age" = 21)))
~~~

### Or

The `$or` property works similar to the `$and` property and connects all values with `or`.

~~~js
User.query({ $or: [
  { name: 'foo' },
]});
~~~

~~~sql
select "users".* from "users" where (("name" = 'foo'))
~~~

~~~js
User.query({ $or: [
  { name: 'foo' },
  { name: 'bar' },
]});
~~~

~~~sql
select "users".* from "users" where (("name" = 'foo') or ("name" = 'bar'))
~~~

~~~js
User.query({ $or: [
  { name: 'foo' },
  { age: 18 },
]}).query({ $or: [
  { name: 'bar' },
  { age: 21 },
]});
~~~

~~~sql
select "users".* from "users" where ((("name" = 'foo') or ("age" = 18)) and (("name" = 'bar') or ("age" = 21)))
~~~

### Not

The child object of an `$not` property will be inverted.

~~~js
User.query({ $not: {
  name: 'foo'
}});
~~~

~~~sql
select "users".* from "users" where (not ("name" = 'foo'))
~~~

~~~js
User.query({ $not: {
  name: 'foo',
  age: 18,
}});
~~~

~~~sql
select "users".* from "users" where (not ("name" = 'foo' and "age" = 18))
~~~

~~~js
User.query({ $not: {
  name: 'foo',
  age: 18,
}}).query({ $not: {
  name: 'bar',
  age: 21,
}});
~~~

~~~sql
select "users".* from "users" where ((not ("name" = 'foo' and "age" = 18)) and (not ("name" = 'bar' and "age" = 21)))
~~~

### Nesting

The `$and`, `$or` and `$not` properties can be nested as deeply as needed.

~~~js
User.query({ $not: {
  $or: [
    { name: 'foo' },
    { age: 21 },
  ],
}});
~~~

~~~sql
select "users".* from "users" where (not (("name" = 'foo') or ("age" = 21)))
~~~

~~~js
User.query({ $not: {
  $and: [
    { name: 'foo' },
    { $or: [
      { age: 18 },
      { age: 21 },
    ]},
  ],
}});
~~~

~~~sql
select "users".* from "users" where (not (("name" = 'foo') and (("age" = 18) or ("age" = 21))))
~~~

### Null

The `$null` property checks for unset columns and takes the column name as value.

~~~js
User.query({ $null: 'name' });
~~~

~~~sql
select "users".* from "users" where ("name" is null)
~~~

### NotNull

The `$notNull` property checks if an column is set and takes the column name as value.

~~~js
User.query({ $notNull: 'name' });
~~~

~~~sql
select "users".* from "users" where ("name" is not null)
~~~

### Equation

There are five different equation properties available.

* `$eq` checks for equal
* `$lt` checks for lower
* `$gt` checks for greater
* `$lte` checks for lower or equal
* `$gte` checks for greater or equal

The property needs to be an object as value with the column name as key and the equation as value.

~~~js
User.query({ $lt: { age: 18 } });
~~~

~~~sql
select "users".* from "users" where ("age" < 18)
~~~

~~~js
User.query({ $lte: { age: 18 } });
~~~

~~~sql
select "users".* from "users" where ("age" <= 18)
~~~

*Please note:* Just one propery is allowed!

This is invalid:

~~~js
User.query({ $lt: {
  age: 18,
  size: 180,
}});
~~~

This is valid:

~~~js
User.query({ $and: [
  { $lt: { age: 18 } },
  { $lt: { size: 180 } },
]});
~~~

~~~sql
select "users".* from "users" where ("age" < 18 and "size" < 180)
~~~

### In

The `$in` property needs an object as value with the column name as key and the `Array` of values as value.

~~~js
User.query({ $in: {
  name: ['foo', 'bar'],
}});
~~~

~~~sql
select "users".* from "users" where ("name" in ('foo', 'bar'))
~~~

*Please note:* Just one propery is allowed!

This is invalid:

~~~js
User.query({ $in: {
  name: ['foo', 'bar'],
  age: [18, 19, 20, 21],
}});
~~~

This is valid:

~~~js
User.query({ $and: [
  { $in: { name: ['foo', 'bar'] } },
  { $in: { age: [18, 19, 20, 21] } },
]});
~~~

~~~sql
select "users".* from "users" where ("name" in ('foo', 'bar') and "age" in (18, 19, 20, 21))
~~~

### NotIn

`$notIn` works same as `$in` but inverts the result.

~~~js
User.query({ $notIn: {
  name: ['foo', 'bar'],
}});
~~~

~~~sql
select "users".* from "users" where ("name" not in ('foo', 'bar'))
~~~

*Please note:* Just one propery is allowed!

This is invalid:

~~~js
User.query({ $notIn: {
  name: ['foo', 'bar'],
  age: [18, 19, 20, 21],
}});
~~~

This is valid:

~~~js
User.query({ $and: [
  { $notIn: { name: ['foo', 'bar'] } },
  { $notIn: { age: [18, 19, 20, 21] } },
]});
~~~

~~~sql
select "users".* from "users" where ("name" not in ('foo', 'bar') and "age" not in (18, 19, 20, 21))
~~~

### Between

The `$between` property needs an object as value with the column name as key and an  `Array` with the min and max values as value.

~~~js
User.query({ $between: {
  age: [18, 21],
}});
~~~

~~~sql
select "users".* from "users" where ("age" between 18 and 21)
~~~

*Please note:* Just one propery is allowed!

This is invalid:

~~~js
User.query({ $between: {
  age: [18, 21],
  size: [160, 185],
}});
~~~

This is valid:

~~~js
User.query({ $and: [
  { $between: { age: [18, 21] } },
  { $between: { size: [160, 185] } },
]});
~~~

~~~sql
select "users".* from "users" where ("age" between 18 and 21 and "size" between 160 and 165)
~~~

### NotBetween

`$notBetween` works same as `$between` but inverts the result.

~~~js
User.query({ $notBetween: {
  age: [18, 21],
}});
~~~

~~~sql
select "users".* from "users" where ("age" not between 18 and 21)
~~~

*Please note:* Just one propery is allowed!

This is invalid:

~~~js
User.query({ $notBetween: {
  age: [18, 21],
  size: [160, 185],
}});
~~~

This is valid:

~~~js
User.query({ $and: [
  { $notBetween: { age: [18, 21] } },
  { $notBetween: { size: [160, 185] } },
]});
~~~

~~~sql
select "users".* from "users" where ("age" not between 18 and 21 and "size" not between 160 and 165)
~~~

### Raw

The `$raw` property allows to write custom and database specific queries. Pass queries as object, where key is the query and value are the bindings.

_Note: See [Knex documentation](http://knexjs.org/#Raw-Bindings) for more details about bindings._

~~~js
User.query({ $raw: {
  $query: 'age = ?',
  $bindings: 18,
}});
~~~

~~~js
User.query({ $raw: {
  $query: 'age = :age',
  $bindings: { age: 18 },
}});
~~~

~~~sql
select "users".* from "users" where ("age" = 18)
~~~

## Changelog

See [history](HISTORY.md) for more details.

* `1.0.0` **2018-xx-xx** Complete rewrite based on TypeScript
* `0.3.3` **2017-04-05** Updated next-model dependency
* `0.3.2` **2017-02-28** Updated next-model dependency
* `0.3.1` **2017-02-27** Updated next-model dependency
* `0.3.0` **2017-02-22** Added Node 4 Support
* `0.2.0` **2017-02-21** Added new query types
* `0.1.0` **2017-02-18** Used next-model from npm instead of Github repo
* `0.0.4` **2017-02-16** Updated to NextModel v0.0.4
* `0.0.3` **2017-02-12** Added CI
* `0.0.2` **2017-02-12** Added more complex query types
* `0.0.1` **2017-02-05** First release compatible with NextModel 0.0.1
