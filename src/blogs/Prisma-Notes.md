---
title: "Prisma: Practicle Notes"
date: 2025-10-08
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["DBMS"]
excerpt: "Practical, guide to Prisma for Node.js/TypeScript — covers setup, schema design and relationships, migrations, type-safe Prisma Client usage, advanced querying and pagination, plus performance tuning and production best practices for building reliable, maintainable data layers."
---

Prisma is heralded as a next-generation **Object-Relational Mapper (ORM)** that revolutionizes how developers interact with databases. Its core strength lies in its ability to simplify complex database operations by providing a robust, type-safe, and intuitive API. Instead of writing raw SQL, you define your database schema in a human-readable, declarative language – Prisma Schema Language (PSL) – and Prisma then generates a powerful, type-safe client tailored specifically for your application. This client acts as an intermediary, translating your application's data operations into efficient database queries.

This guide aims to provide a comprehensive understanding of Prisma, from the initial setup of a project to advanced querying techniques, highlighting its features for managing database schemas and executing data operations effectively.

---

## Prerequisites: Setting the Stage for Prisma

Before diving into the world of Prisma, ensure you have the following essential tools installed and accessible:

- **Node.js**: As Prisma primarily integrates with JavaScript/TypeScript applications, Node.js is the fundamental runtime environment required to execute your application and Prisma commands. If you don't have it installed, a thorough installation guide can typically be found in the video description or on the official Node.js website.
- **Database**: Prisma requires an underlying database to connect to. This database must be installed and running locally, or accessible remotely on a server.
  - The tutorial predominantly uses **PostgreSQL**, a powerful open-source relational database, for its examples.
  - It's important to note that Prisma is primarily designed to work with **SQL databases** such as PostgreSQL, MySQL, SQLite, and SQL Server. While it does offer experimental support for NoSQL databases like MongoDB, certain functionalities and best practices might differ, and its full potential is often realized within the relational database ecosystem.

---

## Getting Started with Prisma: Initializing Your Project

Integrating Prisma into a new or existing project involves a few straightforward steps to set up the necessary files and dependencies.

1.  **Initialize npm for Project Management**:
    Begin by creating a `package.json` file. This file acts as the manifest for your project, tracking its metadata, scripts, and, critically, its dependencies.

    ```bash
    npm init -y
    ```

    The `-y` flag answers "yes" to all standard prompts, quickly setting up a default `package.json`.

2.  **Install Core and Development Dependencies**:
    Prisma, along with supporting development tools, needs to be installed as development dependencies. This ensures they are available during development but not bundled into your production application unless specifically required.

    ```bash
    npm install --save-dev prisma typescript ts-node @types/node nodemon
    ```

    Let's break down each dependency:

    - `prisma`: This is the core Prisma CLI (Command Line Interface) and engine. It's responsible for schema management, migrations, and generating the Prisma Client.
    - `typescript`: Prisma itself is built with TypeScript, and its generated client is fully type-safe, making TypeScript a natural and highly recommended choice for applications using Prisma.
    - `ts-node`: This utility allows you to execute TypeScript files directly within Node.js without needing a prior compilation step. It streamlines the development workflow.
    - `@types/node`: Provides essential TypeScript type definitions for Node.js APIs, enhancing autocompletion and type checking within your TypeScript project.
    - `nodemon`: A development-time utility that automatically monitors your project files for changes and restarts the Node.js server or script. This significantly boosts productivity by eliminating manual restarts during iterative development.

3.  **Configure TypeScript (`tsconfig.json`)**:
    A `tsconfig.json` file is crucial for any TypeScript project. It specifies compiler options and roots files, guiding how TypeScript code is compiled and understood. Prisma's documentation often provides a recommended base configuration.

    ```json
    // tsconfig.json
    {
    	"compilerOptions": {
    		"sourceMap": true,
    		"outDir": "dist",
    		"strict": true,
    		"lib": ["esnext"],
    		"esModuleInterop": true,
    		"resolveJsonModule": true
    	}
    }
    ```

    - `sourceMap`: Generates source map files, which are invaluable for debugging TypeScript code by mapping compiled JavaScript back to its original TypeScript source.
    - `outDir`: Specifies the output directory for compiled JavaScript files.
    - `strict`: Enables a broad range of strict type-checking options, promoting more robust and error-free code.
    - `lib`: Defines which declaration files are included in the compilation, typically set to support modern JavaScript features.
    - `esModuleInterop`: Provides compatibility between CommonJS and ES Modules, a common requirement in modern Node.js projects.
    - `resolveJsonModule`: Allows importing JSON files as modules.

4.  **Initialize Prisma Project Structure**:
    With the prerequisites in place, the next step is to initialize the Prisma specific project structure. This command sets up the foundational files Prisma needs.
    ```bash
    npx prisma init --data-source-provider postgresql
    ```
    - `npx prisma init`: This is the command to initialize Prisma.
    - `--data-source-provider postgresql`: This optional but highly recommended flag tells Prisma which database provider you intend to use (e.g., `postgresql`, `mysql`, `sqlite`, `sqlserver`, `mongodb`). Specifying it at this stage pre-configures your `schema.prisma` file correctly.
      This command performs several critical actions:
    - **Creates a `prisma` folder**: This directory will house your `schema.prisma` file, which is the heart of your Prisma setup, and eventually your database migration files.
    - **Generates a `.env` file**: This file is designated to store environment variables, most importantly your database connection URL. Keeping sensitive information like database credentials out of your main codebase and version control is a crucial security practice.
    - **Updates `.gitignore`**: Automatically adds `.env` and `node_modules` to your `.gitignore` file, preventing these generated or sensitive files from being inadvertently committed to your version control system.

---

## Prisma Schema File (`schema.prisma`): The Single Source of Truth

The `schema.prisma` file is arguably the most important component of your Prisma project. It serves as the **single source of truth** for your database schema, defining your data models, their relationships, and the connection details to your database. It uses a declarative, human-readable language (Prisma Schema Language) that abstracts away database-specific syntax, making schema definition much more intuitive.

- **VS Code Extension**: To maximize productivity and enhance the development experience, installing the official **Prisma extension for VS Code** is highly recommended. It provides invaluable features such as syntax highlighting, intelligent autocompletion, schema validation, and integrated formatting capabilities.
- **Code Formatting**: Maintaining a clean and consistent schema file is crucial for readability.
  - The VS Code extension can be configured to **auto-format on save**, ensuring your schema always adheres to Prisma's recommended style.
  - You can also manually format your schema file from the command line: `npx prisma format`.

### Components of `schema.prisma`

The `schema.prisma` file is logically divided into several blocks, each serving a distinct purpose in defining your database layer.

1.  ### `generator` Block: Shaping the Prisma Client

    The `generator` block dictates what code Prisma will generate from your schema. While the schema itself is defined in a database-agnostic language, the generator translates this definition into application-specific code that your backend can interact with.

    ```prisma
    // prisma/schema.prisma
    generator client {
      provider = "prisma-client-js"
    }
    ```

    - **`provider = "prisma-client-js"`**: This is the most prevalent and essential generator. It instructs Prisma to generate the Prisma Client for JavaScript and TypeScript. This client is a type-safe query builder that enables your application to perform CRUD (Create, Read, Update, Delete) operations against your database. In virtually all Prisma projects, this generator is foundational.
    - **Multiple Generators**: Prisma allows you to define multiple `generator` blocks for different purposes. For instance, you might have one generator for the standard Prisma Client and another for generating GraphQL API types or other specialized code based on your Prisma schema.

2.  ### `datasource` Block: Connecting to Your Database

    The `datasource` block is where you specify the connection details for your database. It's a critical configuration point, and by design, you can only have **one** `datasource` block per Prisma project, as a project typically interfaces with a single primary database.

    ```prisma
    // prisma/schema.prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```

    - **`provider`**: This field explicitly declares the type of database Prisma should connect to. Common values include `"postgresql"`, `"mysql"`, `"sqlite"`, and `"mongodb"`. This setting influences the SQL dialect (or NoSQL API) Prisma uses.
    - **`url`**: This is the database connection string. For security and flexibility, it is almost universally stored as an environment variable (e.g., `DATABASE_URL`). This approach allows you to easily manage different connection strings for various environments (development, testing, staging, production) without altering your codebase.
      - **Important Consideration**: The database specified in this `url` **must already exist** before Prisma can connect to it. Prisma does not create the database itself, only the tables and schema within an existing database.
    - **`.env` file example**:
      ```
      # .env
      DATABASE_URL="postgresql://postgres:password@localhost:5433/test?schema=public"
      ```
      _(Note: Remember to replace `postgres`, `password`, `localhost:5433`, and `test` with your actual database user, password, host, port, and database name. The `schema=public` part is common for PostgreSQL and specifies the database schema to use.)_

3.  ### `model` Block: Defining Your Data Structures

    `model` blocks are the core of your database schema definition. Each `model` typically maps directly to a table in a relational database or a collection in a NoSQL database. Inside each `model`, you define **fields**, which correspond to the columns in your database table.

    - **Field Structure**: Each field within a `model` is defined by four distinct parts:

      1.  **Name**: The identifier for the field (e.g., `id`, `name`, `email`, `age`). This will often become the column name in your database.
      2.  **Type**: The data type of the field, chosen from Prisma's type system (e.g., `Int`, `String`, `Boolean`, `DateTime`). Prisma's types are high-level and get mapped to appropriate database-specific types during migrations.
      3.  **Field Modifier (Optional)**: These characters modify the field's behavior regarding nullability or cardinality.
          - `?`: Makes the field **optional** (nullable). If omitted, the field is implicitly required. For example, `name String?` means the `name` can be `null`.
          - `[]`: Indicates an **array** of values. This is primarily used for defining relationships where one record can be associated with multiple other records (e.g., `posts Post[]`). It signifies a list of related entities, not a primitive array in the database column itself (unless the `Json` type is used with a JSON array).
      4.  **Attributes (Optional)**: These special decorators, starting with `@` (field-level) or `@@` (block-level), define specific behaviors, constraints, or metadata for the field or the entire model.

    - **Common Field Types and Examples**:

      - `Int`: Represents integer numbers.
        ```prisma
        age Int
        ```
      - `String`: For textual data, commonly used for names, emails, titles.
        ```prisma
        name String
        email String
        ```
      - `Boolean`: Stores `true` or `false` values.
        ```prisma
        isAdmin Boolean
        ```
      - `BigInt`: Used for very large integer numbers that exceed the capacity of a standard `Int`.
        ```prisma
        largeTransactionId BigInt?
        ```
      - `Float` / `Decimal`: Both represent floating-point numbers (numbers with decimal points). `Decimal` offers higher precision and is generally preferred for financial or precise calculations where exact decimal representation is crucial, as `Float` can suffer from precision issues.
        ```prisma
        averageRating Float
        price Decimal
        ```
      - `DateTime`: Stores points in time, including both date and time components. Useful for `createdAt` or `updatedAt` timestamps.
        ```prisma
        createdAt DateTime
        ```
      - `Json`: Allows storing JSON objects directly in the database. Support for this type depends on the underlying database (e.g., PostgreSQL supports it well, while SQLite might not). Prisma will throw an error if the chosen database doesn't support the `Json` type.
        ```prisma
        preferences Json?
        ```
      - `Bytes`: Designed to store raw byte data, typically for binary files or large objects. Less commonly used than other types.
        ```prisma
        profilePictureBytes Bytes?
        ```
      - `Unsupported`: This is a placeholder type. You will generally **not** define this type manually. It's usually generated by Prisma during introspection (analyzing an existing database) when it encounters a database column type that it does not directly support in its own type system. This flags to the developer that a specific column needs manual handling or alternative mapping.

    - **Field-Level Attributes (Single `@`)**: These attributes are applied to individual fields within a `model`.

      - `@id`: This crucial attribute marks a field as the model's **primary key**. Every model **must** have a primary key, which uniquely identifies each record in the table. You can only apply `@id` to one field (or use `@@id` for composite primary keys).
        ```prisma
        id Int @id
        ```
      - `@default(...)`: Specifies a **default value** for a field. This value is automatically assigned when a new record is created without explicitly providing a value for that field.
        - `@default(autoincrement())`: Used with `Int` fields, this tells the database to automatically increment the integer value for new records. This is common for generating sequential IDs.
          ```prisma
          id Int @id @default(autoincrement())
          ```
        - `@default(uuid())`: Used with `String` fields, this automatically generates a Universally Unique Identifier (UUID) string for new records. UUIDs are widely used for distributed systems to ensure unique IDs without coordination.
          ```prisma
          id String @id @default(uuid())
          ```
        - `@default(now())`: Used with `DateTime` fields, this sets the default value to the current timestamp at the moment the record is created. Ideal for `createdAt` fields.
          ```prisma
          createdAt DateTime @default(now())
          ```
      - `@unique`: Enforces a **unique constraint** on a field. This means that every record in the table must have a distinct value for this field; no two records can have the same value.
        ```prisma
        email String @unique // Ensures no two users have the same email address
        ```
      - `@updatedAt`: Specifically designed for `DateTime` fields, this attribute automatically updates the field's timestamp to the current time **whenever the record is updated**. It's perfect for `updatedAt` fields, providing an audit trail of modifications.
        ```prisma
        updatedAt DateTime @updatedAt
        ```

    - **Block-Level Attributes (Double `@@`)**: These attributes are applied to the entire `model` and are defined inside the `model`'s curly braces on their own line.

      - `@@unique([field1, field2, ...])`: Defines a **composite unique constraint**. Instead of a single field, it ensures that the _combination_ of values across the specified fields is unique. For example, `@@unique([age, name])` would mean that no two users can have the exact same age _and_ name combination, but they could have the same age if their names differ, or the same name if their ages differ.

        ```prisma
        model User {
          id   String @id @default(uuid())
          name String
          age  Int

          @@unique([age, name]) // No two users can have the same age AND name
        }
        ```

      - `@@index([field1, field2, ...])`: Creates a database **index** on one or more fields. Indexes are critical for optimizing database query performance, especially for fields frequently used in `WHERE` clauses, `ORDER BY` clauses, or for joining tables. While unique constraints often implicitly create indexes, `@@index` allows for explicit index creation on non-unique fields.
        ```prisma
        model User {
          id   String @id @default(uuid())
          email String @unique
          // ... other fields
          @@index([email]) // Index on email for faster lookups. (Already indexed by @unique usually, but useful for non-unique fields)
          @@index([name, age]) // Composite index for queries filtering/sorting by name and age
        }
        ```
      - `@@id([field1, field2, ...])`: Defines a **composite primary key** using multiple fields. If you use `@@id`, you **cannot** use the single `@id` attribute on any field. The combination of specified fields will then uniquely identify each record in the table.
        ```prisma
        model Post {
          title    String
          authorId String
          // ... other fields
          @@id([title, authorId]) // Title and authorId together form the primary key
        }
        ```

    - **Relationships in Prisma**: Prisma excels at defining and managing relationships between your models. It automatically handles the underlying foreign key constraints and structures the generated client for intuitive relational querying.

      1.  **One-to-Many Relationship**: This is a very common relationship where one record in a model can be associated with multiple records in another model, but each record in the "many" side is only associated with one record from the "one" side.

          - **Example**: One `User` can write `many Posts`, but each `Post` is written by only `one User`.

          ```prisma
          // prisma/schema.prisma
          model User {
            id            String @id @default(uuid())
            name          String
            // A user can have many posts (array of Post)
            // The @relation("WrittenPosts") names the relation, important for multiple relations
            writtenPosts  Post[] @relation("WrittenPosts")
            // Another relation, e.g., a user might 'favorite' many posts
            favoritePosts Post[] @relation("FavoritePosts")
          }

          model Post {
            id            String    @id @default(uuid())
            title         String
            // This is the foreign key that links to the User's id
            authorId      String
            // Each post has one author (User)
            // @relation links the foreign key (authorId) to the primary key (id) of User
            author        User      @relation("WrittenPosts", fields: [authorId], references: [id])
            // Optional foreign key for a post being favorited by a user
            favoritedById String?
            // The relation name "FavoritePosts" matches the one in the User model
            favoritedBy   User?     @relation("FavoritePosts", fields: [favoritedById], references: [id])
          }
          ```

          - **`@relation(...)`**: This attribute is explicitly used on the _linking_ side (the foreign key) to define how models are related.
            - `fields`: Specifies the foreign key field(s) within the _current_ model (e.g., `authorId` in `Post`).
            - `references`: Specifies the primary key field(s) in the _related_ model (e.g., `id` in `User`).
            - `name`: This parameter is **essential** when you have **multiple relationships between the same two models**. In the example above, `User` has `writtenPosts` and `favoritePosts`, both referencing `Post`. Without unique names (`"WrittenPosts"`, `"FavoritePosts"`), Prisma wouldn't know which foreign key in `Post` corresponds to which list in `User`. This disambiguates the relations.

      2.  **Many-to-Many Relationship**: In this scenario, records in one model can be associated with multiple records in another model, and vice-versa.

          - **Example**: A `Post` can have `many Categories`, and a `Category` can be associated with `many Posts`.

          ```prisma
          // prisma/schema.prisma
          model Post {
            id         String @id @default(uuid())
            title      String
            // A post can have multiple categories (array of Category)
            categories Category[]
          }

          model Category {
            id   String @id @default(uuid())
            name String
            // A category can be associated with multiple posts (array of Post)
            posts Post[]
          }
          ```

          - **Automatic Joining Table**: A significant advantage of Prisma here is that you **do not need to explicitly define the intermediate joining table** (often called a "pivot table" or "junction table") in your `schema.prisma`. Prisma automatically creates and manages this table in the database to handle the many-to-many links. This simplifies your schema and codebase.

      3.  **One-to-One Relationship**: Each record in a model is associated with exactly one record in another model, and vice-versa. The relationship can be defined on either side, but a foreign key with a `@@unique` constraint is crucial.

          - **Example**: A `User` has one `UserPreference`, and each `UserPreference` belongs to one `User`.

          ```prisma
          // prisma/schema.prisma
          model User {
            id             String         @id @default(uuid())
            name           String
            userPreference UserPreference? // User has an optional UserPreference
          }

          model UserPreference {
            id            String  @id @default(uuid())
            emailUpdates  Boolean
            // This foreign key must be unique to enforce the one-to-one relationship
            userId        String  @unique
            // Link back to the User model
            user          User    @relation(fields: [userId], references: [id])
          }
          ```

          - The `userId` field in `UserPreference` is marked with `@unique`. This is the critical component that enforces the one-to-one constraint: each `UserPreference` record can only be linked to _one_ unique `User`.

4.  ### `enum` Block: Defining Allowed Values

    `enum` blocks allow you to define a set of predefined, literal, and allowed values for a field. This is immensely useful for fields that should only hold a limited, known set of possibilities, such as user roles, order statuses, or item categories. Enums enhance type safety and prevent invalid data from being stored.

    ```prisma
    // prisma/schema.prisma
    enum Role {
      BASIC
      ADMIN
      EDITOR
    }

    model User {
      id   String @id @default(uuid())
      name String
      role Role   @default(BASIC) // User has a role from the Role enum, defaulting to BASIC
    }
    ```

    - By using an `enum` for the `role` field, you ensure that only `BASIC`, `ADMIN`, or `EDITOR` can be assigned, improving data integrity and code predictability.

---

## Database Migrations: Applying Schema Changes to Your Database

Defining your schema in `schema.prisma` is merely the blueprint. To transform this blueprint into actual tables and structures in your database, you need to execute **migrations**. Migrations are version-controlled changes to your database schema, managed by Prisma.

- **Running a Migration**:
  ```bash
  npx prisma migrate dev --name init_schema
  ```
  - `migrate dev`: This command is used for creating and applying migrations in a development environment. It automatically detects changes in your `schema.prisma` file and generates the necessary SQL.
  - `--name init_schema`: It's good practice to provide a descriptive name for each migration. This name helps in understanding the purpose of the migration when reviewing your project's history (e.g., `init_schema`, `add_posts_table`, `alter_user_preferences`).
- **What happens during a migration?**
  - Prisma generates SQL files: Inside your `prisma` folder, a new `migrations` directory will be created (e.g., `prisma/migrations/20220705123456_init_schema/migration.sql`). These files contain the raw SQL statements necessary to apply your schema changes to the database. This allows for transparent, reviewable, and reversible schema changes.
  - Prisma updates the Prisma Client: After applying schema changes, Prisma automatically regenerates the Prisma Client. This ensures that the client's type definitions and query methods are up-to-date with your latest database schema, maintaining type safety throughout your application.
- **Validation and Error Handling**: Prisma includes robust validation during migrations. If a proposed schema change could lead to data loss (e.g., altering a column's type in a way that truncates data, or adding a required field to a table with existing data without a default value), Prisma will often prompt you for confirmation or throw an error. This protective mechanism prevents accidental data corruption, though it might require careful planning for production deployments.

---

## Prisma Client: Your Type-Safe Database Gateway

The Prisma Client is the automatically generated, type-safe query builder that enables your application code to interact with your database using intuitive methods, rather than raw SQL or complex object mapping. It's built specifically from your `schema.prisma` file, meaning its methods and return types perfectly match your data models.

1.  **Installation**:
    The Prisma Client itself is a separate package that needs to be installed as a regular dependency for your application.

    ```bash
    npm install @prisma/client
    ```

2.  **Manual Generation**:
    While `prisma migrate dev` automatically regenerates the client, there might be scenarios where you only update your `schema.prisma` without running a full migration (e.g., changing a field's optionality that doesn't require a database change). In such cases, you can manually regenerate the client to update your application's types:

    ```bash
    npx prisma generate
    ```

3.  **Basic Usage**:
    Interacting with the Prisma Client in your application follows a standard pattern:

    ```typescript
    // script.ts
    import { PrismaClient } from "@prisma/client";

    // Instantiate the Prisma Client.
    // It's crucial to use only ONE instance of PrismaClient in your application
    // to efficiently manage database connections and avoid exhausting connection limits.
    const prisma = new PrismaClient({
    	// Optional: Configure logging for debugging.
    	// log: ['query', 'info', 'warn', 'error'], // Logs all queries, info, warnings, and errors
    });

    async function main() {
    	// All your database operations will go here, inside an async function.
    	// Example: Create a user (we'll cover this in detail below)
    	// const newUser = await prisma.user.create({ data: { name: "Alice" } });
    	// console.log(newUser);
    }

    // Call the main function and handle any errors.
    main()
    	.catch((e) => {
    		console.error(e);
    		// Ensure proper error reporting in production
    	})
    	.finally(async () => {
    		// It's good practice to explicitly disconnect from the database when your
    		// program finishes, although Node.js often handles this automatically
    		// when the process exits. For long-running servers, you might disconnect
    		// on graceful shutdown.
    		await prisma.$disconnect();
    	});
    ```

    - **Asynchronous Operations**: Most Prisma operations are asynchronous, returning Promises. Therefore, `async/await` syntax is the idiomatic way to handle these operations, making your database interaction code cleaner and easier to reason about.
    - **Running Your Script**: To execute your TypeScript script using `nodemon` for automatic reloading during development, add a script to your `package.json`:
      ```json
      // package.json
      "scripts": {
        "devStart": "nodemon script.ts"
      }
      ```
      Then, run it from your terminal:
      ```bash
      npm run devStart
      ```

---

## Prisma Client Operations (CRUD): Interacting with Your Data

The Prisma Client provides a comprehensive and type-safe API for performing common CRUD operations on your database, along with powerful querying capabilities.

### 1. Creating Data

#### `prisma.model.create()`: Adding a Single Record

This method is used to insert a single new record into your database for a specific model.

```typescript
// script.ts
// ... (inside main function)

// Clean slate for tutorial purposes: delete all existing users and their preferences
// This ensures idempotent execution in a demo scenario.
await prisma.user.deleteMany();
await prisma.userPreference.deleteMany();
// Assuming a 'Post' model exists, clear posts too if needed for relationships
// await prisma.post.deleteMany();

// Create a new user with basic details
const user = await prisma.user.create({
	data: {
		name: "Kyle",
		email: "kyle@test.com",
		age: 27,
		// Nested creation: Simultaneously create a related UserPreference record.
		// This demonstrates creating related data within the same transaction.
		userPreference: {
			create: {
				emailUpdates: true,
			},
		},
	},
	// 'include' specifies related data to be fetched along with the main record.
	// Here, we want to see the user's preference immediately after creation.
	include: {
		userPreference: true,
	},
	// Alternatively, 'select' allows picking specific fields and nested fields.
	// You can use EITHER 'include' OR 'select', but not both in the same query.
	// select: {
	//   name: true,
	//   age: true,
	//   userPreference: {
	//     select: {
	//       id: true,
	//       emailUpdates: true
	//     }
	//   }
	// }
});
console.log("Created user:", user);
/*
Output (example, UUIDs will vary):
Created user: {
  id: 'clg1a9j8s00003b6d5f7h9j1k',
  name: 'Kyle',
  email: 'kyle@test.com',
  age: 27,
  role: 'BASIC', // Assuming a default role
  userPreference: {
    id: 'clg1a9j8s00013b6d5f7h9j2l',
    emailUpdates: true,
    userId: 'clg1a9j8s00003b6d5f7h9j1k'
  }
}
*/
```

- **Nested Creation**: Prisma offers powerful capabilities for creating and connecting related records in a single operation. Using nested `create` (as shown above for `userPreference`) allows you to define a new related record. You can also use `connect` to link to an _existing_ related record by its unique identifier.
- **`include` vs. `select`**: These options control the shape of the data returned by your query.
  - `include`: Fetches the main record and _all_ fields of specified related models.
  - `select`: Allows you to meticulously pick _only_ the specific fields you need from the main model and optionally from its related models. This is useful for optimizing query performance and reducing data transfer when you don't need all information.
  - **Crucial Note**: You can use `include` or `select`, but never both, in the same query. Prisma will throw an error if both are present.

#### `prisma.model.createMany()`: Batch Creation

For inserting multiple records efficiently, especially when they don't involve complex nested relationships that need to be returned immediately, `createMany()` is the ideal choice.

```typescript
// script.ts
// ... (inside main function)

const users = await prisma.user.createMany({
	data: [
		{ name: "Sally", email: "sally@test1.com", age: 32 },
		{ name: "Sally", email: "sally@test2.com", age: 13 },
		{ name: "Sally", email: "sally@test3.com", age: 12 },
		{ name: "Kyle", email: "kyle@test_duplicate.com", age: 27 }, // Assuming email is unique, this might error or be filtered later.
	],
	// skipDuplicates: true // Optional: Add this to skip inserting records that would violate unique constraints
});
console.log("Created multiple users:", users); // Returns { count: 4 }
```

- **Limitation**: `createMany` does not support `include` or `select`. This is because it's designed for bulk insertion and typically returns only the count of records created, not the full objects, for performance reasons. If you need the created records with related data, use multiple `create` calls or fetch them in a subsequent `findMany` query.

### 2. Reading Data (Finding)

Prisma provides a rich set of methods for retrieving data, along with powerful filtering, sorting, and pagination options.

#### `prisma.model.findUnique()`: Retrieving a Single Unique Record

This method is designed to fetch a single record based on a **unique identifier**. This could be the primary key (`@id` field) or any field marked with `@unique` or `@@unique` (composite unique key).

```typescript
// script.ts
// ... (inside main function)

// Find by unique email address
const userByEmail = await prisma.user.findUnique({
	where: {
		email: "kyle@test.com",
	},
	include: { userPreference: true },
});
console.log("User by unique email:", userByEmail);

// Find by a composite unique key (e.g., if you defined @@unique([age, name]))
// Note: If you have a composite unique constraint like @@unique([age, name]),
// you query it as an object with the field names combined by an underscore.
const userByAgeName = await prisma.user.findUnique({
	where: {
		age_name: {
			// The field name here is generated by Prisma from the @@unique constraint
			age: 27,
			name: "Kyle",
		},
	},
});
console.log("User by composite unique key:", userByAgeName);
```

- `findUnique` is strict: if no unique record matches the `where` clause, it returns `null`. If multiple records somehow match (due to data inconsistencies or a non-unique field being queried), it will throw an error.

#### `prisma.model.findFirst()`: Getting the First Matching Record

When uniqueness is not guaranteed, or you simply need _any_ single record that matches your criteria (e.g., the oldest, the newest, or just the first one found), `findFirst()` is suitable.

```typescript
// script.ts
// ... (inside main function)

// Find the first user named "Sally", ordered by age ascending
const firstSally = await prisma.user.findFirst({
	where: {
		name: "Sally",
	},
	orderBy: {
		age: "asc", // Ensures we get the youngest Sally
	},
});
console.log("First (youngest) Sally:", firstSally);
```

#### `prisma.model.findMany()`: Retrieving Multiple Records

This is the most versatile method for querying multiple records. It returns an array of records that match your specified criteria.

```typescript
// script.ts
// ... (inside main function)

// Get all users in the database
const allUsers = await prisma.user.findMany();
console.log("All users:", allUsers);

// Query with `where`, `orderBy`, `take`, `skip`, and `distinct` for pagination and specific results
const paginatedSallys = await prisma.user.findMany({
	where: {
		name: "Sally",
	},
	orderBy: {
		age: "desc", // Sort by age in descending order (oldest first)
	},
	take: 2, // Take (limit) only 2 results
	skip: 1, // Skip the first result (useful for offset-based pagination)
	distinct: ["name", "age"], // Get distinct combinations of name and age.
	// If only 'name' was specified, it would return one "Sally".
});
console.log(
	"Paginated Sallys (skip 1, take 2, distinct age/name):",
	paginatedSallys
);
```

#### `where` Clause Operators: Advanced Filtering

The `where` clause is incredibly powerful, allowing you to build complex queries with various operators.

```typescript
// script.ts
// ... (inside main function)

// Basic equality and inequality operators
const exactSallyUsers = await prisma.user.findMany({
	where: {
		name: { equals: "Sally" }, // Explicit equality, same as name: "Sally"
	},
});
console.log("Users named Sally:", exactSallyUsers.length); // Expected: 3

const notSallyUsers = await prisma.user.findMany({
	where: {
		name: { not: "Sally" }, // Users whose name is NOT "Sally"
	},
});
console.log("Users not named Sally:", notSallyUsers.length); // Expected: 1 (Kyle)

// List-based operators
const sallyOrKyleUsers = await prisma.user.findMany({
	where: {
		name: { in: ["Sally", "Kyle"] }, // Name is one of "Sally" or "Kyle"
	},
});
console.log("Users named Sally or Kyle:", sallyOrKyleUsers.length); // Expected: 4

const neitherSallyNorKyle = await prisma.user.findMany({
	where: {
		name: { notIn: ["Sally", "Kyle"] }, // Name is neither "Sally" nor "Kyle"
	},
});
console.log("Users neither Sally nor Kyle:", neitherSallyNorKyle.length); // Expected: 0 (if only Sally & Kyle exist)

// Numeric comparison operators (for Int, Float, Decimal, BigInt, DateTime)
const youngSallys = await prisma.user.findMany({
	where: {
		age: { lt: 20 }, // Age less than 20
		name: "Sally", // Implicit AND: name is "Sally" AND age < 20
	},
});
console.log("Sallys younger than 20:", youngSallys); // Sally (13), Sally (12)

const adults = await prisma.user.findMany({
	where: {
		age: { gte: 18 }, // Age greater than or equal to 18
	},
});
console.log("Adult users:", adults.length);

// String operators (for String fields)
const testEmails = await prisma.user.findMany({
	where: {
		email: { contains: "@test.com", mode: "insensitive" }, // Case-insensitive contains
		// email: { startsWith: "kyle", mode: 'insensitive' }, // Starts with
		// email: { endsWith: "test1.com", mode: 'insensitive' }, // Ends with
	},
});
console.log("Users with '@test.com' in email:", testEmails);

// Logical operators: Combine multiple conditions
const complexLogicalQuery = await prisma.user.findMany({
	where: {
		OR: [
			// Either of these conditions must be true
			{ email: { startsWith: "sally", mode: "insensitive" } },
			{ age: { gt: 20 } },
		],
		// AND: [ // All conditions must be true
		//   { email: { contains: "@test.com" } },
		//   { name: { not: "Kyle" } }
		// ],
		// NOT: { // Negates the inner query
		//   email: { startsWith: "sally" }
		// }
	},
});
console.log("Complex logical query results:", complexLogicalQuery);

// Relationship Filtering: Querying based on related data
// For one-to-one relationships (e.g., UserPreference related to User)
const usersWithEmailUpdates = await prisma.user.findMany({
	where: {
		userPreference: {
			// Filter users based on their associated userPreference
			emailUpdates: true,
		},
	},
	include: {
		userPreference: true,
	},
});
console.log("Users who opted for email updates:", usersWithEmailUpdates);

// For one-to-many relationships (e.g., User having many writtenPosts)
const usersWithSomePosts = await prisma.user.findMany({
	where: {
		writtenPosts: {
			// Filter users based on their associated writtenPosts
			some: {
				// 'some' means at least one related post matches the condition
				title: { contains: "My First" },
			},
			// Other operators for one-to-many:
			// every: { title: { contains: "My First" } }, // 'every' means ALL related posts must match
			// none: { title: { contains: "My First" } },   // 'none' means NO related posts match
		},
	},
	include: { writtenPosts: true },
});
console.log("Users with posts containing 'My First':", usersWithSomePosts);

// Filtering from the "many" side to the "one" side (e.g., finding Posts by Author's age)
// Assuming Post model is defined with author relation
const postsByAuthorAge = await prisma.post.findMany({
	where: {
		author: {
			// Filter posts based on attributes of their associated author
			is: { age: { gt: 25 } }, // Find posts where the author's age is greater than 25
			// isNot: { age: { lte: 25 } } // Find posts where the author's age is NOT <= 25
		},
	},
	include: { author: true },
});
console.log("Posts written by authors older than 25:", postsByAuthorAge);
```

- **Case Sensitivity**: String operators like `contains`, `startsWith`, `endsWith` are case-sensitive by default. To make them case-insensitive, you can add `mode: 'insensitive'` to the operator's object.

### 3. Updating Data

Prisma offers methods to update single or multiple records, along with atomic operations for numeric fields and capabilities to update related data.

#### `prisma.model.update()`: Updating a Single Record

This method updates a single record, identified by a unique `where` clause.

```typescript
// script.ts
// ... (inside main function)

const updatedUser = await prisma.user.update({
	where: {
		email: "sally@test1.com", // Must use a unique field to identify the single record
	},
	data: {
		email: "sally.new@test.com", // Change email
		age: { increment: 1 }, // Increment age by 1
		// Other numeric operations:
		// age: { decrement: 5 }, // Decrement age by 5
		// age: { multiply: 2 }, // Multiply age by 2
		// age: { divide: 2 },   // Divide age by 2
		// Updating related one-to-one record:
		userPreference: {
			update: {
				// Update fields on the existing related record
				emailUpdates: false,
			},
			// Connecting an existing user preference (if it was optional or null previously)
			// connect: {
			//   id: "some-existing-preference-id" // Link to an existing UserPreference by its ID
			// },
			// Disconnecting a one-to-one relationship (sets foreign key to null)
			// disconnect: true
		},
	},
	include: {
		userPreference: true, // Include the updated preference in the return
	},
});
console.log("Updated user:", updatedUser);
```

- The `where` clause in `update()` (like `delete()`) must refer to a unique field (primary key or `@unique`) to ensure only one record is targeted.

#### `prisma.model.updateMany()`: Updating Multiple Records

Use `updateMany()` to modify multiple records that match a given query.

```typescript
// script.ts
// ... (inside main function)

const updatedManyUsers = await prisma.user.updateMany({
	where: {
		name: "Sally",
	},
	data: {
		name: "New Sally", // Change all users named "Sally" to "New Sally"
	},
});
console.log("Updated multiple users:", updatedManyUsers); // Returns { count: 3 }
```

- **Limitation**: Similar to `createMany`, `updateMany` does not support `select` or `include`. It returns an object indicating the `count` of affected records.

### 4. Deleting Data

Prisma provides methods for deleting single or multiple records from your database.

#### `prisma.model.delete()`: Deleting a Single Record

This method removes a single record identified by a unique `where` clause.

```typescript
// script.ts
// ... (inside main function)

const deletedUser = await prisma.user.delete({
	where: {
		email: "kyle@test_duplicate.com", // Must use a unique field
	},
});
console.log("Deleted user:", deletedUser); // Returns the object of the deleted user

// Error Handling: If no record is found matching the 'where' clause,
// `prisma.model.delete()` will throw a `P2025` error (RecordNotFound).
// It's good practice to wrap this in a try-catch block if the record might not exist.
try {
	await prisma.user.delete({ where: { email: "nonexistent@example.com" } });
} catch (e: any) {
	if (e.code === "P2025") {
		console.warn(
			"Attempted to delete a non-existent user. This is expected behavior."
		);
	} else {
		console.error("Error deleting user:", e);
	}
}
```

#### `prisma.model.deleteMany()`: Deleting Multiple Records

To remove multiple records that satisfy certain conditions, `deleteMany()` is the appropriate method.

```typescript
// script.ts
// ... (inside main function)

const deletedUsersByAge = await prisma.user.deleteMany({
	where: {
		age: { gt: 20 }, // Delete all users older than 20
	},
});
console.log("Deleted users older than 20:", deletedUsersByAge); // Returns { count: 1 } (e.g., Kyle, if age was 27)

// Deleting ALL records in a table:
// If you want to empty an entire table, pass an empty 'where' object:
// const allDeletedUsers = await prisma.user.deleteMany({});
// console.log(`Deleted ${allDeletedUsers.count} users.`);
```

- `deleteMany()` returns an object with a `count` property, indicating how many records were deleted. It does not return the deleted records themselves.

---

## Pagination in Prisma

Pagination is the process of breaking down a large dataset into smaller, more manageable chunks or "pages." This is essential for performance and user experience in applications that display lists of data (e.g., blog posts, products, users).

Prisma makes pagination straightforward using two main arguments in `findMany` queries: `take` and `skip`.

    - **take**: This argument specifies how many records to retrieve. It's equivalent to the "page size" or a `LIMIT` clause in SQL.

    - **skip**: This argument specifies how many records to bypass from the beginning of the result list before starting to count the records to `take`. It's equivalent to an `OFFSET` clause in SQL.

You can combine `take` and `skip` to fetch any page of data you need. The general formula to calculate the `skip` value is:

`skip = (pageNumber - 1) \* pageSize`

Example of Implementing Pagination

Here's a practical example of how to fetch the second page of users, with 10 users per page.

```TypeScript

// script.ts
// ... (inside main function)

async function fetchPaginatedUsers() {
const pageNumber = 2 // The page we want to fetch
const pageSize = 10 // The number of items per page

// Calculate the number of records to skip
const skipAmount = (pageNumber - 1) \* pageSize

const users = await prisma.user.findMany({
take: pageSize, // Get 10 users
skip: skipAmount, // Skip the first 10 users
orderBy: {
name: 'asc', // Ordering is important for consistent pagination
},
})

// To get the total number of records for calculating total pages
const totalUserCount = await prisma.user.count()
const totalPages = Math.ceil(totalUserCount / pageSize)

console.log(`Fetched page ${pageNumber} of ${totalPages}`)
console.log(users)
}

fetchPaginatedUsers()
```

In this example:

    1. We define `pageNumber` and `pageSize`.

    2. We calculate `skipAmount` to be `(2 - 1) * 10 = 10`.

    3. The Prisma query then fetches 10 (`take`) users after skipping the first 10 (`skip`) users, effectively giving us records 11-20.

    4. Using `orderBy` is crucial for stable and predictable pagination. Without it, the order of records isn't guaranteed, and pages could show duplicate or miss records between requests.

---

## Debugging and Performance: Gaining Visibility

Understanding what Prisma is doing under the hood, particularly the SQL queries it generates, is invaluable for debugging, performance optimization, and learning.

- **Logging Queries**: You can configure your `PrismaClient` instance to log the raw SQL queries it executes to the console. This provides direct insight into the database interactions.

  ```typescript
  // script.ts
  import { PrismaClient } from "@prisma/client";

  const prisma = new PrismaClient({
  	log: ["query"], // This will log every SQL query executed by Prisma
  	// You can also add other log levels for more detailed output:
  	// log: ['query', 'info', 'warn', 'error'],
  	// 'info' logs general information, 'warn' for warnings, 'error' for errors.
  });

  // ... (rest of your application code, using the 'prisma' client)
  ```

```

When `log: ['query']` is enabled, every database operation initiated by the Prisma Client will print the corresponding SQL query to your console. This is incredibly useful for:

- **Debugging**: Identifying if your queries are structured as expected.
- **Performance Tuning**: Pinpointing inefficient queries that might need optimization (e.g., adding indexes).
- **Learning**: Understanding how your high-level Prisma queries translate into low-level SQL.

---
```
