'use strict';

const Knex = require('knex');

const {
  underscore,
  pluralize,
} = require('inflection');

const {
  capitalize,
  filter,
  first,
  forEach,
  includes,
  isEmpty,
  isPlainObject,
  keys,
  omit,
  startsWith,
  values,
} = require('lodash');

module.exports = class NextModelKnexConnector {

  // Functions

  constructor(options) {
    this.knex = Knex(options);
  }

  tableName(modelName) {
    return underscore(pluralize(modelName));
  }

  all(Klass) {
    const query = this._order(Klass, this.query(Klass));
    return query;
  }

  first(Klass) {
    const query = this._order(Klass, this.query(Klass));
    return query.limit(1).then(arr => (arr && arr[0]));
  }

  last(Klass) {
    if (Klass._limit || Klass._skip) throw new Error('`last` is not supportet in combination with `skip` or `limit`');
    if (!Klass.defaultOrder) throw new Error('`last` only works if order is present');
    const query = this._reverse(Klass, this.query(Klass));
    return query.limit(1).then(arr => (arr && arr[0]));
  }

  count(Klass) {
    const query = this.query(Klass);
    return query.count(Klass.identifier).then(rows => first(values(first(rows))));
  }

  createTable(Klass) {
    const schema = Klass.fetchSchema();
    const hasUuidIdentifier = schema[Klass.identifier].type === 'uuid';
    let dbSchema = this.knex.schema;
    // if (hasUuidIdentifier) dbSchema = dbSchema.raw('CREATE EXTENSION pgcrypto');
    return dbSchema.createTable(Klass.tableName, function(table) {
      for (const key in schema) {
        const type = schema[key].type;
        if (key === Klass.identifier) {
          switch (type) {
            case 'uuid': // pg only
              table.specificType(key, 'UUID PRIMARY KEY DEFAULT gen_random_uuid()');
              break;
            case 'integer':
              table.increments(key);
              break;
            case 'bigInteger': // pg only
              table.bigIncrements(key);
              break;
            default:
              table.increments(key);
          }
        } else {
          table[type](key);
        }
      }
    });
  }

  save(klass) {
    const identifier = klass.constructor.identifier;
    const table = this._table(klass.constructor);
    const data = klass.databaseAttributes;
    if (klass.isNew) {
      return table.insert(data, identifier)
      .then(ids => {
        klass[identifier] = ids[0];
        return klass;
      });
    } else {
      const id = klass[identifier];
      return table.where({[identifier]: id})
      .update(data, identifier).
      then(() => klass);
    }
  }

  delete(klass) {
    if (klass.isNew) {
      return Promise.resolve(0);
    } else {
      const identifier = klass.constructor.identifier;
      const table = this._table(klass.constructor);
      const id = klass[identifier];
      return table.where({[identifier]: id}).delete();
    }
  }

  query(Klass) {
    let query = this._table(Klass);
    this._buildQuery(query, Klass.defaultScope);
    if (Klass._skip) query = query.offset(Klass._skip);
    if (Klass._limit) query = query.limit(Klass._limit);
    // console.log(query.toString());
    return query;
  }

  // Private functions

  _buildQuery(currentQuery, scope, queryType = 'where', column = null) {
    if (isEmpty(scope)) return currentQuery;
    if (isPlainObject(scope)) {
      const scopeKeys = keys(scope);
      const specialKeys = filter(scopeKeys, (key) => startsWith(key, '$'));
      const simpleScope = omit(scope, specialKeys);
      const connector = this;
      currentQuery[queryType](function() {
        let query = this;
        if (!isEmpty(simpleScope)) {
          query = query.where(simpleScope);
        }
        forEach(specialKeys, specialKey => {
          const key = specialKey.substr(1);
          switch (true) {
            case /^(and|or)$/.test(key): {
              const subQueryType = key + 'Where';
              forEach(scope[specialKey], subScope => {
                connector._buildQuery(query, subScope, subQueryType);
              });
              break;
            }
            case /^(not|Null|notNull)$/.test(key): {
              const subQueryType = 'where' + capitalize(key);
              connector._buildQuery(query, scope[specialKey], subQueryType);
              break;
            }
            case /^(in|notIn|between|notBetween)$/.test(key): {
              const subQueryType = 'where' + capitalize(key);
              forEach(scope[specialKey], (value, key) => {
                connector._buildQuery(query, value, subQueryType, key);
              });
              break;
            }
            default: {
              throw new Error(`Unknown special command '${key}'`);
            }
          }
        });
      });
    } else {
      if (column) {
        currentQuery[queryType](column, scope);
      } else {
        currentQuery[queryType](scope);
      }
    }
  }

  _table(Klass) {
    return this.knex(Klass.tableName);
  }

  _order(Klass, query) {
    if (Klass.defaultOrder) {
      for (const key in Klass.defaultOrder) {
        const direction = Klass.defaultOrder[key] === 'desc' ? 'desc' : 'asc';
        query = query.orderBy(key, direction);
      }
    }
    return query;
  }

  _reverse(Klass, query) {
    if (Klass.defaultOrder) {
      for (const key in Klass.defaultOrder) {
        const direction = Klass.defaultOrder[key] === 'desc' ? 'asc' : 'desc';
        query = query.orderBy(key, direction);
      }
    }
    return query;
  }
}
