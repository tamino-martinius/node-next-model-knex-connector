try {
  const pg = require('pg')
  pg.types.setTypeParser(20, 'text', parseInt)
} catch (e) { }

import Knex from 'knex';
import {
  Identifiable,
  ConnectorConstructor,
  ModelStatic,
  ModelConstructor,
  Bindings,
  FilterSpecial,
  Filter,
  FilterIn,
  FilterBetween,
  FilterRaw,
  BaseType,
  OrderDirection,
} from '@next-model/core';

export class KnexConnector<S extends Identifiable> implements ConnectorConstructor<S> {
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

  private async propertyFilter(query: Knex.QueryBuilder, filter: Partial<S>): Promise<Knex.QueryBuilder> {
    return query.where(filter);
  }

  private async andFilter(query: Knex.QueryBuilder, filters: Filter<S>[]): Promise<Knex.QueryBuilder> {
    const self = this;
    for (const filter of filters) {
      query = query.andWhere(function () {
        self.filter(this, filter);
      });
    }
    return query;
  }

  private async notFilter(query: Knex.QueryBuilder, filter: Filter<S>): Promise<Knex.QueryBuilder> {
    const self = this;
    return query.whereNot(function () {
      self.filter(this, filter);
    });
  }

  private async orFilter(query: Knex.QueryBuilder, filters: Filter<S>[]): Promise<Knex.QueryBuilder> {
    const self = this;
    for (const filter of filters) {
      query = query.orWhere(function () {
        self.filter(this, filter);
      });
    }
    return query;
  }

  private async inFilter(query: Knex.QueryBuilder, filter: Partial<FilterIn<S>>): Promise<Knex.QueryBuilder> {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      return query.whereIn(key, <any>filter[key]);
    }
    throw '[TODO] Should not reach error';
  }

  private async notInFilter(query: Knex.QueryBuilder, filter: Partial<FilterIn<S>>): Promise<Knex.QueryBuilder> {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      return query.whereNotIn(key, <any>filter[key]);
    }
    throw '[TODO] Should not reach error';
  }

  private async nullFilter(query: Knex.QueryBuilder, key: keyof S): Promise<Knex.QueryBuilder> {
    return query.whereNull(key);
  }

  private async notNullFilter(query: Knex.QueryBuilder, key: keyof S): Promise<Knex.QueryBuilder> {
    return query.whereNotNull(key);
  }

  private async betweenFilter(query: Knex.QueryBuilder, filter: Partial<FilterBetween<S>>): Promise<Knex.QueryBuilder> {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      const filterBetween = filter[key];
      if (filterBetween !== undefined) {
        return query.andWhereBetween(key, [<any>filterBetween.from, <any>filterBetween.to])
      }
    }
    throw '[TODO] Should not reach error';
  }

  private async notBetweenFilter(query: Knex.QueryBuilder, filter: Partial<FilterBetween<S>>): Promise<Knex.QueryBuilder> {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      const filterBetween = filter[key];
      if (filterBetween !== undefined) {
        return query.andWhereNotBetween(key, [<any>filterBetween.from, <any>filterBetween.to])
      }
    }
    throw '[TODO] Should not reach error';
  }

  private async gtFilter(query: Knex.QueryBuilder, filter: Partial<S>): Promise<Knex.QueryBuilder> {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      return query.where(key, '>', <any>filter[key]);
    }
    throw '[TODO] Should not reach error';
  }

  private async gteFilter(query: Knex.QueryBuilder, filter: Partial<S>): Promise<Knex.QueryBuilder> {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      const value: BaseType = <any>filter[key];
      if (value !== undefined) {
        return query.where(key, '>=', value);
      }
    }
    throw '[TODO] Should not reach error';
  }

  private async ltFilter(query: Knex.QueryBuilder, filter: Partial<S>): Promise<Knex.QueryBuilder> {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      const value: BaseType = <any>filter[key];
      if (value !== undefined) {
        return query.where(key, '<', value);
      }
    }
    throw '[TODO] Should not reach error';
  }

  private async lteFilter(query: Knex.QueryBuilder, filter: Partial<S>): Promise<Knex.QueryBuilder> {
    if (Object.keys(filter).length !== 1) throw '[TODO] Return proper error';
    for (const key in filter) {
      const value: BaseType = <any>filter[key];
      if (value !== undefined) {
        return query.where(key, '<=', value);
      }
    }
    throw '[TODO] Should not reach error';
  }

  private async rawFilter(query: Knex.QueryBuilder, filter: FilterRaw): Promise<Knex.QueryBuilder> {
    return query.whereRaw(filter.$query, <any>filter.$bindings);
  }

  private async asyncFilter(query: Knex.QueryBuilder, filter: Promise<Filter<S>>): Promise<Knex.QueryBuilder> {
    return this.filter(query, await filter);
  }

  private async specialFilter(query: Knex.QueryBuilder, filter: FilterSpecial<S>): Promise<Knex.QueryBuilder> {
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
    if (filter.$async !== undefined)
      return this.asyncFilter(query, filter.$async);
    if (filter.$raw !== undefined)
      return this.rawFilter(query, filter.$raw);
    throw '[TODO] Should not reach error';
  }

  private async filter(query: Knex.QueryBuilder, filter: Filter<S>): Promise<Knex.QueryBuilder> {
    for (const key in filter) {
      if (key.startsWith('$')) {
        return this.specialFilter(query, <FilterSpecial<S>>filter);
      }
    }
    return this.propertyFilter(query, <Partial<S>>filter);
  }

  private async collection(model: ModelStatic<S>): Promise<Knex.QueryBuilder> {
    const table = this.table(model);
    let query = await this.filter(table, model.filter);
    if (model.limit < Number.MAX_SAFE_INTEGER) {
      query = query.limit(model.limit);
    }
    if (model.skip > 0) {
      query = query.offset(model.skip);
    }
    return query;
  }

  async query(model: ModelStatic<S>): Promise<ModelConstructor<S>[]> {
    let query = await this.collection(model);
    for (const order of model.order) {
      for (const key in order) {
        const direction = order[key] === OrderDirection.asc ? 'asc' : 'desc';
        query = query.orderBy(key, direction);
      }
    }
    try {
      const rows: S[] = await query.select('*');
      return rows.map(row => new model(row));
    } catch (error) {
      throw error;
    }
  }

  async select(model: ModelStatic<S>, ...keys: (keyof S)[]): Promise<S[keyof S][][]> {
    let query = await this.collection(model);
    for (const order of model.order) {
      for (const key in order) {
        const direction = order[key] === OrderDirection.asc ? 'asc' : 'desc';
        query = query.orderBy(key, direction);
      }
    }
    try {
      const rows: S[keyof S][][] = await query.select(...keys);
      return rows;
    } catch (error) {
      throw error;
    }
  }


  async count(model: ModelStatic<S>): Promise<number> {
    const query = await this.collection(model);
    const rows: S[] = await query.count();
    if (rows.length >= 0) {
      for (const key in rows[0]) {
        return <any>rows[0][key];
      }
    }
    throw '[TODO] Should not reach error';
  }

  async updateAll(model: ModelStatic<S>, attrs: Partial<S>): Promise<number> {
    const query = await this.collection(model);
    const count: number = query.update(attrs);
    return count;
  }

  async deleteAll(model: ModelStatic<S>): Promise<number> {
    const query = await this.collection(model);
    const count: number = await query.del();
    return count;
  }

  async create(instance: ModelConstructor<S>): Promise<ModelConstructor<S>> {
    const model = instance.model;
    // const identifier = model.identifier;
    const table = this.table(model);
    const data = instance.attributes;
    delete (<any>data)[model.identifier];
    const ids = await table.insert(data, this.identifier(model));
    instance.id = ids[0];
    return instance;
  }

  async update(instance: ModelConstructor<S>): Promise<ModelConstructor<S>> {
    const model = instance.model;
    const identifier = model.identifier;
    const table = this.table(model);
    const data = instance.attributes;
    await table.where({ [identifier]: instance.id }).update(data);
    return instance;
  }

  async delete(instance: ModelConstructor<S>): Promise<ModelConstructor<S>> {
    const model = instance.model;
    const identifier = model.identifier;
    const table = this.table(model);
    await table.where(identifier, instance.id).del();
    instance.id = undefined;
    return instance;
  }

  private identifier(model: ModelStatic<S>): string | undefined {
    if (this.knex.client.config.client === 'sqlite3') {
      return undefined;
    } else {
      return model.identifier;
    }
  }

  async execute(query: string, bindings: Bindings): Promise<any[]> {
    const rows: any = await this.knex.raw(query, <any>bindings);
    if (this.knex.client.config.client === 'sqlite3') {
      return rows;
    } else if (this.knex.client.config.client === 'postgres') {
      return rows.rows;
    } else {
      return rows[0];
    }
  }
};

export default KnexConnector;
