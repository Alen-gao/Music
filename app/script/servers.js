var table = null;
var db = WebsqlWrapper({
      name: 'musicDB'
    , displayName:'musicDB1'
    , version:1
});
db.define('music', {
	id: 'FLOAT',
	name:'TEXT',
	author:'TEXT',
	url: 'TEXT'
}, function(){
	table = db.instance('music');
});

var dao = function(){}
dao.prototype = {
	Search:function(id,callback){
		db.query('SELECT * FROM music where name='+id+'', function(data){
			 if(!data.length){
			 	callback();	
			 }
		});
	},
	insert: function(obj, callback){
		table.insert(obj,function(){
			callback();
		});
	},
	add: function(callback){
		db.query('SELECT * FROM music ', function(data){
			 if(data){
			 	callback(data);	
			 }
		});
	},
	del: function(id, callback){
		table.del(id, function(){
			callback();
		});
	}
}
var database = new dao();