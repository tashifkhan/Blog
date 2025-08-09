import { MongoClient } from "mongodb";

// Read from Node env first; fall back to Vite/Astro env (static access so Vite replaces it)
const uri: string | undefined = process.env.MONGODB_URI || import.meta.env.MONGODB_URI;
const options: ConstructorParameters<typeof MongoClient>[1] = {};

if (!uri) {
  throw new Error("Please add MONGODB_URI to your environment variables");
}

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise!;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
