# NextModelKnexConnector

SQL connector for [NextModel](https://github.com/tamino-martinius/node-next-model) package using [Knex](http://knexjs.org/). [![Build Status](https://travis-ci.org/tamino-martinius/node-next-model-knex-connector.svg?branch=master)](https://travis-ci.org/tamino-martinius/node-next-model-knex-connector)

Allows you to use **Knex** as Database Connector for NextModel:

Supports:
* pg
* sqlite3
* mysql
* mysql2
* mariasql (**not** tested)
* strong-oracle (**not** tested)
* oracle (**not** tested)
* mssql (**not** tested)

### Roadmap / Where can i contribute

* Fix Typos
* CI/Tests are just set up for sqlite - others should be tested too
* Add more **examples**
* Add **exists** and **raw** queries
* Add **join** and **subqueries**
* There are already some **tests**, but not every test case is covered.

## TOC

* [Example](#example)
  * [Create Connector](#create-connector)
  * [Use Connector](#use-connector)
* [Build Queries](#build-queries)
  * [Where](#where)
  * [And](#and)
  * [Or](#or)
  * [Not](#not)
  * [Nesting](#nesting)
  * [Null](#null)
  * [NotNull](#notnull)
  * [In](#in)
  * [NotIn](#notin)
  * [Between](#between)
  * [NotBetween](#notbetween)
* [Changelog](#changelog)

## Example

### Create Connector

Constructor options are passed to [Knex](http://knexjs.org/).

Its recommended to set `useNullAsDefault` to true unless all model attributes are set.

The client parameter is required and determines which client adapter will be used with the library.

The connection options are passed directly to the appropriate database client to create the connection, and may be either an object, or a connection string


~~~js
const connector = new NextModelKnexConnector({
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
const connector = new NextModelKnexConnector({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
  searchPath: 'knex,public'
});
~~~

_Note: When you use the SQLite3 adapter, there is a filename required, not a network connection. For example:_

~~~js
const connector = new NextModelKnexConnector({
  client: 'sqlite3',
  connection: {
    filename: "./mydb.sqlite"
  }
});
~~~

### Use Connector

The connector is used to connect your models to a database.

~~~js
const User = class User extends NextModel {
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
const BaseModel = class BaseModel extends NextModel {
  static get connector() {
    return connector;
  }
});

const User = class User extends BaseModel {
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

const Address = class Address extends BaseModel {
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

### Where

An object passed as `where` clause will query for object property and value.

~~~js
User.where({ name: 'foo' });
~~~
~~~sql
select "users".* from "users" where ("name" = 'foo')
~~~

If the Object has multiple properties the properties are connected with `and`.

~~~js
User.where({ name: 'foo', age: 18 });
~~~
~~~sql
select "users".* from "users" where ("name" = 'foo' and "age" = 18)
~~~

An `where` query can be connected with another `where` or an `orWhere`. A second query will encapsulate the query on the topmost layer.

~~~js
User.where({ name: 'foo', age: 18 }).orWhere({ name: 'bar' });
~~~
~~~sql
select "users".* from "users" where (("name" = 'foo' and "age" = 18) or ("name" = 'bar'))
~~~

### And

Special properties are starting with an `$` sign. The `$and` property connects all values which are passed as `Array` with an SQL `and` operator.

~~~js
User.where({ $and: [
  { name: 'foo' },
]});
~~~
~~~sql
select "users".* from "users" where (("name" = 'foo'))
~~~

~~~js
User.where({ $and: [
  { name: 'foo' },
  { age: 18 },
]});
~~~
~~~sql
select "users".* from "users" where (("name" = 'foo') and ("age" = 18))
~~~

The special properties can also chained with other `where` queries.

~~~js
User.where({ $and: [
  { name: 'foo' },
  { age: 18 },
]}).orWhere({ $and: [
  { name: 'bar' },
  { age: 21 },
]});
~~~
~~~sql
select "users".* from "users" where ((("name" = 'foo') and ("age" = 18)) or (("name" = 'bar') and ("age" = 21)))
~~~

### Or

The `$or` property works similar to the `$and` property and connects all values with `or`.

~~~js
User.where({ $or: [
  { name: 'foo' },
]});
~~~
~~~sql
select "users".* from "users" where (("name" = 'foo'))
~~~

~~~js
User.where({ $or: [
  { name: 'foo' },
  { name: 'bar' },
]});
~~~
~~~sql
select "users".* from "users" where (("name" = 'foo') or ("name" = 'bar'))
~~~

~~~js
User.where({ $or: [
  { name: 'foo' },
  { age: 18 },
]}).where({ $or: [
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
User.where({ $not: {
  name: 'foo'
}});
~~~
~~~sql
select "users".* from "users" where (not ("name" = 'foo'))
~~~

~~~js
User.where({ $not: {
  name: 'foo',
  age: 18,
}});
~~~
~~~sql
select "users".* from "users" where (not ("name" = 'foo' and "age" = 18))
~~~

~~~js
User.where({ $not: {
  name: 'foo',
  age: 18,
}}).where({ $not: {
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
User.where({ $not: {
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
User.where({ $not: {
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
User.where({ $null: 'name' });
~~~
~~~sql
select "users".* from "users" where ("name" is null)
~~~

### NotNull

The `$notNull` property checks if an column is set and takes the column name as value.

~~~js
User.where({ $notNull: 'name' });
~~~
~~~sql
select "users".* from "users" where ("name" is not null)
~~~

### In

The `$in` property needs an object as value with the column name as key and the `Array` of values as value.

~~~js
User.where({ $in: {
  name: ['foo', 'bar'],
}});
~~~
~~~sql
select "users".* from "users" where ("name" in ('foo', 'bar'))
~~~

If multiple properties are present they get connected by an `and` operator.

~~~js
User.where({ $in: {
  name: ['foo', 'bar'],
  age: [18, 19, 20, 21],
}});
~~~
~~~sql
select "users".* from "users" where ("name" in ('foo', 'bar') and "age" in (18, 19, 20, 21))
~~~

### NotIn

`$notIn` works same as `$in` but inverts the result.

~~~js
User.where({ $notIn: {
  name: ['foo', 'bar'],
}});
~~~
~~~sql
select "users".* from "users" where ("name" not in ('foo', 'bar'))
~~~

~~~js
User.where({ $notIn: {
  name: ['foo', 'bar'],
  age: [18, 19, 20, 21],
}});
~~~
~~~sql
select "users".* from "users" where ("name" not in ('foo', 'bar') and "age" not in (18, 19, 20, 21))
~~~

### Between

The `$between` property needs an object as value with the column name as key and an  `Array` with the min and max values as value.

~~~js
User.where({ $between: {
  age: [18, 21],
}});
~~~
~~~sql
select "users".* from "users" where ("age" between 18 and 21)
~~~

If multiple properties are present they get connected by an `and` operator.

~~~js
User.where({ $between: {
  age: [18, 21],
  size: [160, 185],
}});
~~~
~~~sql
select "users".* from "users" where ("age" between 18 and 21 and "size" between 160 and 165)
~~~

### NotBetween

`$notBetween` works same as `$between` but inverts the result.

~~~js
User.where({ $notBetween: {
  age: [18, 21],
}});
~~~
~~~sql
select "users".* from "users" where ("age" not between 18 and 21)
~~~

~~~js
User.where({ $notBetween: {
  age: [18, 21],
  size: [160, 185],
}});
~~~
~~~sql
select "users".* from "users" where ("age" not between 18 and 21 and "size" not between 160 and 165)
~~~

## Changelog

See [history](TODO) for more details.

* `0.0.1` **2017-02-05** First release compatible with NextModel 0.0.1
* `0.0.2` **2017-02-12** Added more complex query types
* `0.0.3` **2017-02-12** Added CI
* `0.0.4` **2017-02-16** Updated to NextModel v0.0.4
* `0.1.0` **2017-02-18** Used next-model from npm instead of Github repo
