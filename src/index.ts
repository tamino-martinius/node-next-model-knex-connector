import Knex from 'knex';
import {
  Identifiable,
  ConnectorConstructor,
  ModelStatic,
  ModelConstructor,
  Bindings,
  FilterSpecial,
  FilterProperty,
  Filter,
  FilterIn,
  FilterBetween,
  FilterCompare,
  FilterRaw,
  BaseType,
} from '@next-model/core';

export class NextModelKnexConnector<S extends Identifiable> implements ConnectorConstructor<S> {
  knex: Knex;

  constructor(options: Knex.Config) {
    this.knex = Knex(options);
  }

  private tableName(model: ModelStatic<S>): string {
    if (model.collectionName !== undefined) {
      return model.collectionName;
    } else {
      return model.lowerModelName;
    }
  }

  private table(model: ModelStatic<S>): Knex.QueryBuilder {
    return this.knex(this.tableName(model));
  }

  private propertyFilter(query: Knex.QueryBuilder, filter: FilterProperty<S>): Knex.QueryBuilder {
    return query.where(filter);
  }

  private andFilter(query: Knex.QueryBuilder, filters: Filter<S>[]): Knex.QueryBuilder {
    for (const filter of filters) {
      query = query.andWhere(this.filter(query, filter));
    }
    return query;
  }

  private notFilter(query: Knex.QueryBuilder, filter: Filter<S>): Knex.QueryBuilder {
    return query.whereNot(this.filter(query, filter));
  }

  private orFilter(query: Knex.QueryBuilder, filters: Filter<S>[]): Knex.QueryBuilder {
    for (const filter of filters) {
      query = query.orWhere(this.filter(query, filter));
    }
    return query;
  }

  private inFilter(query: Knex.QueryBuilder, filter: FilterIn<S>): Knex.QueryBuilder {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      return query.whereIn(key, <any>filter[key]);
    }
    throw '[TODO] Should not reach error';
  }

  private notInFilter(query: Knex.QueryBuilder, filter: FilterIn<S>): Knex.QueryBuilder {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      return query.whereNotIn(key, <any>filter[key]);
    }
    throw '[TODO] Should not reach error';
  }

  private nullFilter(query: Knex.QueryBuilder, key: keyof S): Knex.QueryBuilder {
    return query.whereNull(key);
  }

  private notNullFilter(query: Knex.QueryBuilder, key: keyof S): Knex.QueryBuilder {
    return query.whereNotNull(key);
  }

  private betweenFilter(query: Knex.QueryBuilder, filter: FilterBetween<S>): Knex.QueryBuilder {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      return query.andWhereBetween(key, [<any>filter[key].from, <any>filter[key].to])
    }
    throw '[TODO] Should not reach error';
  }

  private notBetweenFilter(query: Knex.QueryBuilder, filter: FilterBetween<S>): Knex.QueryBuilder {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      return query.andWhereNotBetween(key, [<any>filter[key].from, <any>filter[key].to])
    }
    throw '[TODO] Should not reach error';
  }

  private gtFilter(query: Knex.QueryBuilder, filter: FilterCompare<S>): Knex.QueryBuilder {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      return query.where(key, '>', <any>filter[key]);
    }
    throw '[TODO] Should not reach error';
  }

  private gteFilter(query: Knex.QueryBuilder, filter: FilterCompare<S>): Knex.QueryBuilder {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      const value: BaseType = <any>filter[key];
      if (value !== undefined) {
        return query.where(key, '>=', value);
      }
    }
    throw '[TODO] Should not reach error';
  }

  private ltFilter(query: Knex.QueryBuilder, filter: FilterCompare<S>): Knex.QueryBuilder {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      const value: BaseType = <any>filter[key];
      if (value !== undefined) {
        return query.where(key, '<', value);
      }
    }
    throw '[TODO] Should not reach error';
  }

  private lteFilter(query: Knex.QueryBuilder, filter: FilterCompare<S>): Knex.QueryBuilder {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      const value: BaseType = <any>filter[key];
      if (value !== undefined) {
        return query.where(key, '<=', value);
      }
    }
    throw '[TODO] Should not reach error';
  }

  private rawFilter(query: Knex.QueryBuilder, filter: FilterRaw): Knex.QueryBuilder {
    return query.whereRaw(filter.$query, <any>filter.$bindings);
  }

  private specialFilter(query: Knex.QueryBuilder, filter: FilterSpecial<S>): Knex.QueryBuilder {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    if (filter.$and !== undefined)
      return this.andFilter(query, filter.$and);
    if (filter.$or !== undefined)
      return this.orFilter(query, filter.$or);
    if (filter.$not !== undefined)
      return this.notFilter(query, filter.$not);
    if (filter.$in !== undefined)
      return this.inFilter(query, filter.$in);
    if (filter.$notIn !== undefined)
      return this.notInFilter(query, filter.$notIn);
    if (filter.$null !== undefined)
      return this.nullFilter(query, filter.$null);
    if (filter.$notNull !== undefined)
      return this.notNullFilter(query, filter.$notNull);
    if (filter.$between !== undefined)
      return this.betweenFilter(query, filter.$between);
    if (filter.$notBetween !== undefined)
      return this.notBetweenFilter(query, filter.$notBetween);
    if (filter.$gt !== undefined)
      return this.gtFilter(query, filter.$gt);
    if (filter.$gte !== undefined)
      return this.gteFilter(query, filter.$gte);
    if (filter.$lt !== undefined)
      return this.ltFilter(query, filter.$lt);
    if (filter.$lte !== undefined)
      return this.lteFilter(query, filter.$lte);
    if (filter.$raw !== undefined)
      return this.rawFilter(query, filter.$raw);
    throw '[TODO] Should not reach error';
  }

  private filter(query: Knex.QueryBuilder, filter: Filter<S>): Knex.QueryBuilder {
    for (const key in filter) {
      if (key.startsWith('$')) {
        return this.specialFilter(query, <FilterSpecial<S>>filter);
      }
    }
    return this.propertyFilter(query, <FilterProperty<S>>filter);
  }

  private collection(model: ModelStatic<S>): Knex.QueryBuilder {
    const table = this.table(model);
    const query = this
      .filter(table, model.filter)
      .limit(model.limit)
      .offset(model.skip);
    return query;
  }

  async query(model: ModelStatic<S>): Promise<ModelConstructor<S>[]> {
    let query = this.collection(model);
    for (const order of model.order) {
      for (const key in order) {
        const direction = order[key] === OrderDirection.asc ? 'asc' : 'desc';
        query = query.orderBy(key, direction);
      }
    }
    const rows: S[] = await this.collection(model).select('*');
    return rows.map(row => new model(row));
  }

  async count(model: ModelStatic<S>): Promise<number> {
    const rows: S[] = await this.collection(model).count();
    if (rows.length >= 0) {
      for (const key in rows[0]) {
        return <any>rows[0][key];
      }
    }
    throw '[TODO] Should not reach error';
  }

  async updateAll(model: ModelStatic<S>, attrs: Partial<S>): Promise<ModelConstructor<S>[]> {
    const rows: S[] = await this.collection(model).update(attrs, '*');
    return rows.map(row => new model(row));
  }

  async deleteAll(model: ModelStatic<S>): Promise<ModelConstructor<S>[]> {
    const rows: S[] = await this.collection(model).delete('*');
    return rows.map(row => {
      const instance = new model(row);
      instance.id = undefined;
      return instance;
    });
  }

  async create(instance: ModelConstructor<S>): Promise<ModelConstructor<S>> {
    const model = instance.model;
    const identifier = model.identifier;
    const table = this.table(model);
    const data = instance.attributes;
    const ids = await table.insert(data, identifier);
    instance.id = ids[0];
    return instance;
  }

  async update(instance: ModelConstructor<S>): Promise<ModelConstructor<S>> {
    const model = instance.model;
    const identifier = model.identifier;
    const table = this.table(model);
    const data = instance.attributes;
    await table.where({ [identifier]: instance.id }).update(data, identifier);
    return instance;
  }

  async delete(instance: ModelConstructor<S>): Promise<ModelConstructor<S>> {
    const model = instance.model;
    const identifier = model.identifier;
    const table = this.table(model);
    await table.where({ [identifier]: instance.id }).delete();
    instance.id = undefined;
    return instance;
  }

  async execute(query: string, bindings: Bindings): Promise<any[]> {
    const rows: any[] = await this.knex.raw(query, bindings);
    return rows;
  }


  // all(Klass) {
  //   const query = this._selectQuery(Klass);
  //   return query;
  // }


  // count(Klass) {
  //   const query = this.query(Klass);
  //   return query.count(Klass.identifier).then(rows => first(values(first(rows))));
  // }

  // createTable(Klass) {
  //   const schema = Klass.fetchSchema();
  //   const hasUuidIdentifier = schema[Klass.identifier].type === 'uuid';
  //   let dbSchema = this.knex.schema;
  //   // if (hasUuidIdentifier) dbSchema = dbSchema.raw('CREATE EXTENSION pgcrypto');
  //   return dbSchema.createTable(Klass.tableName, function (table) {
  //     for (const key in schema) {
  //       const type = schema[key].type;
  //       if (key === Klass.identifier) {
  //         switch (type) {
  //           case 'uuid': // pg only
  //             table.specificType(key, 'UUID PRIMARY KEY DEFAULT gen_random_uuid()');
  //             break;
  //           case 'integer':
  //             table.increments(key);
  //             break;
  //           case 'bigInteger': // pg only
  //             table.bigIncrements(key);
  //             break;
  //           default:
  //             table.increments(key);
  //         }
  //       } else {
  //         table[type](key);
  //       }
  //     }
  //   });
  // }

  // save(klass) {
  //   const identifier = klass.constructor.identifier;
  //   const table = this._table(klass.constructor);
  //   const data = klass.databaseAttributes;
  //   if (klass.isNew) {
  //     return table.insert(data, identifier)
  //       .then(ids => {
  //         klass[identifier] = ids[0];
  //         return klass;
  //       });
  //   } else {
  //     const id = klass[identifier];
  //     return table.where({ [identifier]: id })
  //       .update(data, identifier).
  //       then(() => klass);
  //   }
  // }

  // delete(klass) {
  //   if (klass.isNew) {
  //     return Promise.resolve(0);
  //   } else {
  //     const identifier = klass.constructor.identifier;
  //     const table = this._table(klass.constructor);
  //     const id = klass[identifier];
  //     return table.where({ [identifier]: id }).delete();
  //   }
  // }

  // query(Klass) {
  //   let query = this._table(Klass);
  //   this._buildQuery(query, Klass.defaultScope);
  //   if (Klass._skip) query = query.offset(Klass._skip);
  //   if (Klass._limit) query = query.limit(Klass._limit);
  //   return query;
  // }

  // // Private functions

  // _selectQuery(Klass, reverse) {
  //   let query = this.query(Klass);
  //   query = reverse ? this._reverse(Klass, query) : this._order(Klass, query);
  //   return query.select(Klass.tableName + '.*');
  // }

  // _buildQuery(currentQuery, scope, queryTypeParam, args) {
  //   const queryType = queryTypeParam || 'where';
  //   if (isEmpty(scope) && isEmpty(args)) return currentQuery;
  //   if (isPlainObject(scope)) {
  //     const scopeKeys = keys(scope);
  //     const specialKeys = filter(scopeKeys, (key) => startsWith(key, '$'));
  //     const simpleScope = omit(scope, specialKeys);
  //     const connector = this;
  //     currentQuery[queryType](function () {
  //       let query = this;
  //       if (!isEmpty(simpleScope)) {
  //         query = query.where(simpleScope);
  //       }
  //       forEach(specialKeys, specialKey => {
  //         const key = specialKey.substr(1);
  //         connector._buildSpecialQuery(key, specialKey, scope, query);
  //       });
  //     });
  //   } else {
  //     if (args) {
  //       currentQuery[queryType].apply(currentQuery, args);
  //     } else {
  //       currentQuery[queryType](scope);
  //     }
  //   }
  // }

  // _buildSpecialQuery(key, specialKey, scope, query) {
  //   switch (true) {
  //     case /^(and|or)$/.test(key): {
  //       this._buildNestedQuery(key, specialKey, scope, query);
  //       break;
  //     }
  //     case /^(not|null|notNull)$/.test(key): {
  //       this._buildNegationQuery(key, specialKey, scope, query);
  //       break;
  //     }
  //     case /^(in|notIn|between|notBetween)$/.test(key): {
  //       this._buildRangeQuery(key, specialKey, scope, query);
  //       break;
  //     }
  //     case /^(eq|lt|lte|gt|gte)$/.test(key): {
  //       this._buildEquationQuery(key, specialKey, scope, query);
  //       break;
  //     }
  //     case /^(raw)$/.test(key): {
  //       this._buildRawQuery(key, specialKey, scope, query);
  //       break;
  //     }
  //     default: {
  //       throw new Error(`Unknown special command '${key}'`);
  //     }
  //   }
  // }

  // _buildNestedQuery(key, specialKey, scope, query) {
  //   const subQueryType = key + 'Where';
  //   forEach(scope[specialKey], subScope => {
  //     this._buildQuery(query, subScope, subQueryType);
  //   });
  // }

  // _buildNegationQuery(key, specialKey, scope, query) {
  //   const subQueryType = 'where' + upperFirst(key);
  //   this._buildQuery(query, scope[specialKey], subQueryType);
  // }

  // _buildRangeQuery(key, specialKey, scope, query) {
  //   const subQueryType = 'where' + upperFirst(key);
  //   forEach(scope[specialKey], (value, key) => {
  //     this._buildQuery(query, value, subQueryType, [key, value]);
  //   });
  // }

  // _buildEquationQuery(key, specialKey, scope, query) {
  //   let operator;
  //   switch (key) {
  //     case 'eq': operator = '='; break;
  //     case 'lt': operator = '<'; break;
  //     case 'lte': operator = '<='; break;
  //     case 'gt': operator = '>'; break;
  //     case 'gte': operator = '>='; break;
  //   }
  //   forEach(scope[specialKey], (value, key) => {
  //     this._buildQuery(query, value, 'where', [key, operator, value]);
  //   });
  // }

  // _buildRawQuery(key, specialKey, scope, query) {
  //   const subQueryType = 'where' + upperFirst(key);
  //   forEach(scope[specialKey], (value, key) => {
  //     this._buildQuery(query, value, subQueryType, [key, value]);
  //   });
  // }

  // _table(Klass) {
  //   return this.knex(Klass.tableName);
  // }

  // _order(Klass, query) {
  //   if (Klass.defaultOrder) {
  //     for (const key in Klass.defaultOrder) {
  //       const direction = Klass.defaultOrder[key] === 'desc' ? 'desc' : 'asc';
  //       query = query.orderBy(key, direction);
  //     }
  //   }
  //   return query;
  // }

  // _reverse(Klass, query) {
  //   if (Klass.defaultOrder) {
  //     for (const key in Klass.defaultOrder) {
  //       const direction = Klass.defaultOrder[key] === 'desc' ? 'asc' : 'desc';
  //       query = query.orderBy(key, direction);
  //     }
  //   }
  //   return query;
  // }
};

export default NextModelKnexConnector;
