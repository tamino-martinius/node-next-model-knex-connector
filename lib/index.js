'use strict';

const Knex = require('knex');

const {
  underscore,
  pluralize,
} = require('inflection');

const {
  first,
  values,
} = require('lodash');

module.exports = class NextModelKnexConnector {
  constructor(options) {
    this.knex = require('knex')(options);
  }

  tableName(modelName) {
    return underscore(pluralize(modelName));
  }

  all(Klass) {
    const query = this._order(Klass, this._query(Klass));
    return query;
  }

  first(Klass) {
    const query = this._order(Klass, this._query(Klass));
    return query.limit(1).then(arr => (arr && arr[0]));
  }

  last(Klass) {
    if (Klass._limit || Klass._skip) throw new Error('`last` is not supportet in combination with `skip` or `limit`');
    if (!Klass.defaultOrder) throw new Error('`last` only works if order is present');
    const query = this._reverse(Klass, this._query(Klass));
    return query.limit(1).then(arr => (arr && arr[0]));
  }

  count(Klass) {
    const query = this._query(Klass);
    return query.count(Klass.identifier).then(rows => first(values(first(rows))));
  }

  createTable(Klass) {
    const schema = Klass.fetchSchema();
    const hasUuidIdentifier = schema[Klass.identifier].type === 'uuid';
    let dbSchema = this.knex.schema;
    if (hasUuidIdentifier) dbSchema = dbSchema.raw('CREATE EXTENSION pgcrypto');
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

  _table(Klass) {
    return this.knex(Klass.tableName);
  }

  _query(Klass) {
    let query = this._table(Klass);
    if (Klass.defaultScope) query = query.where(Klass.defaultScope);
    if (Klass._skip) query = query.offset(Klass._skip);
    if (Klass._limit) query = query.limit(Klass._limit);
    return query;
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
