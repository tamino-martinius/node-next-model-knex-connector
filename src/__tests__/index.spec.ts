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
  id: number;
  name: string;
  age: number;

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

const randomIndex = faker.random.number(2);
const validId = () => [user1, user2, user3][randomIndex].id;

const filterSpecGroups: FilterSpecGroup = {
  'none': [
    { filter: () => ({}), results: () => ([user1.id, user2.id, user3.id]) },
  ],
  'property': [
    { filter: () => ({ id: validId() }), results: () => ([validId()]) },
    { filter: () => ({ id: user1.id, name: 'foo' }), results: () => ([user1.id]) },
    { filter: () => ({ id: user1.id, name: 'bar' }), results: () => ([]) },
    { filter: () => ({ age: 21 }), results: () => ([user2.id, user3.id]) },
    { filter: () => ({ id: 0 }), results: () => ([]) },
  ],
  '$and': [
    { filter: () => ({ $and: [] }), results: () => ([user1.id, user2.id, user3.id]) },
    { filter: () => ({ $and: [{ id: validId() }] }), results: () => ([validId()]) },
    { filter: () => ({ $and: [{ id: user2.id }, { id: user3.id }] }), results: () => ([]) },
    { filter: () => ({ $and: [{ id: user2.id }, { id: user2.id }] }), results: () => ([user2.id]) },
  ],
  '$not': [
    { filter: () => ({ $not: {} }), results: () => ([user1.id, user2.id, user3.id]) },
    { filter: () => ({ $not: { id: user2.id } }), results: () => ([user1.id, user3.id]) },
    { filter: () => ({ $not: { id: 0 } }), results: () => ([user1.id, user2.id, user3.id]) },
  ],
  '$or': [
    { filter: () => ({ $or: [] }), results: () => ([user1.id, user2.id, user3.id]) },
    { filter: () => ({ $or: [{ id: validId() }] }), results: () => ([validId()]) },
    { filter: () => ({ $or: [{ id: user2.id }, { id: user3.id }] }), results: () => ([user2.id, user3.id]) },
    { filter: () => ({ $or: [{ id: user2.id }, { id: user2.id }] }), results: () => ([user2.id]) },
  ],
  '$in': [
    { filter: () => ({ $in: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $in: { id: [validId()] } }), results: () => ([validId()]) },
    { filter: () => ({ $in: { id: [user2.id, user3.id] } }), results: () => ([user2.id, user3.id]) },
    { filter: () => ({ $in: { id: [user2.id, user2.id] } }), results: () => ([user2.id]) },
    { filter: () => ({ $in: { id: [user1.id], name: ['foo'] } }), results: '[TODO] Return proper error' },
  ],
  '$notIn': [
    { filter: () => ({ $notIn: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $notIn: { id: [user2.id] } }), results: () => ([user1.id, user3.id]) },
    { filter: () => ({ $notIn: { id: [user2.id, user3.id] } }), results: () => ([user1.id]) },
    { filter: () => ({ $notIn: { id: [user2.id, user2.id] } }), results: () => ([user1.id, user3.id]) },
    { filter: () => ({ $notIn: { id: [user1.id], name: ['foo'] } }), results: '[TODO] Return proper error' },
  ],
  '$null': [
    { filter: () => ({ $null: 'name' }), results: () => ([user2.id]) },
    { filter: () => ({ $null: 'id' }), results: () => ([]) },
    { filter: () => ({ $null: 'bar' }), results: 'SQLITE_ERROR: no such column: bar' },
  ],
  '$notNull': [
    { filter: () => ({ $notNull: 'name' }), results: () => ([user1.id, user3.id]) },
    { filter: () => ({ $notNull: 'id' }), results: () => ([user1.id, user2.id, user3.id]) },
    { filter: () => ({ $notNull: 'bar' }), results: 'SQLITE_ERROR: no such column: bar' },
  ],
  '$between': [
    { filter: () => ({ $between: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $between: { id: { from: user1.id, to: user2.id } } }), results: () => ([user1.id, user2.id]) },
    { filter: () => ({ $between: { name: { from: 'a', to: 'z' } } }), results: () => ([user1.id, user3.id]) },
    { filter: () => ({ $between: { age: { from: 20, to: 30 } } }), results: () => ([user2.id, user3.id]) },
    { filter: () => ({ $between: { id: { from: 0, to: user1.id } } }), results: () => ([user1.id]) },
    { filter: () => ({ $between: { id: { from: user3.id, to: 4 } } }), results: () => ([user3.id]) },
    { filter: () => ({ $between: { id: { from: validId(), to: validId() } } }), results: () => ([validId()]) },
    { filter: () => ({ $between: { age: { from: 30, to: 40 } } }), results: () => ([]) },
    { filter: () => ({ $between: { id: { from: user3.id, to: user1.id } } }), results: () => ([]) },
    { filter: () => ({ $between: { id: { from: user1.id, to: user3.id }, name: { from: 'a', to: 'z' } } }), results: '[TODO] Return proper error' },
  ],
  '$gt': [
    { filter: () => ({ $gt: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $gt: { id: user2.id } }), results: () => ([user3.id]) },
    { filter: () => ({ $gt: { age: 21 } }), results: () => ([]) },
    { filter: () => ({ $gt: { age: 20 } }), results: () => ([user2.id, user3.id]) },
    { filter: () => ({ $gt: { id: 0 } }), results: () => ([user1.id, user2.id, user3.id]) },
    { filter: () => ({ $gt: { id: user1.id, name: 'a' } }), results: '[TODO] Return proper error' },
  ],
  '$gte': [
    { filter: () => ({ $gte: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $gte: { id: user2.id } }), results: () => ([user2.id, user3.id]) },
    { filter: () => ({ $gte: { name: 'z' } }), results: () => ([]) },
    { filter: () => ({ $gte: { age: 21 } }), results: () => ([user2.id, user3.id]) },
    { filter: () => ({ $gte: { name: 'a' } }), results: () => ([user1.id, user3.id]) },
    { filter: () => ({ $gte: { id: 0 } }), results: () => ([user1.id, user2.id, user3.id]) },
    { filter: () => ({ $gte: { age: 30 } }), results: () => ([]) },
    { filter: () => ({ $gte: { id: user1.id, name: 'a' } }), results: '[TODO] Return proper error' },
  ],
  '$lt': [
    { filter: () => ({ $lt: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $lt: { id: user2.id } }), results: () => ([user1.id]) },
    { filter: () => ({ $lt: { name: 'bar' } }), results: () => ([]) },
    { filter: () => ({ $lt: { name: 'z' } }), results: () => ([user1.id, user3.id]) },
    { filter: () => ({ $lt: { age: 30 } }), results: () => ([user1.id, user2.id, user3.id]) },
    { filter: () => ({ $lt: { id: 0 } }), results: () => ([]) },
    { filter: () => ({ $lt: { id: user1.id, name: 'z' } }), results: '[TODO] Return proper error' },
  ],
  '$lte': [
    { filter: () => ({ $lte: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $lte: { id: user2.id } }), results: () => ([user1.id, user2.id]) },
    { filter: () => ({ $lte: { name: 'bar' } }), results: () => ([user3.id]) },
    { filter: () => ({ $lte: { age: 21 } }), results: () => ([user1.id, user2.id, user3.id]) },
    { filter: () => ({ $lte: { name: 'z' } }), results: () => ([user1.id, user3.id]) },
    { filter: () => ({ $lte: { age: 30 } }), results: () => ([user1.id, user2.id, user3.id]) },
    { filter: () => ({ $lte: { id: 0 } }), results: () => ([]) },
    { filter: () => ({ $lte: { id: user1.id, name: 'z' } }), results: '[TODO] Return proper error' },
  ],
};

describe('NextModelKnexConnector', () => {
  describe('#query(Klass)', () => {
    let Klass: typeof User = User;
    const subject = () => connector.query(Klass);

    it('rejects with error', async () => {
      try {
        const data = await subject();
        expect(true).toBeFalsy(); // Should not reach
      } catch (error) {
        expect(error.message).toContain('SQLITE_ERROR: no such table: users');
      }
    });
    context('with seeded table', {
      definitions: seedTable,
      tests() {
        it('promises empty array', async () => {
          const data = await subject();
          return expect(data).toEqual([]);
        });
      }
    });

    context('with seeded data', {
      definitions: seedDb,
      tests() {
        for (const groupName in filterSpecGroups) {
          describe(groupName + ' filter', () => {
            filterSpecGroups[groupName].forEach((filterSpec, index) => {
              context('with filter #' + (index + 1), {
                definitions() {
                  const filter: Filter<UserSchema> = <any>filterSpec.filter();
                  class NewKlass extends User {
                    static get filter(): Filter<UserSchema> {
                      return filter;
                    }
                  };
                  Klass = NewKlass;
                },
                tests() {
                  const results = filterSpec.results;
                  if (typeof results === 'function') {
                    it('promises all matching items as model instances', async () => {
                      const ids = (<any>filterSpec.results)();
                      const instances = await subject();
                      expect(instances.length).toEqual(ids.length);
                      if (ids.length > 0) {
                        expect(instances[0] instanceof Klass).toBeTruthy();
                      }
                      expect(instances.map(instance => instance.id))
                        .toEqual(ids);
                    });
                  } else {
                    it('rejects filter and returns error', async () => {
                      try {
                        await subject();
                        expect(true).toBeFalsy(); // Should not reach
                      } catch (error) {
                        if (error.message !== undefined) {
                          expect(error.message).toContain(results);
                        } else {
                          expect(error).toEqual(results);
                        }
                      }
                    });
                  }
                },
              });
            });
          });
        }
      }
    });
  });

  describe('#count(Klass)', () => {
    let Klass: typeof User = User;
    const subject = () => connector.count(Klass);

    it('rejects with error', async () => {
      try {
        const data = await subject();
        expect(true).toBeFalsy(); // Should not reach
      } catch (error) {
        expect(error.message).toContain('SQLITE_ERROR: no such table: users');
      }
    });
    context('with seeded table', {
      definitions: seedTable,
      tests() {
        it('promises a count of 0', async () => {
          const data = await subject();
          return expect(data).toEqual(0);
        });
      }
    });

    context('with seeded data', {
      definitions: seedDb,
      tests() {
        for (const groupName in filterSpecGroups) {
          describe(groupName + ' filter', () => {
            filterSpecGroups[groupName].forEach((filterSpec, index) => {
              context('with filter #' + (index + 1), {
                definitions() {
                  const filter: Filter<UserSchema> = <any>filterSpec.filter();
                  class NewKlass extends User {
                    static get filter(): Filter<UserSchema> {
                      return filter;
                    }
                  };
                  Klass = NewKlass;
                },
                tests() {
                  const results = filterSpec.results;
                  if (typeof results === 'function') {
                    it('returns count of matching records', async () => {
                      const ids = (<any>filterSpec.results)();
                      const count = await subject();
                      expect(count).toEqual(ids.length);
                    });
                  } else {
                    it('rejects filter and returns error', async () => {
                      try {
                        await subject();
                        expect(true).toBeFalsy(); // Should not reach
                      } catch (error) {
                        if (error.message !== undefined) {
                          expect(error.message).toContain(results);
                        } else {
                          expect(error).toEqual(results);
                        }
                      }
                    });
                  }
                },
              });
            });
          });
        }
      }
    });
  });

  describe('#updateAll(Klass, attrs)', () => {
    let Klass: typeof User = User;
    let attrs: Partial<UserSchema> = {
      name: 'updated',
    };
    const subject = () => connector.updateAll(Klass, attrs);

    it('rejects with error', async () => {
      try {
        const data = await subject();
        expect(true).toBeFalsy(); // Should not reach
      } catch (error) {
        expect(error.message).toContain('SQLITE_ERROR: no such table: users');
      }
    });
    context('with seeded table', {
      definitions: seedTable,
      tests() {
        it('promises a count of 0', async () => {
          const data = await subject();
          return expect(data).toEqual(0);
        });
      }
    });

    context('with seeded data', {
      definitions: seedDb,
      tests() {
        for (const groupName in filterSpecGroups) {
          describe(groupName + ' filter', () => {
            filterSpecGroups[groupName].forEach((filterSpec, index) => {
              context('with filter #' + (index + 1), {
                definitions() {
                  const filter: Filter<UserSchema> = <any>filterSpec.filter();
                  class NewKlass extends User {
                    static get filter(): Filter<UserSchema> {
                      return filter;
                    }
                  };
                  Klass = NewKlass;
                },
                tests() {
                  const results = filterSpec.results;
                  if (typeof results === 'function') {
                    it('returns count of matching records', async () => {
                      const ids = (<any>filterSpec.results)();
                      const count = await subject();
                      expect(count).toEqual(ids.length);
                      const instances = await connector.query(Klass);
                      for (const instance of instances) {
                        expect(instance.name).toEqual('updated');
                      }
                    });
                  } else {
                    it('rejects filter and returns error', async () => {
                      try {
                        await subject();
                        expect(true).toBeFalsy(); // Should not reach
                      } catch (error) {
                        if (error.message !== undefined) {
                          expect(error.message).toContain(results);
                        } else {
                          expect(error).toEqual(results);
                        }
                      }
                    });
                  }
                },
              });
            });
          });
        }
      }
    });
  });

  describe('#deleteAll(Klass)', () => {
    let Klass: typeof User = User;
    let attrs: Partial<UserSchema> = {
      name: 'updated',
    };
    const subject = () => connector.deleteAll(Klass);

    it('rejects with error', async () => {
      try {
        const data = await subject();
        expect(true).toBeFalsy(); // Should not reach
      } catch (error) {
        expect(error.message).toContain('SQLITE_ERROR: no such table: users');
      }
    });
    context('with seeded table', {
      definitions: seedTable,
      tests() {
        it('promises a count of 0', async () => {
          const data = await subject();
          return expect(data).toEqual(0);
        });
      }
    });

    context('with seeded data', {
      definitions: seedDb,
      tests() {
        for (const groupName in filterSpecGroups) {
          describe(groupName + ' filter', () => {
            filterSpecGroups[groupName].forEach((filterSpec, index) => {
              context('with filter #' + (index + 1), {
                definitions() {
                  const filter: Filter<UserSchema> = <any>filterSpec.filter();
                  class NewKlass extends User {
                    static get filter(): Filter<UserSchema> {
                      return filter;
                    }
                  };
                  Klass = NewKlass;
                },
                tests() {
                  const results = filterSpec.results;
                  if (typeof results === 'function') {
                    it('returns count of matching records', async () => {
                      const ids = (<any>filterSpec.results)();
                      const count = await subject();
                      expect(count).toEqual(ids.length);
                      const instances = await connector.query(Klass);
                      expect(instances.length).toEqual(0);
                    });
                  } else {
                    it('rejects filter and returns error', async () => {
                      try {
                        await subject();
                        expect(true).toBeFalsy(); // Should not reach
                      } catch (error) {
                        if (error.message !== undefined) {
                          expect(error.message).toContain(results);
                        } else {
                          expect(error).toEqual(results);
                        }
                      }
                    });
                  }
                },
              });
            });
          });
        }
      }
    });
  });
});
