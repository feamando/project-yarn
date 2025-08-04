#!/usr/bin/env node

/**
 * Component-specific ESLint validation script for Project Yarn
 * Provides targeted linting for different component types with specific rules
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration for different component types
const COMPONENT_CONFIGS = {
  ui: {
    config: '.eslintrc.components.json',
    path: 'src/components/ui',
    description: 'UI Components (shadcn/ui)',
    strict: true
  },
  common: {
    config: '.eslintrc.components.json',
    path: 'src/components/common',
    description: 'Common Application Components',
    strict: true
  },
  features: {
    config: '.eslintrc.components.json',
    path: 'src/components/features',
    description: 'Feature-specific Components',
    strict: false
  },
  performance: {
    config: '.eslintrc.components.json',
    path: 'src/components/performance',
    description: 'Performance Monitoring Components',
    strict: false
  },
  hooks: {
    config: '.eslintrc.components.json',
    path: 'src/hooks',
    description: 'Custom React Hooks',
    strict: true
  }
};

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  strict: args.includes('--strict'),
  type: args.find(arg => arg.startsWith('--type='))?.split('=')[1],
  verbose: args.includes('--verbose'),
  quiet: args.includes('--quiet'),
  maxWarnings: args.find(arg => arg.startsWith('--max-warnings='))?.split('=')[1] || '0'
};

/**
 * Check if a directory exists
 */
function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Run ESLint for a specific component type
 */
function lintComponentType(type, config) {
  const { config: configFile, path: componentPath, description, strict } = config;
  
  if (!directoryExists(componentPath)) {
    if (options.verbose) {
      console.log(`⚠️  Skipping ${description}: Directory ${componentPath} does not exist`);
    }
    return { success: true, warnings: 0, errors: 0 };
  }

  const eslintArgs = [
    'npx eslint',
    `"${componentPath}/**/*.{ts,tsx}"`,
    `--config ${configFile}`,
    '--format stylish'
  ];

  if (options.fix) {
    eslintArgs.push('--fix');
  }

  if (options.quiet) {
    eslintArgs.push('--quiet');
  }

  if (strict || options.strict) {
    eslintArgs.push('--max-warnings 0');
  } else {
    eslintArgs.push(`--max-warnings ${options.maxWarnings}`);
  }

  const command = eslintArgs.join(' ');

  try {
    if (!options.quiet) {
      console.log(`🔍 Linting ${description}...`);
      if (options.verbose) {
        console.log(`   Command: ${command}`);
      }
    }

    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: options.quiet ? 'pipe' : 'inherit'
    });

    if (!options.quiet) {
      console.log(`✅ ${description}: No issues found`);
    }

    return { success: true, warnings: 0, errors: 0 };
  } catch (error) {
    const output = error.stdout || error.message;
    
    // Parse ESLint output to count warnings and errors
    const warningMatches = output.match(/(\d+) warning/g) || [];
    const errorMatches = output.match(/(\d+) error/g) || [];
    
    const warnings = warningMatches.reduce((sum, match) => {
      return sum + parseInt(match.match(/\d+/)[0]);
    }, 0);
    
    const errors = errorMatches.reduce((sum, match) => {
      return sum + parseInt(match.match(/\d+/)[0]);
    }, 0);

    if (!options.quiet) {
      console.log(`❌ ${description}: ${errors} errors, ${warnings} warnings`);
      if (options.verbose && output) {
        console.log(output);
      }
    }

    return { 
      success: errors === 0, 
      warnings, 
      errors,
      output 
    };
  }
}

/**
 * Main execution function
 */
function main() {
  console.log('🚀 Project Yarn Component Linting');
  console.log('=====================================\n');

  const startTime = Date.now();
  let totalWarnings = 0;
  let totalErrors = 0;
  let failedTypes = [];

  // Determine which component types to lint
  const typesToLint = options.type 
    ? [options.type] 
    : Object.keys(COMPONENT_CONFIGS);

  // Validate specified type
  if (options.type && !COMPONENT_CONFIGS[options.type]) {
    console.error(`❌ Unknown component type: ${options.type}`);
    console.error(`Available types: ${Object.keys(COMPONENT_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  // Lint each component type
  for (const type of typesToLint) {
    const config = COMPONENT_CONFIGS[type];
    const result = lintComponentType(type, config);
    
    totalWarnings += result.warnings;
    totalErrors += result.errors;
    
    if (!result.success) {
      failedTypes.push({
        type,
        description: config.description,
        errors: result.errors,
        warnings: result.warnings
      });
    }
  }

  // Summary
  const duration = Date.now() - startTime;
  console.log('\n=====================================');
  console.log('📊 Linting Summary');
  console.log('=====================================');
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📁 Types checked: ${typesToLint.length}`);
  console.log(`⚠️  Total warnings: ${totalWarnings}`);
  console.log(`❌ Total errors: ${totalErrors}`);

  if (failedTypes.length > 0) {
    console.log('\n❌ Failed component types:');
    failedTypes.forEach(({ type, description, errors, warnings }) => {
      console.log(`   • ${description} (${type}): ${errors} errors, ${warnings} warnings`);
    });
  } else {
    console.log('\n✅ All component types passed linting!');
  }

  // Exit with appropriate code
  if (totalErrors > 0) {
    console.log('\n💡 Run with --fix to automatically fix some issues');
    process.exit(1);
  } else if (totalWarnings > 0 && (options.strict || args.includes('--max-warnings=0'))) {
    console.log('\n💡 Warnings found in strict mode');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Help text
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Project Yarn Component Linter

Usage: node scripts/lint-components.js [options]

Options:
  --type=<type>        Lint specific component type (ui, common, features, performance, hooks)
  --fix               Automatically fix fixable issues
  --strict            Treat warnings as errors
  --verbose           Show detailed output
  --quiet             Suppress output except errors
  --max-warnings=<n>  Maximum number of warnings allowed (default: 0)
  --help, -h          Show this help message

Examples:
  node scripts/lint-components.js                    # Lint all component types
  node scripts/lint-components.js --type=ui          # Lint only UI components
  node scripts/lint-components.js --fix              # Lint and fix issues
  node scripts/lint-components.js --strict           # Treat warnings as errors
  node scripts/lint-components.js --type=hooks --fix # Lint and fix custom hooks
`);
  process.exit(0);
}

// Run the linter
main();
