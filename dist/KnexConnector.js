"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
try {
    var pg = require('pg');
    pg.types.setTypeParser(20, 'text', parseInt);
}
catch (e) { }
var Knex = require("knex");
var core_1 = require("@next-model/core");
var KnexConnector = /** @class */ (function () {
    function KnexConnector(options) {
        this.knex = Knex(options);
    }
    KnexConnector.prototype.table = function (tableName) {
        return this.knex(tableName);
    };
    KnexConnector.prototype.propertyFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                query = query.where(filter);
                return [2 /*return*/, { query: query }];
            });
        });
    };
    KnexConnector.prototype.andFilter = function (query, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var self, _loop_1, _i, filters_1, filter;
            return __generator(this, function (_a) {
                self = this;
                _loop_1 = function (filter) {
                    query = query.andWhere(function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, self.filter(this, filter)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                };
                for (_i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
                    filter = filters_1[_i];
                    _loop_1(filter);
                }
                return [2 /*return*/, { query: query }];
            });
        });
    };
    KnexConnector.prototype.notFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var self;
            return __generator(this, function (_a) {
                self = this;
                query = query.whereNot(function () {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, self.filter(this, filter)];
                                case 1:
                                    (_a.sent()).query;
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
                return [2 /*return*/, { query: query }];
            });
        });
    };
    KnexConnector.prototype.orFilter = function (query, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var self, _loop_2, _i, filters_2, filter;
            return __generator(this, function (_a) {
                self = this;
                _loop_2 = function (filter) {
                    query = query.orWhere(function () {
                        self.filter(this, filter);
                    });
                };
                for (_i = 0, filters_2 = filters; _i < filters_2.length; _i++) {
                    filter = filters_2[_i];
                    _loop_2(filter);
                }
                return [2 /*return*/, { query: query }];
            });
        });
    };
    KnexConnector.prototype.inFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                if (Object.keys(filter).length !== 1)
                    throw '[TODO] Return proper error';
                for (key in filter) {
                    return [2 /*return*/, { query: query.whereIn(key, filter[key]) }];
                }
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.notInFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                if (Object.keys(filter).length !== 1)
                    throw '[TODO] Return proper error';
                for (key in filter) {
                    return [2 /*return*/, { query: query.whereNotIn(key, filter[key]) }];
                }
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.nullFilter = function (query, key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { query: query.whereNull(key) }];
            });
        });
    };
    KnexConnector.prototype.notNullFilter = function (query, key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { query: query.whereNotNull(key) }];
            });
        });
    };
    KnexConnector.prototype.betweenFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var key, filterBetween;
            return __generator(this, function (_a) {
                if (Object.keys(filter).length !== 1)
                    throw '[TODO] Return proper error';
                for (key in filter) {
                    filterBetween = filter[key];
                    if (filterBetween !== undefined) {
                        return [2 /*return*/, { query: query.andWhereBetween(key, [filterBetween.from, filterBetween.to]) }];
                    }
                }
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.notBetweenFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var key, filterBetween;
            return __generator(this, function (_a) {
                if (Object.keys(filter).length !== 1)
                    throw '[TODO] Return proper error';
                for (key in filter) {
                    filterBetween = filter[key];
                    if (filterBetween !== undefined) {
                        return [2 /*return*/, {
                                query: query.andWhereNotBetween(key, [filterBetween.from, filterBetween.to]),
                            }];
                    }
                }
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.gtFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                if (Object.keys(filter).length !== 1)
                    throw '[TODO] Return proper error';
                for (key in filter) {
                    return [2 /*return*/, { query: query.where(key, '>', filter[key]) }];
                }
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.gteFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var key, value;
            return __generator(this, function (_a) {
                if (Object.keys(filter).length !== 1)
                    throw '[TODO] Return proper error';
                for (key in filter) {
                    value = filter[key];
                    if (value !== undefined) {
                        return [2 /*return*/, { query: query.where(key, '>=', value) }];
                    }
                }
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.ltFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var key, value;
            return __generator(this, function (_a) {
                if (Object.keys(filter).length !== 1)
                    throw '[TODO] Return proper error';
                for (key in filter) {
                    value = filter[key];
                    if (value !== undefined) {
                        return [2 /*return*/, { query: query.where(key, '<', value) }];
                    }
                }
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.lteFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var key, value;
            return __generator(this, function (_a) {
                if (Object.keys(filter).length !== 1)
                    throw '[TODO] Return proper error';
                for (key in filter) {
                    value = filter[key];
                    if (value !== undefined) {
                        return [2 /*return*/, { query: query.where(key, '<=', value) }];
                    }
                }
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.rawFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        query: query.whereRaw(filter.$query, filter.$bindings || []),
                    }];
            });
        });
    };
    KnexConnector.prototype.asyncFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this.filter;
                        _b = [query];
                        return [4 /*yield*/, filter];
                    case 1: return [2 /*return*/, _a.apply(this, _b.concat([_c.sent()]))];
                }
            });
        });
    };
    KnexConnector.prototype.specialFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (Object.keys(filter).length !== 1)
                    throw '[TODO] Return proper error';
                if (filter.$and !== undefined)
                    return [2 /*return*/, this.andFilter(query, filter.$and)];
                if (filter.$or !== undefined)
                    return [2 /*return*/, this.orFilter(query, filter.$or)];
                if (filter.$not !== undefined)
                    return [2 /*return*/, this.notFilter(query, filter.$not)];
                if (filter.$in !== undefined)
                    return [2 /*return*/, this.inFilter(query, filter.$in)];
                if (filter.$notIn !== undefined)
                    return [2 /*return*/, this.notInFilter(query, filter.$notIn)];
                if (filter.$null !== undefined)
                    return [2 /*return*/, this.nullFilter(query, filter.$null)];
                if (filter.$notNull !== undefined)
                    return [2 /*return*/, this.notNullFilter(query, filter.$notNull)];
                if (filter.$between !== undefined)
                    return [2 /*return*/, this.betweenFilter(query, filter.$between)];
                if (filter.$notBetween !== undefined)
                    return [2 /*return*/, this.notBetweenFilter(query, filter.$notBetween)];
                if (filter.$gt !== undefined)
                    return [2 /*return*/, this.gtFilter(query, filter.$gt)];
                if (filter.$gte !== undefined)
                    return [2 /*return*/, this.gteFilter(query, filter.$gte)];
                if (filter.$lt !== undefined)
                    return [2 /*return*/, this.ltFilter(query, filter.$lt)];
                if (filter.$lte !== undefined)
                    return [2 /*return*/, this.lteFilter(query, filter.$lte)];
                if (filter.$async !== undefined)
                    return [2 /*return*/, this.asyncFilter(query, filter.$async)];
                if (filter.$raw !== undefined)
                    return [2 /*return*/, this.rawFilter(query, filter.$raw)];
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.filter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!filter || Object.keys(filter).length === 0) {
                            return [2 /*return*/, { query: query }];
                        }
                        for (key in filter) {
                            if (key.startsWith('$')) {
                                return [2 /*return*/, this.specialFilter(query, filter)];
                            }
                        }
                        return [4 /*yield*/, this.propertyFilter(query, filter)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    KnexConnector.prototype.collection = function (scope) {
        return __awaiter(this, void 0, void 0, function () {
            var table, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        table = this.table(scope.tableName);
                        return [4 /*yield*/, this.filter(table, scope.filter)];
                    case 1:
                        query = (_a.sent()).query;
                        if (scope.limit !== undefined) {
                            query = query.limit(scope.limit);
                        }
                        if (scope.skip !== undefined) {
                            query = query.offset(scope.skip);
                        }
                        return [2 /*return*/, { query: query }];
                }
            });
        });
    };
    KnexConnector.prototype.query = function (scope) {
        return __awaiter(this, void 0, void 0, function () {
            var query, _i, _a, order, direction, rows, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.collection(scope)];
                    case 1:
                        query = (_b.sent()).query;
                        for (_i = 0, _a = scope.order || []; _i < _a.length; _i++) {
                            order = _a[_i];
                            direction = order.dir === core_1.SortDirection.Asc ? 'asc' : 'desc';
                            query = query.orderBy(order.key, direction);
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, query.select('*')];
                    case 3:
                        rows = _b.sent();
                        return [2 /*return*/, rows];
                    case 4:
                        error_1 = _b.sent();
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    KnexConnector.prototype.count = function (scope) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.collection(scope)];
                    case 1:
                        query = (_a.sent()).query;
                        return [4 /*yield*/, query.count()];
                    case 2:
                        rows = _a.sent();
                        if (rows.length >= 0) {
                            for (key in rows[0]) {
                                return [2 /*return*/, rows[0][key]];
                            }
                        }
                        throw '[TODO] Should not reach error';
                }
            });
        });
    };
    KnexConnector.prototype.select = function (scope) {
        var keys = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            keys[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var query, _a, _b, order, direction, rows, error_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.collection(scope)];
                    case 1:
                        query = (_c.sent()).query;
                        for (_a = 0, _b = scope.order || []; _a < _b.length; _a++) {
                            order = _b[_a];
                            direction = order.dir === core_1.SortDirection.Asc ? 'asc' : 'desc';
                            query = query.orderBy(order.key, direction);
                        }
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, query.select.apply(query, keys)];
                    case 3:
                        rows = _c.sent();
                        return [2 /*return*/, rows];
                    case 4:
                        error_2 = _c.sent();
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    KnexConnector.prototype.updateAll = function (scope, attrs) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.collection(scope)];
                    case 1:
                        query = (_a.sent()).query;
                        return [4 /*yield*/, query.update(attrs).returning(scope.tableName + ".*")];
                    case 2:
                        rows = _a.sent();
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    KnexConnector.prototype.deleteAll = function (scope) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.collection(scope)];
                    case 1:
                        query = (_a.sent()).query;
                        return [4 /*yield*/, query.del().returning(scope.tableName + ".*")];
                    case 2:
                        rows = _a.sent();
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    KnexConnector.prototype.batchInsert = function (tableName, keys, items) {
        return __awaiter(this, void 0, void 0, function () {
            var primaryKey, table, idsOrRows, rows, rowDict_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        primaryKey = Object.keys(keys)[0];
                        table = this.table(tableName);
                        return [4 /*yield*/, table.insert(items).returning(tableName + ".*")];
                    case 1:
                        idsOrRows = _a.sent();
                        if (!(idsOrRows.length > 0 && typeof idsOrRows[0] === 'number')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.table(tableName)
                                .whereIn(primaryKey, idsOrRows)
                                .select('*')];
                    case 2:
                        rows = (_a.sent());
                        rowDict_1 = {};
                        rows.map(function (row) { return (rowDict_1[row[primaryKey]] = row); });
                        return [2 /*return*/, idsOrRows.map(function (id) { return rowDict_1[id]; })];
                    case 3: return [2 /*return*/, idsOrRows];
                }
            });
        });
    };
    KnexConnector.prototype.execute = function (query, bindings) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.knex.raw(query, bindings)];
                    case 1:
                        rows = _a.sent();
                        if (this.knex.client.config.client === 'sqlite3') {
                            return [2 /*return*/, rows];
                        }
                        else if (this.knex.client.config.client === 'postgres') {
                            return [2 /*return*/, rows.rows];
                        }
                        else {
                            return [2 /*return*/, rows[0]];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return KnexConnector;
}());
exports.KnexConnector = KnexConnector;
exports.default = KnexConnector;
