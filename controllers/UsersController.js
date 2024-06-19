import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export function sha1(data) {
  const generator = crypto.createHash('sha1');
  generator.update(data);
  return generator.digest('hex');
}

export async function postNew(req, res) {
  const { email } = req.body;
  const { password } = req.body;

  if (!email) {
    return res.status(400).send({ error: 'Missing email' });
  }
  if (!password) {
    return res.status(400).send({ error: 'Missing password' });
  }
  const users = dbClient.db.collection('users');
  const user = await users.findOne({ email });
  if (user) {
    return res.status(400).send({ error: 'Already exist' });
  }
  const hashedPwd = sha1(password);
  const newUser = await users.insertOne({ email, password: hashedPwd });
  const response = {
    id: newUser.ops[0]._id,
    email: newUser.ops[0].email,
  };
  return res.status(201).send(response);
}
export async function getMe(req, res) {
  const token = req.headers['x-token'];
  const userId = await redisClient.get(`auth_${token}`);
  if (userId === null) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const userObjectId = new ObjectId(userId);
  const users = dbClient.db.collection('users');
  const userDb = await users.findOne({ _id: userObjectId });
  const response = {
    id: userDb._id,
    email: userDb.email,
  };
  return res.send(response);
}
