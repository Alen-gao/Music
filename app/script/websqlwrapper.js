!function(name, definition, global){
    if (typeof define === 'function') {// AMD
        define(definition);
    } else if (typeof module !== 'undefined' && module.exports) {// CommonJS
        module.exports = definition();
    } else {// normal
        global[name] = definition();
    }
}('WebsqlWrapper', function(){
    "use strict";
    /**
     * WebsqlWrapper websql操作库
     * ver:1.0
     * 2013/2/7
     * mailto: willian12345@126.com
     */
    
    var init
    , Database
    , Table
    , WebsqlWrapper
    , emptyHandle
    , errorHandle
    , Utils
    , convertToSQL
    , log
    , DEBUG = false
    , slice = Array.prototype.slice
    ;

    /**
     * [init 初始化此模块中所有变量]
     */
    init = function(){
        Utils = {};
        Utils.types = ["Array", "Boolean", "Date", "Number", "Object", "RegExp", "String", 'Function'];
        Utils.is = {};
        for(var i = 0, c; c = Utils.types[i++];){
            Utils.is[c] = (function(type){
                return function(obj){
                    if(!obj) return false;
                    return Object.prototype.toString.call(obj) == "[object " + type + "]";
                }
            })(c);
        }

        log = function( a ){
            if( DEBUG ) {
                console.log.apply(console, arguments);
            }
        };

        emptyHandle = function(){};
        errorHandle = function( tx, err, sql ){
            log( '最后一句异常 SQL: ' + sql );
        };

        // 转换 a === b && b == c 语句成sql语法
        convertToSQL = function( sql ){
            return sql.replace( /(?:&&)/,'AND' ).replace( /(?:[==|===])+/g, '=' );
        };
    };

    /**
     * [数据表构造函数]
     * eg: db.instance('codebook').get('code=2', function(){})
     */
    Table = function(name, db, websqlWrapper){
        this.name = name;
        this.db = db;
        this.super = websqlWrapper;
    };
    Table.prototype = {
        makeArgs: function( args ){
            args = slice.call(args, 0);
            args.unshift(this.name);
            return args;
        }
    };

    // 延迟至用到时才创建 table 的实例方法
    ['update', 'insert', 'save', 'get', 'del', 'drop', 'batch'].forEach(function(v,i){
        Table.prototype[v] = function(){
            this.super[v].apply(this.super, this.makeArgs(arguments));
            return this;
        }
    });
    ///
    ['query', 'count'].forEach(function(v){
        Table.prototype[v] = function(){
            this.super[v].apply(this.super, arguments);
            return this;
        };
    });

    // websqlWrapper 构造函数
    WebsqlWrapper = function ( opts ) {
        try {  
            if (!window.openDatabase) {  
                alert('Databases are not supported in this browser.');  
            } else {  
                var shortName = opts.name;  
                var version = opts.version;  
                var displayName = opts.displayName;  
                var maxSize = opts.maxSize || 100000; //  bytes 
                
                if(opts.debug){
                    DEBUG = opts.debug;
                }

                this.db = openDatabase(shortName, version, displayName, maxSize);
                opts.success && opts.success.call(this, this.db);
            }  
        } catch(e) {
            if (e == 2) {
                // Version number mismatch.  
                log("Invalid database version.");  
            } else {  
                log("Unknown error "+e+".");  
            }  
            opts.fail && opts.fail.call(this, e);
            return ;
        }
        this.events = {};  
    };
    WebsqlWrapper.setDebug = function( bool ){
        DEBUG = bool;
    };
    WebsqlWrapper.prototype = {
        query: function(sql, rowParam, cb){
            var params = []
            , isSave = false
            , self = this
            , cmdStr
            ;
            if(Utils.is.Function(rowParam)){
                cb = rowParam;
            }
            if(Utils.is.Array(rowParam)){
                params = rowParam;
            }
            if(!cb){
                cb = emptyHandle;
            }
            cmdStr = sql.slice(0, 6).toLocaleUpperCase();
            if(cmdStr === 'UPDATE' || cmdStr === 'INSERT'){
                isSave = true;
            }
            log(sql, params);
            this.db.transaction(  
                function (transaction) {  
                    transaction.executeSql(sql, params, function(tx, results){
                        var arr = [], row, i;
                        for (i=0; i<results.rows.length; i++) {   
                            row = results.rows.item(i); 
                           arr.push(row);
                        }
                        cb(arr);
                    }
                    , function(tx, e){
                        cb(null);
                        errorHandle.apply(this, [tx, e, sql]);
                    }); 
                }  
            ); 
            return this;
        }
        , define: function( tableName, o , cb ){
            var sql, s;
            if(!Utils.is.Object(o)){
                log('定义表格需要传入字段对象');
                return ;
            }
            s = JSON.stringify(o).replace(/[":\{\}]/g, ' ');
            sql = 'CREATE TABLE IF NOT EXISTS '+tableName+'('+ s +')';
            this.query(sql, cb);
        }
        , update: function(tableName, values, where, cb){
            var k, filed, _values;
            if(!Utils.is.Object(values)) return false;

            filed = [];
            _values = [];
            for(k in values){
                filed.push(k);
                _values.push(values[k]);
            }
            filed = filed.join(',');

            var sql = 'UPDATE '+ tableName +' SET '+ filed.replace(/,/g, '=?,') +'=? ';
            if(where){
                where = where + '=' + values[where];
                sql += 'WHERE '+ where;
            }
            sql += ';';
            this.query(sql, _values, cb);
            return this;
        }
        , insert: function(tableName, values, cb){
            var k, filed, _values;
            if(!Utils.is.Object(values)) return false;
            filed = [];
            _values = [];
            for(k in values){
                filed.push(k);
                _values.push(values[k])
            }
            filed = filed.join(',');
            var sql = 'INSERT INTO '+ tableName +'('+ filed +') VALUES ('+ filed.replace(/[a-zA-Z-_\d]+/g, '?') +');';
            this.query(sql, _values, cb);
            return this;
        }
        , save: function(tableName, values, key, cb){
            var args, k, _filed, _values, where, sql;
            if(!tableName || !Utils.is.Object(values) || !key) return this;
            sql = 'SELECT count(*) FROM '+ tableName;
            if(Utils.is.String(key)){
                where = key + '=' + values[key];
                sql +=' WHERE '+ where;
            }
            sql += ' ;';
            this.count(sql, function(r){
                if(r === 0){
                    this.insert.apply(this, [tableName, values, cb]);
                }else{
                    this.update.apply(this, [tableName, values, key, cb]);
                }
            }.bind(this));
            return this;
        }
        , count: function(sql, cb){
            this.query(sql, function(r){
                if(r.length){
                    r = r[0];
                    cb(r['count(*)']);
                }else{
                    cb(0);
                }
            });

            return this;
        }
        /**
         * [get 查询数据]
         * @param  {[type]}   tableName [table名称]
         * @param  {[type]}   where     [SQL条件语句]
         * @param  {Function} cb        [回调]
         * @return {[type]}             [this]
         */
        , get: function(tableName, where, cb){
            var sql = 'SELECT * FROM '+ tableName ;
            if(Utils.is.String(where)){
                sql += ' WHERE '+ convertToSQL(where);
            }else if(Utils.is.Function(where)){
                cb = where;
            }
            sql += ';';
            this.query(sql, cb);
            return this;
        }
        /**
         * [del 删除命令]
         * @param  {String}   tableName [table名称]
         * @param  {[String]}   where     [SQL条件语句]
         * @param  {Function} cb        [回调]
         * @return {[type]}             [this]
         */
        , del: function(tableName, where, cb){
           var sql = 'DELETE FROM '+ tableName ;
            if(where){
                sql += ' WHERE ' + convertToSQL(where);
            }else{
                cb = where;
            }
            sql += ';';
            this.query(sql, cb);
            return this; 
        }
        /**
         * [batch 批处理命令, 可批量进行save, insert, update, del]
         * @param  {[String]}   tableName [执行操作的table名]
         * @param  {Array}   arr       [批处理命令集]
         * @param  {[Function]} cb        [回调]
         * @return {[Object]} [this]
         */
        , batch: function(tableName, arr, cb){
            var i;
            if(Utils.is.Array(tableName)){
                cb = arr;
                arr = tableName;
            }

            if(!Utils.is.Array(arr)) {
                return ;
            }

            i = arr.length;
            arr.forEach(function(v){
                var item = v.item
                , args = v.args // 特殊参数用于update, save 传递key参数
                , _cb  = function(){
                        if(--i === 0){
                            cb();
                        }
                    }
                ;
                // 没有特殊参数则第三个参数为本次操作的回调
                if(!args) args = _cb;
                if(v.tableName){
                    tableName = v.tableName;
                }
                
                if(v.type === 'query'){
                    this['query'](item, _cb);
                }else{
                    this[v.type](tableName, item, args, _cb);   
                }
            }.bind(this));
            return this;
        }
        /*
         * 同個交易中批次執行原生SQL指令
         * 
         */
        , batchExec: function(arr, cb) {
            var i;

            if (!Utils.is.Array(arr)) {
                return;
            }

            i = arr.length;
            this.db.transaction(function(tx) {
                arr.forEach(function(v) {
                    var sql = v;
                    tx.executeSql(sql, [], function(tx, results) {
                        //console.log('SQL Batch Executed, ' + sql);
                    }, function(tx, e) {
                        cb(null);
                        errorHandle.apply(this, [tx, e, sql]);
                    });
                });
            }.bind(this));
            return this;
        }
        /**
         * [drop 删除表]
         * @param  {[String]} tableName [tabel名称]
         * @return {[Object]}           [this]
         */
        , drop: function(tableName){
            this.query("DROP TABLE IF EXISTS "+ tableName +";", function(){
                log('dropped!');
            });
            log("Table "+ tableName +" has been dropped.");
            return this;
        }
        /**
         * [instance 表实例]
         * @param  {[type]} tableName [table名]
         * @return {[Object]}           [this]
         */
        , instance: function(tableName){
            return new Table(tableName, this.db, this);
        }
    };

    init();

    return function(data){
        return new WebsqlWrapper(data);
    };
}, this);

