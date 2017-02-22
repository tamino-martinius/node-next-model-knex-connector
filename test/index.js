'use strict';

const NextModelKnexConnector = require('..');
const NextModel = require('next-model');
const expect = require('expect.js');

const lodash = require('lodash');
const omit = lodash.omit;

def('BaseModel', () => class BaseModel extends NextModel {
  static get connector() {
    return $connector;
  }
});

def('identifierType', () => 'integer');

def('User', () => class User extends $BaseModel {
  static get modelName() {
    return 'User';
  }

  static get schema() {
    return {
      id: { type: $identifierType },
      name: { type: 'string' },
      age: { type: 'integer' },
    };
  }

  static get defaultScope() {
    return $userScope;
  }

  static get defaultOrder() {
    return $userOrder;
  }
});

def('userScope', () => undefined);
def('userOrder', () => undefined);
def('addressScope', () => undefined);
def('addressOrder', () => undefined);

let user1, user2, user3;

const cleanDb = function() {
  user1 = user2 = user3 = undefined;
  return Promise.resolve()
  .then(() => $connector.knex.schema.dropTableIfExists('users'))
};

const seedTable = function() {
  return Promise.resolve()
  .then(() => $User.createTable())
};

def('userAttrs1', () => ({ name: 'foo', age: 18 }));
def('userAttrs2', () => ({ name: 'foo', age: 21 }));
def('userAttrs3', () => ({ name: 'bar', age: 21 }));

const seedDb = function() {
  return Promise.resolve()
  .then(() => $User.create($userAttrs1)).then(data => (user1 = data))
  .then(() => $User.create($userAttrs2)).then(data => (user2 = data))
  .then(() => $User.create($userAttrs3)).then(data => (user3 = data));
};

describe('NextModelKnexConnector', function() {
  this.timeout(10000);
  const client = process.env.DB || 'sqlite3';
  const isOracle = client === 'oracledb';
  let connection = { filename: ':memory:' };
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
        connectString : "localhost/XE",
        stmtCacheSize : 0,
      };
      break;
    }
  }

  def('connector', () => new NextModelKnexConnector({
    client,
    connection,
    useNullAsDefault: true,
  }));

  beforeEach(cleanDb);

  afterEach(function() {
    $connector.knex.destroy();
  });

  def('User', () => $User);

  context('with seeded table', function() {
    beforeEach(seedTable);

    describe('.query', function() {
      subject(() => $connector.all($User));

      it('returns empty array', function() {
        return $subject.then(rows => expect(rows).to.eql([]));
      });

      context('when seeded data is present', function() {
        beforeEach(seedDb);

        it('returns all rows of model', function() {
          return $subject.then(rows => expect(rows).to.eql([user1, user2, user3]));
        });

        context('when results are limited', function() {
          def('User', () => $User.limit(2));

          it('limits rows', function() {
            return $subject.then(rows => expect(rows).to.eql([user1, user2]));
          });
        });

        context('when results are skipped', function() {
          def('User', () => $User.skip(2));

          it('skips rows', function() {
            return $subject.then(rows => expect(omit(rows, 'ROWNUM_')).to.eql([user3]));
          });
        });

        context('when results are scoped', function() {
          def('userScope', () => ({ name: 'foo' }));

          it('filters rows', function() {
            return $subject.then(rows => expect(rows).to.eql([user1, user2]));
          });

          context('when query with $and', function() {
            def('userScope', () => ({
              $and: [{ name: 'foo' }, { age: 21 }],
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user2]));
            });
          });

          context('when query with $or', function() {
            def('userScope', () => ({
              $or: [{ name: 'foo', age: 21 }, { name: 'foo', age: 18 }],
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1, user2]));
            });
          });

          context('when query with $or and $and', function() {
            def('userScope', () => ({
              $or: [
                { $and: [{ name: 'foo' }, { age: 18 }] },
                { $and: [{ name: 'foo' }, { age: 21 }] },
              ],
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1, user2]));
            });
          });

          context('when query with $not', function() {
            def('userScope', () => ({
              $not: { name: 'foo' },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user3]));
            });
          });

          context('when query with $not and $and', function() {
            def('userScope', () => ({
              $not: { $or: [
                { $and: [{ name: 'foo' }, { age: 18 }] },
                { $and: [{ name: 'foo' }, { age: 21 }] },
              ]},
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user3]));
            });
          });

          context('when query with $null', function() {
            def('userScope', () => ({
              $null: 'name',
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([]));
            });
          });

          context('when query with $notNull', function() {
            def('userScope', () => ({
              $notNull: 'name',
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1, user2, user3]));
            });
          });

          context('when query with $in', function() {
            def('userScope', () => ({
              $in: {
                age: [15, 16, 17, 18],
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1]));
            });
          });

          context('when query with multiple $in', function() {
            def('userScope', () => ({
              $in: {
                age: [19, 20, 21],
                name: ['foo', 'baz'],
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user2]));
            });
          });

          context('when query with $between', function() {
            def('userScope', () => ({
              $between: {
                age: [15, 20],
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1]));
            });
          });

          context('when query with $notBetween', function() {
            def('userScope', () => ({
              $notBetween: {
                age: [15, 20],
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user2, user3]));
            });
          });

          context('when query with $eq', function() {
            def('userScope', () => ({
              $eq: {
                age: 18,
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1]));
            });
          });

          context('when query with multiple $eq', function() {
            def('userScope', () => ({
              $eq: {
                age: 21,
                name: 'foo',
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user2]));
            });
          });

          context('when query with $lt', function() {
            def('userScope', () => ({
              $lt: {
                age: 20,
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1]));
            });

            context('when value is equal', function() {
              def('userScope', () => ({
                $lt: {
                  age: 18,
                },
              }));

              it('filters rows', function() {
                return $subject.then(rows => expect(rows).to.eql([]));
              });
            });
          });

          context('when query with multiple $lt', function() {
            def('userScope', () => ({
              $lt: {
                age: 20,
                name: 'foul',
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1]));
            });
          });

          context('when query with $lte', function() {
            def('userScope', () => ({
              $lte: {
                age: 20,
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1]));
            });

            context('when value is equal', function() {
              def('userScope', () => ({
                $lte: {
                  age: 18,
                },
              }));

              it('filters rows', function() {
                return $subject.then(rows => expect(rows).to.eql([user1]));
              });
            });
          });

          context('when query with multiple $lte', function() {
            def('userScope', () => ({
              $lte: {
                age: 20,
                name: 'foul',
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1]));
            });
          });

          context('when query with $gt', function() {
            def('userScope', () => ({
              $gt: {
                age: 20,
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user2, user3]));
            });

            context('when value is equal', function() {
              def('userScope', () => ({
                $gt: {
                  age: 21,
                },
              }));

              it('filters rows', function() {
                return $subject.then(rows => expect(rows).to.eql([]));
              });
            });
          });

          context('when query with multiple $gt', function() {
            def('userScope', () => ({
              $gt: {
                age: 20,
                name: 'baz',
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user2]));
            });
          });

          context('when query with $gte', function() {
            def('userScope', () => ({
              $gte: {
                age: 20,
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user2, user3]));
            });

            context('when value is equal', function() {
              def('userScope', () => ({
                $gte: {
                  age: 21,
                },
              }));

              it('filters rows', function() {
                return $subject.then(rows => expect(rows).to.eql([user2, user3]));
              });
            });
          });

          context('when query with multiple $gte', function() {
            def('userScope', () => ({
              $gte: {
                age: 20,
                name: 'baz',
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user2]));
            });
          });

          context('when query with $raw', function() {
            def('userScope', () => ({
              $raw: {
                ['?? = ?']: ['age', 18],
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user1]));
            });
          });

          context('when query with multiple $eq', function() {
            def('userScope', () => ({
              $raw: {
                ['?? > ?']: ['age', 20],
                ['?? = ?']: ['name', 'foo'],
              },
            }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql([user2]));
            });
          });
        });
      });
    });

    describe('.all', function() {
      subject(() => $connector.all($User));

      it('returns empty array', function() {
        return $subject.then(rows => expect(rows).to.eql([]));
      });

      context('when seeded data is present', function() {
        beforeEach(seedDb);

        it('returns all rows of model', function() {
          return $subject.then(rows => expect(rows).to.eql([user1, user2, user3]));
        });

        context('when results are limited', function() {
          def('User', () => $User.limit(2));

          it('limits rows', function() {
            return $subject.then(rows => expect(rows).to.eql([user1, user2]));
          });
        });

        context('when results are skipped', function() {
          def('User', () => $User.skip(2));

          it('skips rows', function() {
            return $subject.then(rows => expect(omit(rows, 'ROWNUM_')).to.eql([user3]));
          });
        });

        context('when results are scoped', function() {
          def('userScope', () => ({ name: 'foo' }));

          it('filters rows', function() {
            return $subject.then(rows => expect(rows).to.eql([user1, user2]));
          });
        });

        context('when results are ordered', function() {
          def('userOrder', () => ({ id: 'desc' }));

          it('orders rows', function() {
            return $subject.then(rows => expect(rows).to.eql([user3, user2, user1]));
          });
        });
      });
    });

    describe('.first', function() {
      subject(() => $connector.first($User));

      it('returns empty array', function() {
        return $subject.then(rows => expect(rows).to.eql(undefined));
      });

      context('when seeded data is present', function() {
        beforeEach(seedDb);

        it('returns first row of model', function() {
          return $subject.then(rows => expect(rows).to.eql(user1));
        });

        context('when results are limited', function() {
          def('User', () => $User.limit(2));

          it('returns first row of model', function() {
            return $subject.then(rows => expect(rows).to.eql(user1));
          });
        });

        context('when results are skipped', function() {
          def('User', () => $User.skip(2));

          it('skips rows', function() {
            return $subject.then(rows => expect(omit(rows, 'ROWNUM_')).to.eql(user3));
          });
        });

        context('when results are scoped', function() {
          def('userScope', () => ({ name: 'bar' }));

          it('filters rows', function() {
            return $subject.then(rows => expect(rows).to.eql(user3));
          });
        });

        context('when results are ordered', function() {
          def('userOrder', () => ({ id: 'desc' }));

          it('orders rows', function() {
            return $subject.then(rows => expect(rows).to.eql(user3));
          });
        });
      });
    });

    describe('.last', function() {
      subject(() => $connector.last($User));

      it('returns empty array', function() {
        expect(() => $subject).to.throwError();
      });

      context('when seeded data is present', function() {
        beforeEach(seedDb);

        it('throws Error', function() {
          expect(() => $subject).to.throwError();
        });

        context('when results are limited', function() {
          def('User', () => $User.limit(2));

          it('throws Error', function() {
            expect(() => $subject).to.throwError();
          });
        });

        context('when results are skipped', function() {
          def('User', () => $User.skip(1));

          it('throws Error', function() {
            expect(() => $subject).to.throwError();
          });
        });

        context('when results are scoped', function() {
          def('userScope', () => ({ name: 'bar' }));

          it('throws Error', function() {
            expect(() => $subject).to.throwError();
          });
        });

        context('when results are ordered', function() {
          def('userOrder', () => ({ id: 'asc' }));

          it('orders rows', function() {
            return $subject.then(rows => expect(rows).to.eql(user3));
          });

          context('when results are scoped', function() {
            def('userScope', () => ({ name: 'foo' }));

            it('filters rows', function() {
              return $subject.then(rows => expect(rows).to.eql(user2));
            });
          });
        });
      });
    });

    describe('.count', function() {
      subject(() => $connector.count($User));

      it('returns zero', function() {
        return $subject.then(rows => expect(rows).to.eql(0));
      });

      context('when seeded data is present', function() {
        beforeEach(seedDb);

        it('returns row count of model', function() {
          return $subject.then(rows => expect(rows).to.eql(3));
        });

        context('when results are scoped', function() {
          def('userScope', () => ({ name: 'bar' }));

          it('filters rows', function() {
            return $subject.then(rows => expect(rows).to.eql(1));
          });
        });

        context('when results are ordered', function() {
          def('userOrder', () => ({ id: 'desc' }));

          it('orders rows', function() {
            return $subject.then(rows => expect(rows).to.eql(3));
          });
        });
      });
    });

    describe('.save', function() {
      def('user', () => $User.build({ name: 'foo' }))
      subject(() => $connector.save($user));

      it('saves the record', function() {
        expect($user.isNew).to.be(true);
        return $subject.then(user => {
          expect(user.isNew).to.be(false);
          if (isOracle) {
            expect($user.id).to.be.a('string');
          } else {
            expect($user.id).to.be.a('number');
          }
          expect(user.name).to.be('foo');
        });
      });

      context('when user is already present', function() {
        beforeEach(seedDb);
        def('user', () => user1);

        it('updates the record', function() {
          expect($user.isNew).to.be(false);
          if (isOracle) {
            expect($user.id).to.be.a('string');
          } else {
            expect($user.id).to.be.a('number');
          }
          expect($user.name).to.be('foo');
          $user.name = 'bar';
          return $subject
          .then(user => {
            expect(user.isNew).to.be(false);
            if (isOracle) {
              expect($user.id).to.be.a('string');
            } else {
              expect($user.id).to.be.a('number');
            }
            expect(user.name).to.be('bar');
            return $user.reload();
          })
          .then(user => {
            expect(user.isNew).to.be(false);
            if (isOracle) {
              expect($user.id).to.be.a('string');
            } else {
              expect($user.id).to.be.a('number');
            }
            expect(user.name).to.be('bar');
          });
        });
      });
    });

    describe('.delete', function() {
      def('user', () => $User.build({ name: 'foo' }))
      subject(() => $connector.delete($user));

      it('returns false unless record is persisted', function() {
        expect($user.isNew).to.be(true);
        return $subject.then(result => expect(result).to.eql(0));
      });

      context('when user is already present', function() {
        beforeEach(seedDb);
        def('user', () => user1);

        it('deleted the record', function() {
          expect($user.isNew).to.be(false);
          return $subject
          .then(result => {
            expect(result).to.eql(1);
            return $user.reload();
          })
          .then(user => {
            expect(user.isNew).to.be(true);
            expect(user.name).to.be('foo');
          });
        });
      });
    });
  });

  describe('.createTable', function() {
    subject(() => $connector.createTable($User));

    it('returns creates table', function() {
      return $subject
      .then(() => $connector.knex.schema.hasTable('users'))
        .then(exists => expect(exists).to.be(true))
      .then(() => $connector.knex.schema.hasColumn('users', 'id'))
        .then(exists => expect(exists).to.be(true))
      .then(() => $connector.knex.schema.hasColumn('users', 'name'))
        .then(exists => expect(exists).to.be(true));
    });

    context('when table already exists', function() {
      beforeEach(seedTable);

      it('throws error', function() {
        return $subject.catch(err => expect(err).to.be.a(Error));
      });
    });
  });
});
