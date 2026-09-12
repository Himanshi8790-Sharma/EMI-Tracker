import "dotenv/config";
import mysql from "mysql2";

let pool;

const getPool = () => {
	if (!pool) {
		pool = mysql.createPool({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			port: Number(process.env.DB_PORT || 3306),
			waitForConnections: true,
			connectionLimit: 5,
			queueLimit: 0,
		});
	}

	return pool;
};

const db = {
	query(...args) {
		return getPool().query(...args);
	},
};

export default db;