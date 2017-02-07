'use strict';

const NextModelKnexConnector = require('../lib');
const NextModel = require('next-model');
const expect = require('expect.js');

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

const seedDb = function() {
  return Promise.resolve()
  .then(() => $User.create({ name: 'foo' })).then(data => (user1 = data))
  .then(() => $User.create({ name: 'bar' })).then(data => (user2 = data))
  .then(() => $User.create({ name: 'baz' })).then(data => (user3 = data));
};

describe('NextModelKnexConnector', function() {
  def('connector', () => new NextModelKnexConnector({
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: './tmp/testdb.sqlite',
    },
  }));

  beforeEach(cleanDb);

  def('User', () => $User);

  context('with seeded table', function() {
    beforeEach(seedTable);

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
            return $subject.then(rows => expect(rows).to.eql([user3]));
          });
        });

        context('when results are scoped', function() {
          def('userScope', () => ({ name: 'foo' }));

          it('filters rows', function() {
            return $subject.then(rows => expect(rows).to.eql([user1]));
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
            return $subject.then(rows => expect(rows).to.eql(user3));
          });
        });

        context('when results are scoped', function() {
          def('userScope', () => ({ name: 'bar' }));

          it('filters rows', function() {
            return $subject.then(rows => expect(rows).to.eql(user2));
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
            def('userScope', () => ({ name: 'bar' }));

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
          expect(user.id).to.be.a('number');
          expect(user.name).to.be('foo');
        });
      });

      context('when user is already present', function() {
        beforeEach(seedDb);
        def('user', () => user1);

        it('updates the record', function() {
          expect($user.isNew).to.be(false);
          expect($user.id).to.be.a('number');
          expect($user.name).to.be('foo');
          $user.name = 'bar';
          return $subject
          .then(user => {
            expect(user.isNew).to.be(false);
            expect(user.id).to.be.a('number');
            expect(user.name).to.be('bar');
            return $user.reload();
          })
          .then(user => {
            expect(user.isNew).to.be(false);
            expect(user.id).to.be.a('number');
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
