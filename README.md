# NextModelKnexConnector

[Knex](http://knexjs.org/) connector for [NextModel](https://github.com/tamino-martinius/node-next-model) package.

Allows you to use **Knex** as Database Connector for NextModel:

Supports:
* pg (**manually** tested)
* sqlite3
* mysql (**not** tested)
* mysql2 (**not** tested)
* mariasql (**not** tested)
* strong-oracle (**not** tested)
* oracle (**not** tested)
* mssql (**not** tested)

### Roadmap / Where can i contribute
* Fix Typos
* CI/Tests are just set up for sqlite - others should be tested too
* Add more **examples**
* There are already some **tests**, but not every test case is covered.

## TOC
* [Example](#example)
  * [Create Connector](#create-connector)
  * [Use Connector](#use-connector)
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

## Changelog

See [history](TODO) for more details.

`0.0.1` `2017-??-??` First release compatible with NextModel 0.0.1
