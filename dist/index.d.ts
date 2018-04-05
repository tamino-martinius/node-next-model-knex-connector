/// <reference types="knex" />
import Knex from 'knex';
import { Identifiable, ConnectorConstructor, ModelStatic, ModelConstructor, Bindings } from '@next-model/core';
export declare class KnexConnector<S extends Identifiable> implements ConnectorConstructor<S> {
    knex: Knex;
    constructor(options: Knex.Config);
    private tableName(model);
    private table(model);
    private propertyFilter(query, filter);
    private andFilter(query, filters);
    private notFilter(query, filter);
    private orFilter(query, filters);
    private inFilter(query, filter);
    private notInFilter(query, filter);
    private nullFilter(query, key);
    private notNullFilter(query, key);
    private betweenFilter(query, filter);
    private notBetweenFilter(query, filter);
    private gtFilter(query, filter);
    private gteFilter(query, filter);
    private ltFilter(query, filter);
    private lteFilter(query, filter);
    private rawFilter(query, filter);
    private specialFilter(query, filter);
    private filter(query, filter);
    private collection(model);
    query(model: ModelStatic<S>): Promise<ModelConstructor<S>[]>;
    count(model: ModelStatic<S>): Promise<number>;
    updateAll(model: ModelStatic<S>, attrs: Partial<S>): Promise<number>;
    deleteAll(model: ModelStatic<S>): Promise<number>;
    create(instance: ModelConstructor<S>): Promise<ModelConstructor<S>>;
    update(instance: ModelConstructor<S>): Promise<ModelConstructor<S>>;
    delete(instance: ModelConstructor<S>): Promise<ModelConstructor<S>>;
    execute(query: string, bindings: Bindings): Promise<any[]>;
}
export default KnexConnector;
