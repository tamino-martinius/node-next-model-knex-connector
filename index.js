'use strict';

const Knex = require('knex');

const {
  underscore,
  pluralize,
} = require('inflection');

const {
  filter,
  first,
  forEach,
  includes,
  isEmpty,
  isPlainObject,
  keys,
  omit,
  startsWith,
  upperFirst,
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
    const query = this._selectQuery(Klass);
    return query;
  }

  first(Klass) {
    const query = this._selectQuery(Klass);
    return query.limit(1).then(arr => (arr && arr[0]));
  }

  last(Klass) {
    if (Klass._limit || Klass._skip) throw new Error('`last` is not supportet in combination with `skip` or `limit`');
    if (!Klass.defaultOrder) throw new Error('`last` only works if order is present');
    const query = this._selectQuery(Klass, true);
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
    return query;
  }

  // Private functions

  _selectQuery(Klass, reverse = false) {
    let query = this.query(Klass);
    query = reverse ? this._reverse(Klass, query) : this._order(Klass, query);
    return query.select(Klass.tableName + '.*');
  }

  _buildQuery(currentQuery, scope, queryType = 'where', args = null) {
    if (isEmpty(scope) && isEmpty(args)) return currentQuery;
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
          connector._buildSpecialQuery(key, specialKey, scope, query);
        });
      });
    } else {
      if (args) {
        currentQuery[queryType].apply(currentQuery, args);
      } else {
        currentQuery[queryType](scope);
      }
    }
  }

  _buildSpecialQuery(key, specialKey, scope, query) {
    switch (true) {
      case /^(and|or)$/.test(key): {
        this._buildNestedQuery(key, specialKey, scope, query);
        break;
      }
      case /^(not|null|notNull)$/.test(key): {
        this._buildNegationQuery(key, specialKey, scope, query);
        break;
      }
      case /^(in|notIn|between|notBetween)$/.test(key): {
        this._buildRangeQuery(key, specialKey, scope, query);
        break;
      }
      case /^(eq|lt|lte|gt|gte)$/.test(key): {
        this._buildEquationQuery(key, specialKey, scope, query);
        break;
      }
      case /^(raw)$/.test(key): {
        this._buildRawQuery(key, specialKey, scope, query);
        break;
      }
      default: {
        throw new Error(`Unknown special command '${key}'`);
      }
    }
  }

  _buildNestedQuery(key, specialKey, scope, query) {
    const subQueryType = key + 'Where';
    forEach(scope[specialKey], subScope => {
      this._buildQuery(query, subScope, subQueryType);
    });
  }

  _buildNegationQuery(key, specialKey, scope, query) {
    const subQueryType = 'where' + upperFirst(key);
    this._buildQuery(query, scope[specialKey], subQueryType);
  }

  _buildRangeQuery(key, specialKey, scope, query) {
    const subQueryType = 'where' + upperFirst(key);
    forEach(scope[specialKey], (value, key) => {
      this._buildQuery(query, value, subQueryType, [key, value]);
    });
  }

  _buildEquationQuery(key, specialKey, scope, query) {
    let operator;
    switch (key) {
      case 'eq': operator = '='; break;
      case 'lt': operator = '<'; break;
      case 'lte': operator = '<='; break;
      case 'gt': operator = '>'; break;
      case 'gte': operator = '>='; break;
    }
    forEach(scope[specialKey], (value, key) => {
      this._buildQuery(query, value, 'where', [key, operator, value]);
    });
  }

  _buildRawQuery(key, specialKey, scope, query) {
    const subQueryType = 'where' + upperFirst(key);
    forEach(scope[specialKey], (value, key) => {
      this._buildQuery(query, value, subQueryType, [key, value]);
    });
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
