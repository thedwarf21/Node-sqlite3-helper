var sql = require('sqlite3').verbose();

/*************************************
 * Interfacing with SQLite class.    *
 *************************************
 * This class extends Database class *
 * of sqlite3 module.                *
 *************************************/
exports.SQLiteConnection = class {
	/**********************
	 * Class constructor. *
	 **********************/
	constructor(database_name) {
		this.db = new sql.Database('.:' + database_name + ':.');
	}

	/******************************************************************
	 * The purpose of this method is to create a table generically.   *
	 ******************************************************************
	 * Parameters :                                                   *
	 *  - table_name -> The name the table will take.                 *
	 *  - col_names -> The list of the columns names.                 *
	 *  - col_types -> The list of the columns types.                 *
	 *  - col_not_null -> A list of booleans giving nullability.      *
	 *  - col_unique -> A list of booleans giving unicity.            *
	 *  - col_default -> Default value for each column.               *
	 *  - col_pk -> The list of primary key columns.                  *
	 *  - col_pk_order -> The way each of these columns are oredered. *
	 *  - col_fk -> The list of foreign key columns.                  *
	 *  - col_fk_refs -> The references of col_fk foreign keys.       *
	 ******************************************************************/
	createTable(table_name, col_names, col_types, col_not_null, col_unique, col_default, 
				col_pk, col_pk_order, col_fk, col_fk_refs) {
		let sql ="CREATE TABLE IF NOT EXISTS " + table_name + " (";
		for (let i = 0; i < col_names.length; i++) {
			sql += col_names[i] + " " + col_types[i];
			if (col_not_null[i]) sql += " NOT NULL";
			if (col_unique[i]) sql += " UNIQUE";
			if (col_default[i]) sql += " DEFAULT " + col_default[i];
			sql += ", ";
		}
		sql += "PRIMARY KEY (";
		for (let i = 0; i < col_pk.length; i++) {
			if (i > 0) sql += ", "
			sql += col_pk[i] + " " + col_pk_order[i];
		}
		sql+= ")";
		if (col_fk) {
			for (let i = 0; i < col_pk.length; i++) {
				sql += ", FOREIGN KEY(" + col_fk[i] + ") REFERENCES " + col_fk_refs[i];
			}
		}
		sql += ")";

		this.db.serialize( () => {
			this.db.run(sql);
		});
	}

	/********************************************
	 * Method that drops a table from database. *
	 ********************************************
	 * Parameters :                             *
	 *  - table_name -> The table to drop.      *
	 ********************************************/
	dropTable(table_name) {
		this.db.serialize( () => {
			this.db.run("DROP TABLE " + table_name);
		});
	}

	/*********************************************************
	 * The goal of this metho is to browse the tables list.  *
	 *********************************************************
	 * Parameters :                                          *
	 *  - success -> The function called in case of success. *
	 *  - reject -> The function called in case of error.    *
	 *********************************************************/
	getTableList(success, reject) {
		this.db.serialize( () => {
			this.db.each("SELECT name, sql FROM sqlite_master WHERE type='table'", function (err, row) {
				if (err) reject(sql, err.stack);
				else success(row);
			});
		});
	}

	/*********************************************************
	 * This method gets the indexes of a table.              *
	 *********************************************************
	 * Parameters :                                          *
	 *  - table_name -> The table to inspect.                *
	 *  - success -> The function called in case of success. *
	 *  - reject -> The function called in case of error.    *
	 *********************************************************/
	getIndexListFromTable(table_name, success, reject) {
		this.db.serialize( () => {
			this.db.each("SELECT name FROM sqlite_master WHERE type='index' and tbl_name='" + 
							table_name + "'", function (err, row) {
				if (err) reject(sql, err.stack);
				else success(row);
			});
		});
	}

	/****************************************************************
	 * This method gets the fields of a table.                      *
	 ****************************************************************
	 * Parameters :                                                 *
	 *  - table_name -> The table to inspect.                       *
	 *  - success -> The function called in case of success.        *
	 *  - reject -> The function called in case of error.           *
	 ****************************************************************
	 * Output fields of PRAGMA table_info() request :               *
	 *  - cid -> Internal identifier for the field (useless).       *
	 *  - name -> Column name.                                      *
	 *  - type -> Column type.                                      *
	 *  - notnull -> 0 if the field can be null. Else 1.            *
	 *  - dflt_value -> Default value for the column.               *
	 *  - pk -> 1 if this field is part of (or is) the primary key. *
	 ****************************************************************/
	getFieldListFromTable(table_name, success, reject) {
		this.db.serialize( () => {
			this.db.each("PRAGMA table_info(" + table_name + ")", function (err, row) {
				if (err) reject(sql, err.stack);
				else success(row);
			});
		});	
	}

	/****************************************************************
	 * This method make an insert into a table.                     *
	 ****************************************************************
	 * Parameters :                                                 *
	 *  - table_name -> The name of the table to insert the row in. *
	 *  - cols -> The list of the columns to set.                   *
	 *  - values -> The list of the values to set the columns with. *
	 *  - callback -> Here you can get rowid and handle errors.     *
	 *  - ignore_err -> Set to true to ignore errors during query.  *
	 ***************************************************************/
	insertInto(table_name, cols, values, callback=null, ignore_err=false) {
		let sql = "INSERT " + (ignore_err ? "OR IGNORE " : "") + "INTO " + table_name + "(";
		for (let i = 0; i < cols.length; i++) {
			if (i > 0) sql += ", ";
			sql += cols[i];
		}
		sql += ") VALUES (";
		for (let i = 0; i < values.length; i++) {
			if (i > 0) sql += ", ";
			sql += values[i];
		}
		sql += ")";

		this.db.serialize( () => {
			this.db.run(sql, function(err) {
				if (callback) {
					if (err) callback(err.stack, sql);
					else callback(null, this.lastID);
				}
			});
		});
	}

	/**********************************************************************
	 * This method permits to perform an update.                          *
	 **********************************************************************
	 * Parameters :                                                       *
	 **********************************************************************
	 *  - table_name -> The table to update.                              *
	 *  - cols -> The list of the columns to update in the row(s).        *
	 *  - values -> The values to set the columns of the row(s) with.     *
	 *  - where_expr -> The full where clause to target row(s) to update. *
	 *  - ignore_err -> Set to true to ignore errors during query.        *
	 **********************************************************************/
	update(table_name, cols, values, where_expr, ignore_err=false) {
		let sql = "UPDATE " + (ignore_err ? "OR IGNORE " : "") + table_name + " SET ";
		for (let i = 0; i < cols.length; i++) {
			if (i > 0) sql += ", ";
			sql += cols[i] + " = " + values[i];
		}
		if (where_expr) sql += " WHERE " + where_expr;

		this.db.serialize( () => {
			this.db.run(sql);
		});
	}

	/****************************************************************
	 * This method allows to delete a row or a set of rows.         *
	 ****************************************************************
	 * Parameters :                                                 *
	 *  - table_name -> The name of the table from which to delete. *
	 *  - where_expr -> The full where expression.                  *
	 ****************************************************************/
	deleteFrom(table_name, where_expr) {
		this.db.serialize( () => {
			this.db.run("DELETE FROM " + table_name + " WHERE " + where_expr);
		});
	}

	/************************************************************************************
	 * This method performs a select.                                                   *
	 * Further the more, it executes the success function in case of success            *
	 * and the reject function in case of error.                                        *
	 ************************************************************************************
	 * Parameters :                                                                     *
	 *  - cols -> The list of the columns you want to get.                              *
	 *  - from -> The list of the table to request.                                     *
	 *  - where_expr -> The full where expression.                                      *
	 *  - group_by -> The list of group by expression members.                          *
	 *  - having_expr -> The full having expression.                                    *
	 *  - order_by -> The list of order by expression members (including asc or desc).  *
	 *  - all -> Set this boolean to true if you want a whole recordset.                *
	 *  - success -> The function called in case of success.                            *
	 *  - reject -> The function called in case of error (which can it be).             *
	 ************************************************************************************/
	select(cols, from, where_expr, group_by, having_expr, order_by, all, success, reject) {
		let sql = "SELECT ";
		for (let i = 0; i < cols.length; i++) {
			if (i > 0) sql += ", ";
			sql += cols[i];
		}
		sql += " FROM ";
		for (let i = 0; i < from.length; i++) {
			if (i > 0) sql += ", ";
			sql += from[i];
		}
		if (where_expr) sql += " WHERE " + where_expr;
		if (group_by) {
			sql += " GROUP BY ";
			for (let i = 0; i < group_by.length; i++) {
				if (i > 0) sql += ", ";
				sql += group_by[i];
			}
			if (having_expr) sql += " HAVING " + having_expr;
		}
		if (order_by) {
			sql += " ORDER BY ";
			for (let i = 0; i < order_by.length; i++) {
				if (i > 0) sql += ", ";
				sql += order_by[i];
			}
		}

		// Requesting.
		if (all) {
			this.db.serialize( () => {
				this.db.all(sql, function (err, resultSet) {
					if (err) reject(sql, err.stack);
					else success(resultSet);
				});
			});
		} else {
			this.db.serialize( () => {
				this.db.each(sql, function (err, row) {
					if (err) reject(sql, err.stack);
					else success(row);
				});
			});
		}
	}

	/************************************************************
	 * This method allows to execute freely a SQL action query. *
	 ************************************************************
	 * Parameters :                                             *
	 *  - sql -> query sql code.                                *
	 ************************************************************/
	exectueQuery(sql) {
		this.db.serialize( () => {
			this.db.run(sql);
		});
	}

	/*************************************************************************
	 * This method allows to browse a recordset got from a custom sql query. *
	 *************************************************************************
	 * Parameters :                                                          *
	 *  - sql -> query sql code.                                             *
	 *  - all -> Set this boolean to true if you want a whole recordset.     *
	 *  - success -> The function called in case of success.                 *
	 *  - reject -> The function called in case of error.                    *
	 *************************************************************************/
	getFromSQL(sql, all, success, reject) {
		if (all) {
			this.db.serialize( () => {
				this.db.all(sql, function (err, resultSet) {
					if (err) reject(sql, err.stack);
					else success(resultSet);
				});
			});
		} else {
			this.db.serialize( () => {
				this.db.each(sql, function (err, row) {
					if (err) reject(sql, err.stack);
					else success(row);
				});
			});
		}
	}

	/*******************
	 * Closure method. *
	 *******************/
	close() { this.db.close(); }
}