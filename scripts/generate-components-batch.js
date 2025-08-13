#!/usr/bin/env node

/**
 * Batch component generator for Project Yarn
 * Generates multiple components from a configuration file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Default batch configuration template
const DEFAULT_BATCH_CONFIG = {
  components: [
    {
      name: 'ExampleButton',
      type: 'ui',
      props: [
        { name: 'variant', type: "'primary' | 'secondary'", optional: true },
        { name: 'size', type: "'sm' | 'md' | 'lg'", optional: true },
        { name: 'disabled', type: 'boolean', optional: true }
      ]
    },
    {
      name: 'ExampleModal',
      type: 'common',
      props: [
        { name: 'title', type: 'string', optional: false },
        { name: 'isOpen', type: 'boolean', optional: false },
        { name: 'onClose', type: '() => void', optional: false }
      ]
    }
  ]
};

/**
 * Generate components from batch configuration
 */
async function generateBatch(configPath) {
  try {
    // Read configuration file
    if (!fs.existsSync(configPath)) {
      console.error(`❌ Configuration file not found: ${configPath}`);
      console.log('\n💡 Create a batch configuration file with the following structure:');
      console.log(JSON.stringify(DEFAULT_BATCH_CONFIG, null, 2));
      process.exit(1);
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);

    if (!config.components || !Array.isArray(config.components)) {
      console.error('❌ Invalid configuration: components array is required');
      process.exit(1);
    }

    console.log('🚀 Project Yarn Batch Component Generator');
    console.log('========================================\n');
    console.log(`📁 Configuration: ${configPath}`);
    console.log(`📦 Components to generate: ${config.components.length}\n`);

    // Generate each component
    for (const [index, component] of config.components.entries()) {
      console.log(`🔨 Generating component ${index + 1}/${config.components.length}: ${component.name}`);
      
      try {
        await generateSingleComponent(component);
        console.log(`✅ Generated: ${component.name}\n`);
      } catch (error) {
        console.error(`❌ Failed to generate ${component.name}:`, error.message);
        console.log(''); // Empty line for readability
      }
    }

    console.log('✨ Batch generation completed!');
    console.log('\nNext steps:');
    console.log('1. Review the generated components');
    console.log('2. Customize implementations as needed');
    console.log('3. Run tests: npm run test');
    console.log('4. Run linting: npm run lint:components');

  } catch (error) {
    console.error('❌ Error in batch generation:', error.message);
    process.exit(1);
  }
}

/**
 * Generate a single component using the create-component script
 */
async function generateSingleComponent(component) {
  const { name, type, props = [], subdirectory = '' } = component;

  // Validate component configuration
  if (!name || !type) {
    throw new Error('Component name and type are required');
  }

  // Create temporary input file for the component generator
  const tempInputFile = path.join(__dirname, '.temp-component-input.txt');
  const inputs = [
    name,
    type,
    ...props.map(prop => `${prop.name}\n${prop.type}\n${prop.optional ? 'y' : 'n'}`),
    '', // Empty line to finish props
    subdirectory || ''
  ];

  fs.writeFileSync(tempInputFile, inputs.join('\n'));

  try {
    // Run the component generator with input redirection
    execSync(`node scripts/create-component.js < ${tempInputFile}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempInputFile)) {
      fs.unlinkSync(tempInputFile);
    }
  }
}

/**
 * Create a sample batch configuration file
 */
function createSampleConfig(outputPath) {
  const sampleConfig = {
    ...DEFAULT_BATCH_CONFIG,
    metadata: {
      description: 'Sample batch configuration for Project Yarn components',
      created: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  fs.writeFileSync(outputPath, JSON.stringify(sampleConfig, null, 2));
  console.log(`✅ Created sample configuration: ${outputPath}`);
  console.log('\nEdit this file to define your components, then run:');
  console.log(`node scripts/generate-components-batch.js ${outputPath}`);
}

/**
 * Validate batch configuration
 */
function validateConfig(configPath) {
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);

    console.log('🔍 Validating batch configuration...\n');

    // Check required structure
    if (!config.components || !Array.isArray(config.components)) {
      console.error('❌ Missing or invalid components array');
      return false;
    }

    let isValid = true;
    const componentNames = new Set();

    // Validate each component
    config.components.forEach((component, index) => {
      console.log(`Validating component ${index + 1}: ${component.name || 'unnamed'}`);

      // Check required fields
      if (!component.name) {
        console.error(`  ❌ Missing name`);
        isValid = false;
      } else if (componentNames.has(component.name)) {
        console.error(`  ❌ Duplicate name: ${component.name}`);
        isValid = false;
      } else {
        componentNames.add(component.name);
      }

      if (!component.type) {
        console.error(`  ❌ Missing type`);
        isValid = false;
      } else if (!['ui', 'common', 'feature', 'performance', 'hook'].includes(component.type)) {
        console.error(`  ❌ Invalid type: ${component.type}`);
        isValid = false;
      }

      // Validate props if present
      if (component.props && Array.isArray(component.props)) {
        component.props.forEach((prop, propIndex) => {
          if (!prop.name) {
            console.error(`  ❌ Prop ${propIndex + 1}: Missing name`);
            isValid = false;
          }
          if (!prop.type) {
            console.error(`  ❌ Prop ${propIndex + 1}: Missing type`);
            isValid = false;
          }
        });
      }

      if (isValid) {
        console.log(`  ✅ Valid`);
      }
      console.log('');
    });

    if (isValid) {
      console.log('✅ Configuration is valid!');
      console.log(`📦 ${config.components.length} components ready for generation`);
    } else {
      console.log('❌ Configuration has errors. Please fix them before generating.');
    }

    return isValid;

  } catch (error) {
    console.error('❌ Error validating configuration:', error.message);
    return false;
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Project Yarn Batch Component Generator

Usage: node scripts/generate-components-batch.js [options] [config-file]

Options:
  --sample [file]    Create a sample configuration file
  --validate [file]  Validate a configuration file
  --help, -h         Show this help message

Examples:
  # Create sample configuration
  node scripts/generate-components-batch.js --sample components.json

  # Validate configuration
  node scripts/generate-components-batch.js --validate components.json

  # Generate components from configuration
  node scripts/generate-components-batch.js components.json

Configuration Format:
{
  "components": [
    {
      "name": "ComponentName",
      "type": "ui|common|feature|performance|hook",
      "subdirectory": "optional/subdirectory",
      "props": [
        {
          "name": "propName",
          "type": "PropType",
          "optional": true|false
        }
      ]
    }
  ]
}
`);
  process.exit(0);
}

// Handle command line arguments
if (args.includes('--sample')) {
  const sampleIndex = args.indexOf('--sample');
  const outputPath = args[sampleIndex + 1] || 'components-batch.json';
  createSampleConfig(outputPath);
} else if (args.includes('--validate')) {
  const validateIndex = args.indexOf('--validate');
  const configPath = args[validateIndex + 1];
  if (!configPath) {
    console.error('❌ Please specify a configuration file to validate');
    process.exit(1);
  }
  validateConfig(configPath);
} else {
  const configPath = args[0];
  if (!configPath) {
    console.error('❌ Please specify a configuration file');
    console.log('Run with --help for usage information');
    process.exit(1);
  }
  generateBatch(configPath);
}
