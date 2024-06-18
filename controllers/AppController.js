import redisClient from '../utils/redis';
import dbClient from '../utils/db';

function getStatus(req, res) {
  const status = {
    redis: redisClient.isAlive(),
    db: dbClient.isAlive(),
  };
  res.send(status);
}
async function getStats(req, res) {
  const stats = {
    users: await dbClient.nbUsers(),
    files: await dbClient.nbFiles(),
  };
  res.send(stats);
}
module.exports = { getStatus, getStats };
