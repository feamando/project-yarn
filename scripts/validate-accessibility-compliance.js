#!/usr/bin/env node

// Accessibility Compliance Validation Script
// Task 6.4: Add accessibility checks to CI/CD pipeline

const fs = require('fs')
const path = require('path')

/**
 * WCAG 2.1 AA Compliance Validation
 */
class AccessibilityComplianceValidator {
  constructor() {
    this.violations = []
    this.warnings = []
    this.passed = []
    this.complianceThreshold = 0.95 // 95% compliance required
  }

  /**
   * Validate accessibility test results
   */
  async validateCompliance() {
    console.log('🔍 Validating WCAG 2.1 AA compliance...')

    try {
      // Check automated test results
      await this.validateAutomatedTests()
      
      // Check Lighthouse accessibility scores
      await this.validateLighthouseResults()
      
      // Check axe-core scan results
      await this.validateAxeResults()
      
      // Generate compliance report
      const complianceReport = this.generateComplianceReport()
      
      // Write results
      fs.writeFileSync(
        'accessibility-compliance-results.json',
        JSON.stringify(complianceReport, null, 2)
      )
      
      // Exit with appropriate code
      if (complianceReport.compliant) {
        console.log('✅ WCAG 2.1 AA compliance validation PASSED')
        process.exit(0)
      } else {
        console.log('❌ WCAG 2.1 AA compliance validation FAILED')
        console.log(`Compliance score: ${complianceReport.complianceScore}%`)
        console.log(`Required: ${this.complianceThreshold * 100}%`)
        process.exit(1)
      }
    } catch (error) {
      console.error('Error validating accessibility compliance:', error)
      process.exit(1)
    }
  }

  /**
   * Validate automated test results
   */
  async validateAutomatedTests() {
    const testResultsPath = 'test-results/accessibility'
    
    if (!fs.existsSync(testResultsPath)) {
      this.violations.push({
        type: 'missing-tests',
        message: 'Automated accessibility test results not found',
        severity: 'critical'
      })
      return
    }

    // Check for test failures
    const testFiles = fs.readdirSync(testResultsPath)
    for (const file of testFiles) {
      if (file.endsWith('.json')) {
        const results = JSON.parse(
          fs.readFileSync(path.join(testResultsPath, file), 'utf8')
        )
        
        if (results.numFailedTests > 0) {
          this.violations.push({
            type: 'test-failures',
            message: `${results.numFailedTests} accessibility tests failed in ${file}`,
            severity: 'high',
            details: results.testResults
          })
        } else {
          this.passed.push({
            type: 'automated-tests',
            message: `All accessibility tests passed in ${file}`,
            file: file
          })
        }
      }
    }
  }

  /**
   * Validate Lighthouse accessibility results
   */
  async validateLighthouseResults() {
    const lighthousePath = '.lighthouseci'
    
    if (!fs.existsSync(lighthousePath)) {
      this.warnings.push({
        type: 'missing-lighthouse',
        message: 'Lighthouse results not found',
        severity: 'medium'
      })
      return
    }

    try {
      // Find the latest Lighthouse results
      const manifestPath = path.join(lighthousePath, 'manifest.json')
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        
        for (const result of manifest) {
          if (result.summary && result.summary.accessibility) {
            const accessibilityScore = result.summary.accessibility
            
            if (accessibilityScore < this.complianceThreshold) {
              this.violations.push({
                type: 'lighthouse-score',
                message: `Lighthouse accessibility score (${accessibilityScore}) below threshold (${this.complianceThreshold})`,
                severity: 'high',
                score: accessibilityScore
              })
            } else {
              this.passed.push({
                type: 'lighthouse-score',
                message: `Lighthouse accessibility score: ${accessibilityScore}`,
                score: accessibilityScore
              })
            }
          }
        }
      }
    } catch (error) {
      this.warnings.push({
        type: 'lighthouse-parse-error',
        message: `Error parsing Lighthouse results: ${error.message}`,
        severity: 'medium'
      })
    }
  }

  /**
   * Validate axe-core scan results
   */
  async validateAxeResults() {
    const axeResultsPath = 'axe-results.json'
    
    if (!fs.existsSync(axeResultsPath)) {
      this.warnings.push({
        type: 'missing-axe',
        message: 'Axe-core results not found',
        severity: 'medium'
      })
      return
    }

    try {
      const axeResults = JSON.parse(fs.readFileSync(axeResultsPath, 'utf8'))
      
      if (axeResults.violations && axeResults.violations.length > 0) {
        for (const violation of axeResults.violations) {
          this.violations.push({
            type: 'axe-violation',
            message: violation.description,
            severity: this.mapAxeSeverity(violation.impact),
            rule: violation.id,
            nodes: violation.nodes.length,
            wcagTags: violation.tags.filter(tag => tag.startsWith('wcag'))
          })
        }
      }

      if (axeResults.passes && axeResults.passes.length > 0) {
        this.passed.push({
          type: 'axe-passes',
          message: `${axeResults.passes.length} axe-core rules passed`,
          count: axeResults.passes.length
        })
      }
    } catch (error) {
      this.violations.push({
        type: 'axe-parse-error',
        message: `Error parsing axe-core results: ${error.message}`,
        severity: 'high'
      })
    }
  }

  /**
   * Map axe severity to our severity levels
   */
  mapAxeSeverity(impact) {
    switch (impact) {
      case 'critical': return 'critical'
      case 'serious': return 'high'
      case 'moderate': return 'medium'
      case 'minor': return 'low'
      default: return 'medium'
    }
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport() {
    const totalChecks = this.violations.length + this.warnings.length + this.passed.length
    const criticalViolations = this.violations.filter(v => v.severity === 'critical').length
    const highViolations = this.violations.filter(v => v.severity === 'high').length
    
    // Calculate compliance score
    const passedChecks = this.passed.length
    const complianceScore = totalChecks > 0 ? (passedChecks / totalChecks) : 0
    
    // Determine if compliant (no critical violations and score above threshold)
    const compliant = criticalViolations === 0 && 
                     highViolations === 0 && 
                     complianceScore >= this.complianceThreshold

    return {
      timestamp: new Date().toISOString(),
      compliant,
      complianceScore: Math.round(complianceScore * 100) / 100,
      threshold: this.complianceThreshold,
      summary: {
        totalChecks,
        passed: this.passed.length,
        violations: this.violations.length,
        warnings: this.warnings.length,
        criticalViolations,
        highViolations
      },
      violations: this.violations,
      warnings: this.warnings,
      passed: this.passed,
      wcagCompliance: {
        'wcag2a': this.checkWcagCompliance('wcag2a'),
        'wcag2aa': this.checkWcagCompliance('wcag2aa'),
        'wcag21aa': this.checkWcagCompliance('wcag21aa')
      }
    }
  }

  /**
   * Check WCAG compliance for specific level
   */
  checkWcagCompliance(level) {
    const relevantViolations = this.violations.filter(v => 
      v.wcagTags && v.wcagTags.includes(level)
    )
    
    return {
      compliant: relevantViolations.length === 0,
      violations: relevantViolations.length,
      details: relevantViolations
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new AccessibilityComplianceValidator()
  validator.validateCompliance()
}

module.exports = AccessibilityComplianceValidator
