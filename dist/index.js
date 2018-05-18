"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var knex_1 = require("knex");
var core_1 = require("@next-model/core");
var KnexConnector = (function () {
    function KnexConnector(options) {
        this.knex = knex_1.default(options);
    }
    KnexConnector.prototype.tableName = function (model) {
        if (model.collectionName !== undefined) {
            return model.collectionName;
        }
        else {
            return model.pluralModelName;
        }
    };
    KnexConnector.prototype.table = function (model) {
        return this.knex(this.tableName(model));
    };
    KnexConnector.prototype.propertyFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, query.where(filter)];
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
                        self.filter(this, filter);
                    });
                };
                for (_i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
                    filter = filters_1[_i];
                    _loop_1(filter);
                }
                return [2, query];
            });
        });
    };
    KnexConnector.prototype.notFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var self;
            return __generator(this, function (_a) {
                self = this;
                return [2, query.whereNot(function () {
                        self.filter(this, filter);
                    })];
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
                return [2, query];
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
                    return [2, query.whereIn(key, filter[key])];
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
                    return [2, query.whereNotIn(key, filter[key])];
                }
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.nullFilter = function (query, key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, query.whereNull(key)];
            });
        });
    };
    KnexConnector.prototype.notNullFilter = function (query, key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, query.whereNotNull(key)];
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
                        return [2, query.andWhereBetween(key, [filterBetween.from, filterBetween.to])];
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
                        return [2, query.andWhereNotBetween(key, [filterBetween.from, filterBetween.to])];
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
                    return [2, query.where(key, '>', filter[key])];
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
                        return [2, query.where(key, '>=', value)];
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
                        return [2, query.where(key, '<', value)];
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
                        return [2, query.where(key, '<=', value)];
                    }
                }
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.rawFilter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, query.whereRaw(filter.$query, filter.$bindings)];
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
                        return [4, filter];
                    case 1: return [2, _a.apply(this, _b.concat([_c.sent()]))];
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
                    return [2, this.andFilter(query, filter.$and)];
                if (filter.$or !== undefined)
                    return [2, this.orFilter(query, filter.$or)];
                if (filter.$not !== undefined)
                    return [2, this.notFilter(query, filter.$not)];
                if (filter.$in !== undefined)
                    return [2, this.inFilter(query, filter.$in)];
                if (filter.$notIn !== undefined)
                    return [2, this.notInFilter(query, filter.$notIn)];
                if (filter.$null !== undefined)
                    return [2, this.nullFilter(query, filter.$null)];
                if (filter.$notNull !== undefined)
                    return [2, this.notNullFilter(query, filter.$notNull)];
                if (filter.$between !== undefined)
                    return [2, this.betweenFilter(query, filter.$between)];
                if (filter.$notBetween !== undefined)
                    return [2, this.notBetweenFilter(query, filter.$notBetween)];
                if (filter.$gt !== undefined)
                    return [2, this.gtFilter(query, filter.$gt)];
                if (filter.$gte !== undefined)
                    return [2, this.gteFilter(query, filter.$gte)];
                if (filter.$lt !== undefined)
                    return [2, this.ltFilter(query, filter.$lt)];
                if (filter.$lte !== undefined)
                    return [2, this.lteFilter(query, filter.$lte)];
                if (filter.$async !== undefined)
                    return [2, this.asyncFilter(query, filter.$async)];
                if (filter.$raw !== undefined)
                    return [2, this.rawFilter(query, filter.$raw)];
                throw '[TODO] Should not reach error';
            });
        });
    };
    KnexConnector.prototype.filter = function (query, filter) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                for (key in filter) {
                    if (key.startsWith('$')) {
                        return [2, this.specialFilter(query, filter)];
                    }
                }
                return [2, this.propertyFilter(query, filter)];
            });
        });
    };
    KnexConnector.prototype.collection = function (model) {
        return __awaiter(this, void 0, void 0, function () {
            var table, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        table = this.table(model);
                        return [4, this.filter(table, model.filter)];
                    case 1:
                        query = _a.sent();
                        if (model.limit < Number.MAX_SAFE_INTEGER) {
                            query = query.limit(model.limit);
                        }
                        if (model.skip > 0) {
                            query = query.offset(model.skip);
                        }
                        return [2, query];
                }
            });
        });
    };
    KnexConnector.prototype.query = function (model) {
        return __awaiter(this, void 0, void 0, function () {
            var query, _i, _a, order, key, direction, rows, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.collection(model)];
                    case 1:
                        query = _b.sent();
                        for (_i = 0, _a = model.order; _i < _a.length; _i++) {
                            order = _a[_i];
                            for (key in order) {
                                direction = order[key] === core_1.OrderDirection.asc ? 'asc' : 'desc';
                                query = query.orderBy(key, direction);
                            }
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4, query.select('*')];
                    case 3:
                        rows = _b.sent();
                        return [2, rows.map(function (row) { return new model(row); })];
                    case 4:
                        error_1 = _b.sent();
                        throw error_1;
                    case 5: return [2];
                }
            });
        });
    };
    KnexConnector.prototype.select = function (model) {
        var keys = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            keys[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var query, _a, _b, order, key, direction, rows, error_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4, this.collection(model)];
                    case 1:
                        query = _c.sent();
                        for (_a = 0, _b = model.order; _a < _b.length; _a++) {
                            order = _b[_a];
                            for (key in order) {
                                direction = order[key] === core_1.OrderDirection.asc ? 'asc' : 'desc';
                                query = query.orderBy(key, direction);
                            }
                        }
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4, query.select.apply(query, keys)];
                    case 3:
                        rows = _c.sent();
                        return [2, rows];
                    case 4:
                        error_2 = _c.sent();
                        throw error_2;
                    case 5: return [2];
                }
            });
        });
    };
    KnexConnector.prototype.count = function (model) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.collection(model)];
                    case 1:
                        query = _a.sent();
                        return [4, query.count()];
                    case 2:
                        rows = _a.sent();
                        if (rows.length >= 0) {
                            for (key in rows[0]) {
                                return [2, rows[0][key]];
                            }
                        }
                        throw '[TODO] Should not reach error';
                }
            });
        });
    };
    KnexConnector.prototype.updateAll = function (model, attrs) {
        return __awaiter(this, void 0, void 0, function () {
            var query, count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.collection(model)];
                    case 1:
                        query = _a.sent();
                        count = query.update(attrs);
                        return [2, count];
                }
            });
        });
    };
    KnexConnector.prototype.deleteAll = function (model) {
        return __awaiter(this, void 0, void 0, function () {
            var query, count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.collection(model)];
                    case 1:
                        query = _a.sent();
                        return [4, query.del()];
                    case 2:
                        count = _a.sent();
                        return [2, count];
                }
            });
        });
    };
    KnexConnector.prototype.create = function (instance) {
        return __awaiter(this, void 0, void 0, function () {
            var model, table, data, ids;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        model = instance.model;
                        table = this.table(model);
                        data = instance.attributes;
                        delete data[model.identifier];
                        return [4, table.insert(data, this.identifier(model))];
                    case 1:
                        ids = _a.sent();
                        instance.id = ids[0];
                        return [2, instance];
                }
            });
        });
    };
    KnexConnector.prototype.update = function (instance) {
        return __awaiter(this, void 0, void 0, function () {
            var model, identifier, table, data, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        model = instance.model;
                        identifier = model.identifier;
                        table = this.table(model);
                        data = instance.attributes;
                        return [4, table.where((_a = {}, _a[identifier] = instance.id, _a)).update(data)];
                    case 1:
                        _b.sent();
                        return [2, instance];
                }
            });
        });
    };
    KnexConnector.prototype.delete = function (instance) {
        return __awaiter(this, void 0, void 0, function () {
            var model, identifier, table;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        model = instance.model;
                        identifier = model.identifier;
                        table = this.table(model);
                        return [4, table.where(identifier, instance.id).del()];
                    case 1:
                        _a.sent();
                        instance.id = undefined;
                        return [2, instance];
                }
            });
        });
    };
    KnexConnector.prototype.identifier = function (model) {
        if (this.knex.client.config.client === 'sqlite3') {
            return undefined;
        }
        else {
            return model.identifier;
        }
    };
    KnexConnector.prototype.execute = function (query, bindings) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.knex.raw(query, bindings)];
                    case 1:
                        rows = _a.sent();
                        if (this.knex.client.config.client === 'sqlite3') {
                            return [2, rows];
                        }
                        else if (this.knex.client.config.client === 'postgres') {
                            return [2, rows.rows];
                        }
                        else {
                            return [2, rows[0]];
                        }
                        return [2];
                }
            });
        });
    };
    return KnexConnector;
}());
exports.KnexConnector = KnexConnector;
;
exports.default = KnexConnector;
//# sourceMappingURL=index.js.map