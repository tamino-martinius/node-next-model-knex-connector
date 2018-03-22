import Knex from 'knex';
import NextModel, { Connector } from '@next-model/core';
import NextModelKnexConnector from '..';

import {
  context,
  Connection,
} from './types';

const client = process.env.DB || 'sqlite3';
const isOracle = client === 'oracledb';
let connection: Connection = { filename: ':memory:' };
switch (process.env.DB) {
  case 'mysql': {
    connection = {
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'test_mysql',
    };
    break;
  }
  case 'mysql2': {
    connection = {
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'test_mysql2',
    };
    break;
  }
  case 'postgres': {
    connection = {
      host: '127.0.0.1',
      database: 'test_postgres',
    };
    break;
  }
  case 'oracledb': {
    connection = {
      user: 'travis',
      password: 'travis',
      connectString: "localhost/XE",
      stmtCacheSize: 0,
    };
    break;
  }
}

const config: Knex.Config = {
  client,
  connection,
  useNullAsDefault: true,
};

interface UserSchema {
  id: number;
  name: string;
  age: number;
};

const connector = new NextModelKnexConnector<UserSchema>(config);

class User extends NextModel<UserSchema>() {
  static get modelName() {
    return 'User';
  }

  static get schema() {
    return {
      id: { type: 'integer' },
      name: { type: 'string' },
      age: { type: 'integer' },
    };
  }
};

let user1: User;
let user2: User;
let user3: User;

async function cleanDb(): Promise<Knex.SchemaBuilder> {
  user1 = user2 = user3 = undefined;
  return connector.knex.schema.dropTableIfExists('users');
};

async function seedTable(): Promise<Knex.SchemaBuilder> {
  return connector.knex.schema.createTable('users', (table) => {
    table.increments('id');
    table.string('name');
    table.integer('age');
  });
};

async function seedData() {
  user1 = await new User({ name: 'foo', age: 18 }).save();
  user2 = await new User({ name: 'foo', age: 21 }).save();
  user3 = await new User({ name: 'bar', age: 21 }).save();
  return
};

async function seedDb(): Promise<Knex.SchemaBuilder> {
  await seedTable();
  await seedData();
}

beforeEach(cleanDb);

