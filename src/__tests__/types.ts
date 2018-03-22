import Knex from 'knex';

export interface Context {
  definitions: () => void;
  tests: () => void;
  reset?: () => void,
};

export const it = test;

export const context = (description: string, { definitions, tests, reset }: Context) => {
  describe(description, () => {
    beforeEach(definitions);
    tests();
    if (reset !== undefined) {
      afterEach(reset);
    }
  });
};

export type Connection = Knex.Sqlite3ConnectionConfig | Knex.MySqlConnectionConfig;
