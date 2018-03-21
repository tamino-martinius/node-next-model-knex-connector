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

};

export default NextModelKnexConnector;
