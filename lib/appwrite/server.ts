import 'server-only';
import { Client, Account, Databases, Users } from 'node-appwrite';
import { appwriteConfig } from './config';

export function createAdminClient() {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.apiKey);

  return {
    get client() {
      return client;
    },
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get users() {
      return new Users(client);
    },
  };
}

export function createSessionClient(session: string) {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setSession(session);

  return {
    get client() {
      return client;
    },
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
}
