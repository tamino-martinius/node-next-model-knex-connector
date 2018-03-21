import Knex from 'knex';
import {
  Identifiable,
  ConnectorConstructor,
  ModelStatic,
  ModelConstructor,
  Bindings
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


  query(model: ModelStatic<S>): Promise<ModelConstructor<S>[]> {

  }

  count(model: ModelStatic<S>): Promise<number> {

  }

  updateAll(model: ModelStatic<S>, attrs: Partial<S>): Promise<ModelConstructor<S>[]> {

  }

  deleteAll(model: ModelStatic<S>): Promise<ModelConstructor<S>[]> {

  }

  delete(instance: ModelConstructor<S>): Promise<ModelConstructor<S>> {

  }

  execute(query: string, bindings: Bindings): Promise<any[]> {

  }

};

export default NextModelKnexConnector;
