# History

## vNext

Add new queries for
* `$exists`

## v0.2.0

Added new query types for **Equation** and **Raw** Queries
* `$eq`
* `$lt`
* `$lte`
* `$gt`
* `$gte`
* `$raw`

## v0.1.0

Used next-model from npm instead of Github repo

## v0.0.4

Updated NextModel package to `v0.0.4`.
Added missing entries to documentation.

## v0.0.3

Added CI to prove that the connector is working with
* MySQL
* Postgres
* sqlite3

## v0.0.2

Added more complex query types:
* `$and`
* `$or`
* `$not`
* `$null`
* `$notNull`
* `$in`
* `$notIn`
* `$between`
* `$notBetween`

The queries for `and`, `or` and `not` are able to nest.

## v0.0.1

First release compatible with NextModel **0.0.1**.

Implements all connector functions.

Includes tests for sqlite3.
