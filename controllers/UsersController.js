import crypto from 'crypto';
import dbClient from '../utils/db';

function sha1(data) {
  const generator = crypto.createHash('sha1');
  generator.update(data);
  return generator.digest('hex');
}

export default async function postNew(req, res) {
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
