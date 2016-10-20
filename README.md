# Node-sqlite3-helper
A class to simply your code with sqlite3.

The only purpose of this class is to shorten the code and to avoid mixing SQL with JS in your code.

This module only contains one class : `SQLiteConnection`.

# Installation

* Download the sqlite3 module,
```
npm install --save sqlite3
```

* get `bdd.js` file and add it to your project,
* use it like a standard local module. e.g. `var myDbObject = require('/path/to/bdd.js');`

# General use

Before you use this class, please note that with a sqlite database it's recommanded not to open several connections at the same time.

## Initializing your model

In an application, it could be usefull, in test phase or even in order to make your deployments easy, to create a script to initialize your model. That's why these functions exist.

### createTable

A simple method to create a table.

```
// Creating the connection. Note that if the file doesn't exist it's created.
let myDbObject = new bdd.SQLiteConnection("myDatabase");

// Now let's create a table.
myDbObject.createTable("myTable", 			     //table name.
		["col1", "col2", "col3", "col4"],	     //column names.
		["INTEGER", "TEXT", "DATETIME", "TEXT"], //column types.
		[false, true, true,true],                //not null. (will add the 'NOT NULL' keywords in the query if true).
		[true, true, false, false],	 	 //unique. (will add the 'UNIQUE' keyword in the query if true).
		[null, null, null, null], 		 //default values.
		["col1"],	 			 //primary key field(s). (integer primary keys result in autoincrement to sqlite)
		["ASC"], 				 //primary key field(s) reading order.
		["col2"], ["other_table(col)"]);         //foreign key and foreign key references.
```

### dropTable

A method to drop a table.

```
myDbObject.dropTable("myTable");
```

## Managing data

### insertInto

Inserts a row.

```
myDbObject.insertInto("myTable",   	//table name.
		      ["col1", "col2"], //column names.
		      ["'value'", null],//values.
		      null,             //callback.
          true);			//ignore error: if already exists, ignore without prompting.
```

### update

Updates a row or a set of rows.

```
myDbObject.update("myTable",      	//table name.
		      ["col1", "col2"],     //column names.
		      ["'value'", null],    //values.
		      "col3 = '12'",        //where expression.
          	      false);		    //ignore error: if true, ignore errors without prompting.
```

### deleteFrom

Deletes a row or a set of rows.

```
myDbObject.delete("myTable",      		//table name.
		      "col3 = '12'");           //where expression.
```

### executeQuery

If you prefer generating your queries by your own.

```
myDbObject.executeQuery(sql_code);
```

## Model managing

I thought it would be helpfull to provide some model managing.

### getTableList

Provides browsing of the table list of the database.

```
myDbObject.getTableList(function(row) {
  //whatever you want to do for each row.
}, function(err) {
  //whatever you want to do in case of error.
  console.log(err); //for exeample
});
```

### getIndexListFromTable

Provides browsing of the indexes of a table.

```
myDbObject.getIndexListFromTable("myTable", function(row) {
  //whatever you want to do for each row.
}, function(err) {
  //whatever you want to do in case of error.
  console.log(err); //for exeample
});
```

### getFieldListFromTable

Provides browsing of a table fields.

```
myDbObject.getFieldListFromTable("myTable", function(row) {
  //whatever you want to do for each row.
}, function(err) {
  //whatever you want to do in case of error.
  console.log(err); //for exeample
});
```

## Browsing data

These methods are made to read data from your database.

### select

This method can generate most of the SELECT queries you will need to use. To join your tables, use the WHERE clause.

```
myDbObject.select(["col1 as c1", "col2"],           //columns of the SELECT clause.
                  ["myTable"],                      //tables of the FROM clause.
                  "col1 = 'toto' AND col2 IS NULL", //WHERE clause.
                  null,                             //columns of the GROUP BY clause.
                  null,                             //HAVING clause.
                  ["do_titre ASC"],                 //columns of the ORDER BY clause.
                  true,                             //if true sends the hole recordset to the callback, either callback is called for each row. 
                  function (recordset) { 
  //whatever you want to do for each row.
}, function(err) {
  //whatever you want to do in case of error.
  console.log(err); //for example
});
```

### getFromSQL

If you prefer using your own queries.

```
myDbObject.getFromSQL(sql_code,   //sql code
                      true,       //if true, sends the hole recordset to the callback, either callback is called for each row.
                      function (recordset) (recordset) { 
  //whatever you want to do for each row.
}, function(err) {
  //whatever you want to do in case of error.
  console.log(err); //for example
}); 
```

## close

Frees the connection.

```
myDbObject.close();
```
