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
  OrderDirection,
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
      return model.pluralModelName;
    }
  }

  private table(model: ModelStatic<S>): Knex.QueryBuilder {
    return this.knex(this.tableName(model));
  }

  private propertyFilter(query: Knex.QueryBuilder, filter: FilterProperty<S>): Knex.QueryBuilder {
    return query.where(filter);
  }

  private andFilter(query: Knex.QueryBuilder, filters: Filter<S>[]): Knex.QueryBuilder {
    const self = this;
    for (const filter of filters) {
      query = query.andWhere(function () {
        self.filter(this, filter);
      });
    }
    return query;
  }

  private notFilter(query: Knex.QueryBuilder, filter: Filter<S>): Knex.QueryBuilder {
    const self = this;
    return query.whereNot(function () {
      self.filter(this, filter);
    });
  }

  private orFilter(query: Knex.QueryBuilder, filters: Filter<S>[]): Knex.QueryBuilder {
    const self = this;
    for (const filter of filters) {
      query = query.orWhere(function () {
        self.filter(this, filter);
      });
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
};

export default NextModelKnexConnector;
