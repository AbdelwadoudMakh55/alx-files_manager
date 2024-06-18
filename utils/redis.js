import redis from 'redis';
import util from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    this.client.get = util.promisify(this.client.get);
    return this.client.get(key)
      .then((value) => value)
      .catch((err) => {
        console.log(err);
      });
  }

  async set(key, value, duration) {
    this.client.set = util.promisify(this.client.set);
    this.client.set(key, value, 'EX', duration)
      .catch((err) => {
        console.log(err);
      });
  }

  async del(key) {
    this.client.del = util.promisify(this.client.del);
    this.client.del(key)
      .catch((err) => {
        console.log(err);
      });
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
