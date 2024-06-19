import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { sha1 } from '../controllers/UsersController';

export async function getConnect(req, res) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Basic ')) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const auth = authorization.split(' ')[1];
  const credentials = Buffer.from(auth, 'base64').toString();
  const email = credentials.split(':')[0];
  const password = credentials.split(':')[1];
  const users = dbClient.db.collection('users');
  const hashedPwd = sha1(password);
  const user = await users.findOne({ email, password: hashedPwd });
  if (!user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const token = uuidv4();
  const key = `auth_${token}`;
  await redisClient.set(key, user._id.toString(), 86400);
  return res.status(200).send({ token });
}
export async function getDisconnect(req, res) {
  const token = req.headers['x-token'];
  const user = await redisClient.get(`auth_${token}`);
  if (!user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  await redisClient.del(`auth_${token}`);
  return res.status(204).send();
}
