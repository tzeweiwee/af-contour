#!/usr/bin/env node

const { execSync } = require('child_process');
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
 * 2. Chakra UI, Tailwindcss, None
 * 3. TODO: Supabase
 * 4. TODO: Push to github automatically
 */

let projectName, projectPath;
let cssStyleFramework;
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
  supabase: '@supabase/supabase-js',
};

const questions = [
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
    message: 'Choose CSS styling - App comes with Tailwind by default',
    choices: [
      { title: 'Skip', value: 'none' },
      { title: 'Chakra UI', value: 'chakraui' },
    ],
    initial: 0,
  },
  {
    type: 'multiselect',
    name: 'backendServices',
    message: 'Choose backend services',
    choices: [
      { title: 'Prisma', value: 'prisma', selected: false },
      { title: 'Supabase', value: 'supabase', selected: false },
    ],
    hint: '- Space to select. Return to submit',
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
      console.log({ dependencies });
      if (!dependencies && dependencies !== ' ') {
        return `${packageManager} add ${dependencies}`;
      }
    case 'npm':
    default:
      return `${packageManager} install ${dependencies}`;
  }
}

async function installDependencies() {
  // change working directory
  process.chdir(projectPath);

  const { packageManager, cssStyling, backendServices } = await prompts(
    questions
  );
  cssStyleFramework = cssStyling;
  const cssStyleDependencies = getCssDependencies(cssStyling);
  const backendDependencies = getBackendServicesDependencies(backendServices);

  const allDependencies = [cssStyleDependencies, backendDependencies].join(' ');

  console.log(chalk.white.bgBlue.bold('Installing dependencies...'));
  execSync(getInstallCommand(packageManager, allDependencies), {
    stdio: 'inherit',
  });
}

/**
 *
 * @deprecated in favor of hygen
 */
function copyBoilerplateFiles() {
  if (!cssStyleFramework || cssStyleFramework === 'none') {
    return;
  }
  console.log(chalk.white.bgBlue.bold('Copying boilerplate files...'));
  // copy boilerplate files to root project for chosen css framework
  execSync(`rsync -avh boilerplate_files/${cssStyleFramework}/* ./`);
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
      `Airfoil Lab project constructed! ${
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
    await installDependencies();
    // copyBoilerplateFiles();
    // Post install script
    // Push the code directly to Github repo (Optional)
    cleanUp();
    success();
  } catch (err) {
    console.error(chalk.red(err));
    deleteDirectory();
  }
}

init();
