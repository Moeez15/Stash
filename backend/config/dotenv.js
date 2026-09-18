import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'

const currentPath = fileURLToPath(import.meta.url);
dotenv.config({ path: path.join(dirname(currentPath), '../.env') });