import { MongoClient } from 'mongodb';
import util from 'util';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url);
    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const users = this.db.collection('users');
    users.countDocuments = util.promisify(users.countDocuments);
    return users.countDocuments();
  }

  async nbFiles() {
    const files = this.db.collection('files');
    files.countDocuments = util.promisify(files.countDocuments);
    return files.countDocuments();
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
