#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const figlet = require('figlet');
const prompts = require('prompts');
const validate = require('validate-npm-package-name');
const chalk = require('chalk');

/**
 * Program flow
 *
 * 1. validate node version
 * 2. run init function
 * 3. validate project name
 * 4. validate project path
 * 5. clone template
 * 6. prompt user for css framework and package manager of choice
 * 7. install the dependencies
 * 8. copy over boilerplate codes based on chosen css framework (Deprecated for now)
 *
 * 9. if any error occurs, after creating a directory, the directory would be deleted
 */

/**
 * Prompts
 *
 * 1. yarn, pnpm, npm
 * 2. Chakra UI, None
 * 3. Prisma, Supabase
 * 4. Deploy Supabase project
 */

let projectName, projectPath;
let selectedDependencies = {}; // objects of prompts answers
let isCurrentDir = false; // if user is installing in the current directory
const GITHUB_REPO =
  'https://github.com/tzeweiwee/airfoil-labs-nextjs-template.git';
const APP_COMMAND = 'create-af-app';
const START_UP_TEXT = 'Create Airfoil Lab App';

// TODO: add post install script?
const packageDependencies = {
  chakraui:
    '@chakra-ui/react @emotion/react@^11 @emotion/styled@^11 framer-motion@^6',
  tailwindcss: 'tailwindcss postcss autoprefixer',
  prisma: 'prisma',
  supabase: '', // NO NEED FOR SUPABASE CLIENT
};

const dependenciesPrompts = [
  {
    type: 'select',
    name: 'packageManager',
    message: 'Choose a package manager',
    choices: [
      { title: 'PNPM', value: 'pnpm' },
      { title: 'NPM', value: 'npm' },
      { title: 'Yarn', value: 'yarn' },
    ],
    initial: 0,
  },
  {
    type: 'select',
    name: 'cssStyling',
    message: 'Choose CSS styling',
    hint: ' - App comes with Tailwind by default',
    choices: [
      { title: 'Skip', value: 'none' },
      { title: 'Chakra UI', value: 'chakraui' },
      { title: 'Airfoil UI (Coming soon)', value: 'afui', disabled: true },
    ],
    initial: 0,
  },
  {
    type: 'multiselect',
    name: 'backendServices',
    message: 'Add backend services',
    hint: ' - Adds boilerplate code to your project',
    choices: [
      { title: 'Prisma, tRPC, NextAuth', value: 'prisma', selected: true },
      {
        title: 'Supabase with Next.js API',
        value: 'supabase',
        selected: false,
      },
    ],
    hint: '- Space to select. Return to submit',
  },
];

const postInstallPrompts = [
  {
    type: 'confirm',
    name: 'isCreateSupabaseProject',
    hint: ' - Deploys DB, Auth on Supabase via CLI',
    message: 'Would you like to create a Supabase project?',
    initial: false,
  },
];

const supabaseProjectPrompts = [
  {
    type: 'text',
    name: 'projectName',
    message: 'What is the name of the project?',
    validate: (name) =>
      (name !== '' && name.length > 0) ||
      'Please enter the name of the project',
  },
];

function setProjectPath() {
  const currentPath = process.cwd();
  projectPath = path.join(currentPath, projectName);
}

function getCssDependencies(cssStyleFramework) {
  return packageDependencies[cssStyleFramework] || '';
}

function getBackendServicesDependencies(backendServices) {
  if (!backendServices || backendServices.length === 0) {
    return '';
  }

  return backendServices.reduce((deps, service) => {
    return deps.concat(packageDependencies[service]);
  }, '');
}

function validateNodeVersion() {
  const currentNodeVersion = process.versions.node;
  const semver = currentNodeVersion.split('.');
  const major = semver[0];

  if (major < 14) {
    console.error(
      chalk.red(
        'You are running Node ' +
          currentNodeVersion +
          '.\n' +
          'Create Airfoil Next App requires Node 14 or higher. \n' +
          'Please update your version of Node.'
      )
    );
    process.exit(1);
  }
}

function validateAppName() {
  if (process.argv.length < 3) {
    console.log(chalk.red('You have to provide a name to your app.'));
    console.log('For example :');
    console.log(chalk.green(` npx ${APP_COMMAND} my-app`));
    process.exit(1);
  }

  projectName = process.argv[2];

  // local directory is allowed
  if (projectName === '.') {
    isCurrentDir = true;
    return;
  }

  // making sure the project name conforms to NPM naming convention
  const validationResult = validate(projectName);
  if (!validationResult.validForNewPackages) {
    console.error(
      chalk.red(
        `Cannot create a project named ${chalk.green(
          projectName
        )} due to npm naming restrictions.`
      )
    );
    console.log(chalk.yellow(`Please fix the errors below: `));
    if (validationResult.errors) {
      validationResult.errors.forEach((err) =>
        console.error(` - ${chalk.red(err)}`)
      );
    }
    if (validationResult.warnings) {
      validationResult.warnings.forEach((warning) =>
        console.warn(` - ${chalk.yellow(warning)}`)
      );
    }
    process.exit(1);
  }
}

function validateProjectPath() {
  if (!isCurrentDir && fs.existsSync(projectPath)) {
    console.error(
      chalk.red(
        'Directory already exist, please choose another directory or project name'
      )
    );
    process.exit(1);
  }
}

function cloneRepo() {
  console.log(chalk.white.bgBlue.bold('Creating template...'));
  execSync(`git clone --depth 1 ${GITHUB_REPO} ${projectPath}`);
}

function getInstallCommand(packageManager, dependencies) {
  switch (packageManager) {
    case 'yarn':
    case 'pnpm':
      if (!dependencies && dependencies !== ' ') {
        return `${packageManager} add ${dependencies}`;
      }
    case 'npm':
    default:
      return `${packageManager} install ${dependencies}`;
  }
}

async function installDependencies() {
  const { packageManager, cssStyling, backendServices } = await prompts(
    dependenciesPrompts
  );

  // storing the dep answers for post install script
  selectedDependencies = {
    ...selectedDependencies,
    packageManager,
    cssStyling,
    backendServices,
  };

  console.log({ selectedDependencies });

  const cssStyleDependencies = getCssDependencies(cssStyling);
  const backendDependencies = getBackendServicesDependencies(backendServices);

  const allDependencies = [cssStyleDependencies, backendDependencies].join(' ');

  console.log(chalk.white.bgBlue.bold('Installing dependencies...'));
  execSync(getInstallCommand(packageManager, allDependencies), {
    stdio: 'inherit',
  });
}

// TODO: abstract this out to another file for custom post-install script
// runs hygen
// create superbase project if selected
async function postInstall() {
  const { isCreateSupabaseProject } = await prompts(postInstallPrompts);
  const { backendServices, packageManager } = selectedDependencies;

  console.log({ backendServices });

  if (backendServices.includes('prisma')) {
    execSync(`${packageManager} run init:prisma`, { stdio: 'inherit' });
    console.log(chalk.green.bold('Prisma boilerplate codes added!'));
  }

  if (backendServices.includes('supabase')) {
    execSync(`${packageManager} run init:supabase`, { stdio: 'inherit' });
    console.log(chalk.green.bold('Supabase boilerplate code added!'));
  }

  if (isCreateSupabaseProject) {
    execSync('npx supabase login', { stdio: 'inherit' });
    execSync('npx supabase projects list', { stdio: 'inherit' });
    const { projectName } = await prompts(supabaseProjectPrompts);
    execSync(`npx supabase projects create ${projectName} -i`, {
      stdio: 'inherit',
    });
  }
}

function cleanUp() {
  // console.log(chalk.white.bgBlue.bold('Cleaning up...'));
  fs.rmSync('./.git', { recursive: true });
  // fs.rmSync('./boilerplate_files', { recursive: true });
}

function deleteDirectory() {
  console.log(chalk.white.bgBlue.bold('Removing project...'));
  fs.rmSync(projectPath, { recursive: true });
}

function startUp() {
  console.log(figlet.textSync(START_UP_TEXT));
}

function success() {
  console.log(figlet.textSync('SUCCESS!'));
  console.log(
    chalk.green.bold(
      `Airfoil Lab project created! ${
        isCurrentDir ? '' : `cd ${projectName} to start!`
      }`
    )
  );
}

async function init() {
  startUp();
  validateNodeVersion();
  validateAppName();
  setProjectPath();
  validateProjectPath();
  try {
    cloneRepo();

    // change working directory
    process.chdir(projectPath);

    await installDependencies();
    await postInstall();
    cleanUp();
    success();
  } catch (err) {
    console.error(chalk.red(err));
    deleteDirectory();
  }
}

init();
