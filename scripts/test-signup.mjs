import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';

if (existsSync('.env.local')) {
  const envConfig = dotenv.parse(readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

import { signup } from '../actions/auth.ts';

const formData = new FormData();
formData.set('name', 'Teste');
formData.set('email', 'test' + Date.now() + '@example.com');
formData.set('phone', '(61) 99999-9999');
formData.set('cpf', '123.456.789-01');
formData.set('password', '12345678');
formData.set('passwordConfirm', '12345678');

signup(undefined, formData)
  .then(res => console.log('Result:', res))
  .catch(err => console.error('Error:', err));
