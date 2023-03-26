# Create Airfoil Next.js App
![image](https://user-images.githubusercontent.com/19740800/227796978-be82736d-22bd-416c-992e-c334002fe5bf.png)



Create full-stack templated Next.js, Prisma, Supabase apps from scratch in 5 minutes.

This script will help you to create a new full-stack NextJS app with backend services. The Next.js templated is cloned from this [repo](https://github.com/tzeweiwee/airfoil-labs-nextjs-template) forked and updated from of Zachery's [repo](https://github.com/Aztriltus/nextjs-ts-tailwind-template).

The template includes:

- [hygen](https://hygen.io) code generator

The script allows you to:

- Create a repository locally with the [template](https://github.com/tzeweiwee/airfoil-labs-nextjs-template)
- Adds boilerplate codes for Prisma + tRPC + NextAuth and Supabase
- Choose css styling (Comes with Tailwindcss by default)
- Optionally deploys Supabase project via CLI

## Quick Overview

First, you will need npx to get started

```sh
npx create-af-app my-app-name
...
cd my-app-name
pnpm dev
```

## Guide

#### Project Name

Enter a project name within npm naming conventions.

#### Package Manager

Choose between `pnpm`, `npm` or `yarn` for your project.

#### Css Styling

The template is preconfigured with Tailwindcss by default. But you can still choose to install Chakra UI or Airfoil UI (Coming soon) in future.


#### Backend Services

Lab projects often comes with backend services that requires authentication and communicates with DB or blockchain. This is why the upgraded template comes with `Prisma + NextAuth` and `Supabase` boilerplate codes to get the developers up and running!
You can choose to add one or both or none, it's completely up to you! This prompt only adds boilerplate codes to the project.

![image](https://user-images.githubusercontent.com/19740800/227796723-e585e9d4-793d-4fb5-9da4-c9b6da7ba1d7.png)

![image](https://user-images.githubusercontent.com/19740800/227796789-fa16c3ed-43b9-4b72-a5db-1f249849ab4c.png)


#### Supabase Deployment

This allows you to choose to deploy a Supabase project (optional of course). All you need to do is to enter your Supabase access token and a project name to deploy to a project hosted by Supabase.

#### Any errors that occur in the CLI

The script will validate Node version, project path, project name and will rollback if any error occurs.

## FAQ

##### I would like to make changes to the boilerplate codes, how do I do that?

Yes, you can make changes to the template. Simply open a pull request and we'll review the changes together!

## Contribution

Any contributions are welcomed here. Please open a pull request with your intent and motivation!

## Issues

Open a Github issue if you have any proposals or bugs found for the script.
