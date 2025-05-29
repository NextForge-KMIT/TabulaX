const mongoose = require('mongoose');
const mysql = require('mysql2/promise'); // Added for MySQL

exports.fetchExternalMongoDBData = async (req, res) => {
  const { mongoURI, collectionName } = req.body;

  if (!mongoURI || !collectionName) {
    return res.status(400).json({ message: 'MongoDB URI and collection name are required.' });
  }

  let connection;
  try {
    // Create a new Mongoose connection
    connection = await mongoose.createConnection(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if connection fails
    }).asPromise();

    console.log('Successfully connected to user-provided MongoDB.');

    // Define a generic schema since we don't know the structure
    const genericSchema = new mongoose.Schema({}, { strict: false });
    const GenericModel = connection.model(collectionName, genericSchema, collectionName);

    // Fetch data (e.g., first 100 documents for preview)
    // You might want to add pagination or more specific querying options later
    const data = await GenericModel.find().limit(100).lean(); // .lean() for plain JS objects

    res.status(200).json({ 
      message: `Successfully fetched data from collection '${collectionName}'.`,
      count: data.length,
      data 
    });

  } catch (error) {
    console.error('Error connecting to or fetching from user-provided MongoDB:', error);
    let errorMessage = 'Failed to connect to or fetch data from the MongoDB source.';
    if (error.name === 'MongoParseError') {
      errorMessage = 'Invalid MongoDB URI format.';
    } else if (error.name === 'MongooseServerSelectionError') {
      errorMessage = 'Could not connect to the MongoDB server. Check the URI and network access.';
    }
    res.status(500).json({ message: errorMessage, error: error.message });
  } finally {
    if (connection) {
      await connection.close();
      console.log('Closed connection to user-provided MongoDB.');
    }
  }
};

// New function for MySQL
exports.fetchExternalMySQLData = async (req, res) => {
  const {
    host, // User must provide host
    user, // User must provide user
    password, // User can provide password (can be empty string if allowed by DB)
    database, // User must provide database
    port = 3306, // Default port if not specified, but host/user/db are mandatory
    tableName, // User must provide table name
  } = req.body;

  if (!host || !user || !database || !tableName) {
    return res.status(400).json({ message: 'Host, User, Database, and Table Name are required for MySQL data fetching.' });
  }

  // Basic validation to prevent overly broad queries or simple injections on table name
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ message: 'Invalid table name format.' });
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port: parseInt(port, 10),
      connectTimeout: 10000 // 10 seconds connection timeout
    });

    console.log('Successfully connected to user-provided MySQL database.');

    // Fetch data (e.g., first 100 rows from the specified table)
    // IMPORTANT: Directly embedding tableName is generally safe if validated as above.
    // For selecting specific columns or adding WHERE clauses, a query builder is safer.
    const [rows] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 100`);

    res.status(200).json({
      message: `Successfully fetched data from table '${tableName}'.`,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    console.error('Error connecting to or fetching from user-provided MySQL:', error);
    let errorMessage = 'Failed to connect to or fetch data from the MySQL source.';
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = 'Access denied. Check MySQL credentials.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Could not connect to the MySQL server. Check host and port.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = 'Database not found. Check database name.';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
        errorMessage = `Table '${tableName}' does not exist in the database.`;
    }
    res.status(500).json({ message: errorMessage, error: error.message });
  } finally {
    if (connection) {
      await connection.end();
      console.log('Closed connection to user-provided MySQL.');
    }
  }
};
