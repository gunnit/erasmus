#!/usr/bin/env node
/**
 * Test that all frontend imports are working correctly
 */

const fs = require('fs');
const path = require('path');

// List of components to check
const components = [
  'ProposalsList.jsx',
  'Analytics.jsx', 
  'Settings.jsx',
  'Profile.jsx'
];

// Check each component exists
console.log('Checking component files...');
components.forEach(comp => {
  const filePath = path.join(__dirname, 'frontend', 'src', 'components', comp);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${comp} exists`);
  } else {
    console.log(`✗ ${comp} NOT FOUND`);
  }
});

// Check App.js imports
console.log('\nChecking App.js imports...');
const appPath = path.join(__dirname, 'frontend', 'src', 'App.js');
const appContent = fs.readFileSync(appPath, 'utf8');

components.forEach(comp => {
  const compName = comp.replace('.jsx', '');
  if (appContent.includes(`import ${compName} from './components/${comp}'`)) {
    console.log(`✓ ${compName} import correct`);
  } else {
    console.log(`✗ ${compName} import incorrect or missing`);
  }
});

// Check for Euro icon issues
console.log('\nChecking for Euro icon usage...');
components.forEach(comp => {
  const filePath = path.join(__dirname, 'frontend', 'src', 'components', comp);
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('Euro')) {
    console.log(`⚠ ${comp} still uses Euro icon (should use DollarSign)`);
  }
});

console.log('\nDone!');