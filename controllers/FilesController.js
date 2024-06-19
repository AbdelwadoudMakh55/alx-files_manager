import fs from 'fs';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default async function postUpload(req, res) {
  const token = req.headers['x-token'];

  const userId = await redisClient.get(`auth_${token}`);
  if (userId === null) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  const { name } = req.body;
  const { type } = req.body;
  const parentId = req.body.parentId || 0;
  const { isPublic } = req.body || false;
  const { data } = req.body;

  if (!name) {
    return res.status(400).send({ error: 'Missing name' });
  }
  if (!type || !['folder', 'file', 'image'].includes(type)) {
    return res.status(400).send({ error: 'Missing type' });
  }
  if (!data && type !== 'folder') {
    return res.status(400).send({ error: 'Missing data' });
  }
  if (parentId !== 0) {
    const parentObjectId = ObjectId(parentId);
    const files = dbClient.db.collection('files');
    const file = files.findOne({ _id: parentObjectId });
    if (file === null) {
      return res.status(400).send({ error: 'Parent not found' });
    }
    if (file.type !== 'folder') {
      return res.status(400).send({ error: 'Parent is not a folder' });
    }
  }
  const files = dbClient.db.collection('files');
  if (type === 'folder') {
    const newFile = {
      userId,
      name,
      type,
      isPublic,
      parentId,
    };
    const newFolderDb = await files.insertOne(newFile);
    const response = {
      id: newFolderDb.ops[0]._id,
      userId,
      name,
      type,
      isPublic,
      parentId,
    };
    return res.status(201).send(response);
  }
  const path = process.env.FOLDER_PATH || '/tmp/files_manager';
  const fileName = uuidv4();
  const localPath = `${path}/${fileName}`;
  const newFile = {
    userId,
    name,
    type,
    isPublic,
    parentId,
    localPath,
  };
  const dataUtf8 = Buffer.from(data, 'base64').toString();
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  fs.writeFile(localPath, dataUtf8, (err) => {
    if (err) {
      throw err;
    }
  });
  const newFileDb = await files.insertOne(newFile);
  const response = {
    id: newFileDb.ops[0]._id,
    userId,
    name,
    type,
    isPublic,
    parentId,
  };
  return res.status(201).send(response);
}
