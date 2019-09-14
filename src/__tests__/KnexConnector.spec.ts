import * as Knex from 'knex';

import { Model, Filter, OrderColumn, Dict } from '@next-model/core';

import { KnexConnector } from '..';

import { context, Connection, FilterSpecGroup } from '.';

import * as faker from 'faker';

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
      connectString: 'localhost/XE',
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

const connector = new KnexConnector(config);

const tableName = 'users';

class User extends Model({
  init: (props: { name: string | null; age: number }) => props,
  tableName,
  connector,
}) {}

let user1: User | undefined;
let user2: User | undefined;
let user3: User | undefined;

async function cleanDb(): Promise<void> {
  user1 = user2 = user3 = undefined;

  await connector.knex.schema.dropTableIfExists('users');
}

async function seedTable(): Promise<void> {
  await connector.knex.schema.dropTableIfExists('users');

  await connector.knex.schema.createTable('users', (table: Knex.CreateTableBuilder) => {
    table
      .increments('id')
      .primary()
      .unsigned();
    table.string('name');
    table.integer('age');
  });
}

async function seedData() {
  user1 = await User.create({ name: 'foo', age: 18 });
  user2 = await User.create({ name: null, age: 21 });
  user3 = await User.create({ name: 'bar', age: 21 });
  return [user1, user2, user3];
}

async function seedDb(): Promise<Knex.SchemaBuilder> {
  await seedTable();
  await seedData();
}

const idsOf = (items: Dict<any>[]) => items.map(item => item.id);

afterEach(cleanDb);

const randomIndex = faker.random.number(2);
const validUser = () => [user1, user2, user3][randomIndex] as User;
const validId = () => validUser().attributes.id;
const user1Id = () => (user1 ? user1.attributes.id : 0);
const user2Id = () => (user2 ? user2.attributes.id : 0);
const user3Id = () => (user3 ? user3.attributes.id : 0);

const filterSpecGroups: FilterSpecGroup = {
  none: [{ filter: () => ({}), results: () => [user1Id(), user2Id(), user3Id()] }],
  property: [
    { filter: () => ({ id: validId() }), results: () => [validId()] },
    { filter: () => ({ id: user1Id(), name: 'foo' }), results: () => [user1Id()] },
    { filter: () => ({ id: user1Id(), name: 'bar' }), results: () => [] },
    { filter: () => ({ age: 21 }), results: () => [user2Id(), user3Id()] },
    { filter: () => ({ id: 0 }), results: () => [] },
  ],
  $and: [
    { filter: () => ({ $and: [] }), results: () => [user1Id(), user2Id(), user3Id()] },
    { filter: () => ({ $and: [{ id: validId() }] }), results: () => [validId()] },
    { filter: () => ({ $and: [{ id: user2Id() }, { id: user3Id() }] }), results: () => [] },
    {
      filter: () => ({ $and: [{ id: user2Id() }, { id: user2Id() }] }),
      results: () => [user2Id()],
    },
  ],
  $not: [
    { filter: () => ({ $not: {} }), results: () => [user1Id(), user2Id(), user3Id()] },
    { filter: () => ({ $not: { id: user2Id() } }), results: () => [user1Id(), user3Id()] },
    { filter: () => ({ $not: { id: 0 } }), results: () => [user1Id(), user2Id(), user3Id()] },
  ],
  $or: [
    { filter: () => ({ $or: [] }), results: () => [user1Id(), user2Id(), user3Id()] },
    { filter: () => ({ $or: [{ id: validId() }] }), results: () => [validId()] },
    {
      filter: () => ({ $or: [{ id: user2Id() }, { id: user3Id() }] }),
      results: () => [user2Id(), user3Id()],
    },
    { filter: () => ({ $or: [{ id: user2Id() }, { id: user2Id() }] }), results: () => [user2Id()] },
  ],
  $in: [
    { filter: () => ({ $in: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $in: { id: [validId()] } }), results: () => [validId()] },
    {
      filter: () => ({ $in: { id: [user2Id(), user3Id()] } }),
      results: () => [user2Id(), user3Id()],
    },
    { filter: () => ({ $in: { id: [user2Id(), user2Id()] } }), results: () => [user2Id()] },
    {
      filter: () => ({ $in: { id: [user1Id()], name: ['foo'] } }),
      results: '[TODO] Return proper error',
    },
  ],
  $notIn: [
    { filter: () => ({ $notIn: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $notIn: { id: [user2Id()] } }), results: () => [user1Id(), user3Id()] },
    { filter: () => ({ $notIn: { id: [user2Id(), user3Id()] } }), results: () => [user1Id()] },
    {
      filter: () => ({ $notIn: { id: [user2Id(), user2Id()] } }),
      results: () => [user1Id(), user3Id()],
    },
    {
      filter: () => ({ $notIn: { id: [user1Id()], name: ['foo'] } }),
      results: '[TODO] Return proper error',
    },
  ],
  $null: [
    { filter: () => ({ $null: 'name' }), results: () => [user2Id()] },
    { filter: () => ({ $null: 'id' }), results: () => [] },
    { filter: () => ({ $null: 'bar' }), results: 'bar' },
  ],
  $notNull: [
    { filter: () => ({ $notNull: 'name' }), results: () => [user1Id(), user3Id()] },
    { filter: () => ({ $notNull: 'id' }), results: () => [user1Id(), user2Id(), user3Id()] },
    { filter: () => ({ $notNull: 'bar' }), results: 'bar' },
  ],
  $between: [
    { filter: () => ({ $between: {} }), results: '[TODO] Return proper error' },
    {
      filter: () => ({ $between: { id: { from: user1Id(), to: user2Id() } } }),
      results: () => [user1Id(), user2Id()],
    },
    {
      filter: () => ({ $between: { name: { from: 'a', to: 'z' } } }),
      results: () => [user1Id(), user3Id()],
    },
    {
      filter: () => ({ $between: { age: { from: 20, to: 30 } } }),
      results: () => [user2Id(), user3Id()],
    },
    {
      filter: () => ({ $between: { id: { from: 0, to: user1Id() } } }),
      results: () => [user1Id()],
    },
    {
      filter: () => ({ $between: { id: { from: user3Id(), to: 4 } } }),
      results: () => [user3Id()],
    },
    {
      filter: () => ({ $between: { id: { from: validId(), to: validId() } } }),
      results: () => [validId()],
    },
    { filter: () => ({ $between: { age: { from: 30, to: 40 } } }), results: () => [] },
    { filter: () => ({ $between: { id: { from: user3Id(), to: user1Id() } } }), results: () => [] },
    {
      filter: () => ({
        $between: { id: { from: user1Id(), to: user3Id() }, name: { from: 'a', to: 'z' } },
      }),
      results: '[TODO] Return proper error',
    },
  ],
  $gt: [
    { filter: () => ({ $gt: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $gt: { id: user2Id() } }), results: () => [user3Id()] },
    { filter: () => ({ $gt: { age: 21 } }), results: () => [] },
    { filter: () => ({ $gt: { age: 20 } }), results: () => [user2Id(), user3Id()] },
    { filter: () => ({ $gt: { id: 0 } }), results: () => [user1Id(), user2Id(), user3Id()] },
    {
      filter: () => ({ $gt: { id: user1Id(), name: 'a' } }),
      results: '[TODO] Return proper error',
    },
  ],
  $gte: [
    { filter: () => ({ $gte: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $gte: { id: user2Id() } }), results: () => [user2Id(), user3Id()] },
    { filter: () => ({ $gte: { name: 'z' } }), results: () => [] },
    { filter: () => ({ $gte: { age: 21 } }), results: () => [user2Id(), user3Id()] },
    { filter: () => ({ $gte: { name: 'a' } }), results: () => [user1Id(), user3Id()] },
    { filter: () => ({ $gte: { id: 0 } }), results: () => [user1Id(), user2Id(), user3Id()] },
    { filter: () => ({ $gte: { age: 30 } }), results: () => [] },
    {
      filter: () => ({ $gte: { id: user1Id(), name: 'a' } }),
      results: '[TODO] Return proper error',
    },
  ],
  $lt: [
    { filter: () => ({ $lt: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $lt: { id: user2Id() } }), results: () => [user1Id()] },
    { filter: () => ({ $lt: { name: 'bar' } }), results: () => [] },
    { filter: () => ({ $lt: { name: 'z' } }), results: () => [user1Id(), user3Id()] },
    { filter: () => ({ $lt: { age: 30 } }), results: () => [user1Id(), user2Id(), user3Id()] },
    { filter: () => ({ $lt: { id: 0 } }), results: () => [] },
    {
      filter: () => ({ $lt: { id: user1Id(), name: 'z' } }),
      results: '[TODO] Return proper error',
    },
  ],
  $lte: [
    { filter: () => ({ $lte: {} }), results: '[TODO] Return proper error' },
    { filter: () => ({ $lte: { id: user2Id() } }), results: () => [user1Id(), user2Id()] },
    { filter: () => ({ $lte: { name: 'bar' } }), results: () => [user3Id()] },
    { filter: () => ({ $lte: { age: 21 } }), results: () => [user1Id(), user2Id(), user3Id()] },
    { filter: () => ({ $lte: { name: 'z' } }), results: () => [user1Id(), user3Id()] },
    { filter: () => ({ $lte: { age: 30 } }), results: () => [user1Id(), user2Id(), user3Id()] },
    { filter: () => ({ $lte: { id: 0 } }), results: () => [] },
    {
      filter: () => ({ $lte: { id: user1Id(), name: 'z' } }),
      results: '[TODO] Return proper error',
    },
  ],
  $raw: [
    {
      filter: () => ({ $raw: { $query: 'id = ?', $bindings: validId() } }),
      results: () => [validId()],
    },
    {
      filter: () => ({ $raw: { $query: 'id = :id', $bindings: { id: validId() } } }),
      results: () => [validId()],
    },
  ],
};

describe('KnexConnector', () => {
  describe('#query(scope)', () => {
    let skip: number | undefined;
    let limit: number | undefined;
    let filter: Filter<any> | undefined;
    let order: OrderColumn<any>[] | undefined;

    const scope = () => ({ tableName, skip, limit, filter, order });
    const subject = () => connector.query(scope());

    it('rejects with error', async () => {
      try {
        await subject();
        expect(true).toBeFalsy(); // Should not reach
      } catch (error) {
        expect(error.message).toContain('users');
      }
    });
    context('with seeded table', {
      definitions: seedTable,
      tests() {
        it('promises empty array', async () => {
          const data = await subject();
          return expect(data).toEqual([]);
        });
      },
    });

    context('with seeded data', {
      definitions: seedDb,
      tests() {
        for (const groupName in filterSpecGroups) {
          describe(groupName + ' filter', () => {
            filterSpecGroups[groupName].forEach((filterSpec, index) => {
              context('with filter #' + (index + 1), {
                definitions: () => (filter = filterSpec.filter()),
                reset: () => (filter = undefined),
                tests() {
                  const results = filterSpec.results;
                  if (typeof results === 'function') {
                    it('promises all matching items as model instances', async () => {
                      const ids = results();
                      const items = await subject();
                      expect(items.length).toEqual(ids.length);
                      expect(idsOf(items)).toEqual(ids);
                    });

                    context('when skip is present', {
                      definitions: () => (skip = 1),
                      reset: () => (skip = undefined),
                      tests() {
                        it('promises all matching items as model instances', async () => {
                          const items = await subject();
                          const ids = results();

                          expect(items.length).toEqual(Math.max(0, ids.length - 1));
                          expect(idsOf(items)).toEqual(ids.slice(1));
                        });
                      },
                    });

                    context('when limit is present', {
                      definitions: () => (limit = 1),
                      reset: () => (limit = undefined),
                      tests() {
                        it('promises all matching items as model instances', async () => {
                          const items = await subject();
                          const ids = results();

                          expect(items.length).toEqual(ids.length > 0 ? 1 : 0);
                          expect(idsOf(items)).toEqual(ids.slice(0, 1));
                        });
                      },
                    });

                    context('when skip and limit is present', {
                      definitions: () => (skip = limit = 1),
                      reset: () => (skip = limit = undefined),
                      tests() {
                        it('promises all matching items as model instances', async () => {
                          const instances = await subject();
                          const ids = results();

                          expect(instances.length).toEqual(ids.length - 1 > 0 ? 1 : 0);
                          expect(idsOf(instances)).toEqual(ids.slice(1, 2));
                        });
                      },
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
      },
    });
  });

  describe('#count(scope)', () => {
    let skip: number | undefined;
    let limit: number | undefined;
    let filter: Filter<any> | undefined;
    let order: OrderColumn<any>[] | undefined;

    const scope = () => ({ tableName, skip, limit, filter, order });
    const subject = () => connector.count(scope());

    it('rejects with error', async () => {
      try {
        await subject();
        expect(true).toBeFalsy(); // Should not reach
      } catch (error) {
        expect(error.message).toContain('users');
      }
    });
    context('with seeded table', {
      definitions: seedTable,
      tests() {
        it('promises a count of 0', async () => {
          const data = await subject();
          return expect(data).toEqual(0);
        });
      },
    });

    context('with seeded data', {
      definitions: seedDb,
      tests() {
        for (const groupName in filterSpecGroups) {
          describe(groupName + ' filter', () => {
            filterSpecGroups[groupName].forEach((filterSpec, index) => {
              context('with filter #' + (index + 1), {
                definitions: () => (filter = filterSpec.filter()),
                reset: () => (filter = undefined),
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
      },
    });
  });

  // describe('#updateAll(Klass, attrs)', () => {
  //   let Klass: typeof User = User;
  //   let attrs: Partial<UserSchema> = {
  //     name: 'updated',
  //   };
  //   const subject = () => connector.updateAll(Klass, attrs);

  //   it('rejects with error', async () => {
  //     try {
  //       const data = await subject();
  //       expect(true).toBeFalsy(); // Should not reach
  //     } catch (error) {
  //       expect(error.message).toContain('users');
  //     }
  //   });
  //   context('with seeded table', {
  //     definitions: seedTable,
  //     tests() {
  //       it('promises a count of 0', async () => {
  //         const data = await subject();
  //         return expect(data).toEqual(0);
  //       });
  //     },
  //   });

  //   context('with seeded data', {
  //     definitions: seedDb,
  //     tests() {
  //       for (const groupName in filterSpecGroups) {
  //         describe(groupName + ' filter', () => {
  //           filterSpecGroups[groupName].forEach((filterSpec, index) => {
  //             context('with filter #' + (index + 1), {
  //               definitions() {
  //                 const filter: Filter<UserSchema> = <any>filterSpec.filter();
  //                 class NewKlass extends User {
  //                   static get filter(): Filter<UserSchema> {
  //                     return filter;
  //                   }
  //                 }
  //                 Klass = NewKlass;
  //               },
  //               tests() {
  //                 const results = filterSpec.results;
  //                 if (typeof results === 'function') {
  //                   it('returns count of matching records', async () => {
  //                     const ids = (<any>filterSpec.results)();
  //                     const count = await subject();
  //                     expect(count).toEqual(ids.length);
  //                     const instances = await connector.query(Klass);
  //                     for (const instance of instances) {
  //                       expect((<User>instance).name).toEqual('updated');
  //                     }
  //                   });
  //                 } else {
  //                   it('rejects filter and returns error', async () => {
  //                     try {
  //                       await subject();
  //                       expect(true).toBeFalsy(); // Should not reach
  //                     } catch (error) {
  //                       if (error.message !== undefined) {
  //                         expect(error.message).toContain(results);
  //                       } else {
  //                         expect(error).toEqual(results);
  //                       }
  //                     }
  //                   });
  //                 }
  //               },
  //             });
  //           });
  //         });
  //       }
  //     },
  //   });
  // });

  // describe('#deleteAll(Klass)', () => {
  //   let Klass: typeof User = User;
  //   const subject = () => connector.deleteAll(Klass);

  //   it('rejects with error', async () => {
  //     try {
  //       const data = await subject();
  //       expect(true).toBeFalsy(); // Should not reach
  //     } catch (error) {
  //       expect(error.message).toContain('users');
  //     }
  //   });
  //   context('with seeded table', {
  //     definitions: seedTable,
  //     tests() {
  //       it('promises a count of 0', async () => {
  //         const data = await subject();
  //         return expect(data).toEqual(0);
  //       });
  //     },
  //   });

  //   context('with seeded data', {
  //     definitions: seedDb,
  //     tests() {
  //       for (const groupName in filterSpecGroups) {
  //         describe(groupName + ' filter', () => {
  //           filterSpecGroups[groupName].forEach((filterSpec, index) => {
  //             context('with filter #' + (index + 1), {
  //               definitions() {
  //                 const filter: Filter<UserSchema> = <any>filterSpec.filter();
  //                 class NewKlass extends User {
  //                   static get filter(): Filter<UserSchema> {
  //                     return filter;
  //                   }
  //                 }
  //                 Klass = NewKlass;
  //               },
  //               tests() {
  //                 const results = filterSpec.results;
  //                 if (typeof results === 'function') {
  //                   it('returns count of matching records', async () => {
  //                     const ids = (<any>filterSpec.results)();
  //                     const count = await subject();
  //                     expect(count).toEqual(ids.length);
  //                     const instances = await connector.query(Klass);
  //                     expect(instances.length).toEqual(0);
  //                   });
  //                 } else {
  //                   it('rejects filter and returns error', async () => {
  //                     try {
  //                       await subject();
  //                       expect(true).toBeFalsy(); // Should not reach
  //                     } catch (error) {
  //                       if (error.message !== undefined) {
  //                         expect(error.message).toContain(results);
  //                       } else {
  //                         expect(error).toEqual(results);
  //                       }
  //                     }
  //                   });
  //                 }
  //               },
  //             });
  //           });
  //         });
  //       }
  //     },
  //   });
  // });

  // describe('#batchInsert(instance)', () => {
  //   let Klass: typeof User = User;
  //   let attrs: Partial<UserSchema> = {
  //     name: 'created',
  //     age: 4711,
  //   };
  //   let klass = new Klass(attrs);
  //   const subject = () => connector.create(klass);

  //   it('rejects with error', async () => {
  //     try {
  //       const data = await subject();
  //       expect(true).toBeFalsy(); // Should not reach
  //     } catch (error) {
  //       expect(error.message).toContain('users');
  //     }
  //   });
  //   context('with seeded table', {
  //     definitions: seedTable,
  //     tests() {
  //       it('creates instance and sets id', async () => {
  //         expect(await Klass.count).toEqual(0);
  //         const instance = await subject();
  //         expect(instance.id).toBeGreaterThan(0);
  //         expect(instance.attributes).toEqual({
  //           id: instance.id,
  //           name: attrs.name,
  //           age: attrs.age,
  //         });
  //         expect(await Klass.count).toEqual(1);
  //       });
  //     },
  //   });
  // });

  // describe('#execute(sql, bindings)', () => {
  //   let sql: string = 'SELECT * FROM users WHERE id = :id';
  //   let id = () => 0;
  //   const subject = () => connector.execute(sql, { id: id() });

  //   it('rejects with error', async () => {
  //     try {
  //       const data = await subject();
  //       expect(true).toBeFalsy(); // Should not reach
  //     } catch (error) {
  //       expect(error.message).toContain('users');
  //     }
  //   });

  //   context('with seeded table', {
  //     definitions: seedTable,
  //     tests() {
  //       it('promises empty array', async () => {
  //         const data = await subject();
  //         return expect(data).toEqual([]);
  //       });

  //       context('with seeded data', {
  //         definitions: seedData,
  //         tests() {
  //           it('promises empty array', async () => {
  //             const data = await subject();
  //             expect(data).toEqual([]);
  //           });

  //           context('with queryfor data', {
  //             definitions() {
  //               id = validId;
  //             },
  //             tests() {
  //               it('promises array of rows', async () => {
  //                 const data = await subject();
  //                 expect(data).toEqual([validUser().attributes]);
  //               });
  //             },
  //           });
  //         },
  //       });
  //     },
  //   });
  // });
});

afterAll(() => {
  connector.knex.destroy();
});
