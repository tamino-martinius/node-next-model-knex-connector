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
