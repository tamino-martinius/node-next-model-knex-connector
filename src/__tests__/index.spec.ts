import Knex from 'knex';
import {
  NextModel,
  ConnectorConstructor,
  Filter,
} from '@next-model/core';
import NextModelKnexConnector from '..';

import {
  context,
  Connection,
  FilterSpecGroup,
} from './types';

import faker from 'faker';

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
    connection = <Connection>{
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

  static get connector(): ConnectorConstructor<UserSchema> {
    return connector;
  }
};

let user1: Partial<UserSchema>;
let user2: Partial<UserSchema>;
let user3: Partial<UserSchema>;

async function cleanDb(): Promise<Knex.SchemaBuilder> {
  user1 = user2 = user3 = undefined;

  return connector.knex.schema.dropTableIfExists('users');
};

function seedTable(): Promise<Knex.SchemaBuilder> {
  return Promise.resolve().then(() => {
    return connector.knex.schema.createTable('users', (table) => {
      table.increments('id');
      table.string('name');
      table.integer('age');
    });
  });
};

async function seedData() {
  user1 = (await new User({ name: 'foo', age: 18 }).save()).attributes;
  user2 = (await new User({ name: null, age: 21 }).save()).attributes;
  user3 = (await new User({ name: 'bar', age: 21 }).save()).attributes;
  return [user1, user2, user3];
};

async function seedDb(): Promise<Knex.SchemaBuilder> {
  await seedTable();
  await seedData();
};

afterEach(cleanDb);


describe('NextModelKnexConnector', () => {
  describe('#query', () => {
    let Klass: typeof User = User;
    const subject = () => connector.query(Klass);

    it('throws error', () => {
      expect(subject).toThrow('test');
    });

    context('with seeded table', {
      definitions() {
        seedTable();
      },
      tests() {
        expect(subject()).toEqual([]);
      }
    });

    context('with seeded data', {
      definitions() {
        seedDb();
      },
      tests() {
        expect(subject()).toEqual([user1, user2, user3]);
      }
    });
  });
});
