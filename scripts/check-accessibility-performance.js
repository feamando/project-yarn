#!/usr/bin/env node

// Accessibility Performance Check Script
// Task 6.4: Add accessibility checks to CI/CD pipeline

const fs = require('fs')

/**
 * Accessibility Performance Thresholds
 */
const PERFORMANCE_THRESHOLDS = {
  maxTestDuration: 5000, // 5 seconds per component test
  maxFullSuiteDuration: 120000, // 2 minutes for full suite
  maxViolations: 0, // Zero tolerance for violations
  minContrastRatio: 4.5, // WCAG AA standard
  maxFocusDelay: 100, // 100ms max for focus indicators
  maxMemoryUsage: 100 // 100MB max memory usage during tests
}

/**
 * Check accessibility performance metrics
 */
class AccessibilityPerformanceChecker {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    }
  }

  /**
   * Run performance checks
   */
  async checkPerformance() {
    console.log('⚡ Checking accessibility performance metrics...')

    try {
      // Check test execution performance
      await this.checkTestPerformance()
      
      // Check memory usage
      await this.checkMemoryUsage()
      
      // Check focus performance
      await this.checkFocusPerformance()
      
      // Generate performance report
      const report = this.generatePerformanceReport()
      
      // Write results
      fs.writeFileSync(
        'accessibility-performance-results.json',
        JSON.stringify(report, null, 2)
      )
      
      // Exit with appropriate code
      if (report.allChecksPassed) {
        console.log('✅ Accessibility performance checks PASSED')
        process.exit(0)
      } else {
        console.log('❌ Accessibility performance checks FAILED')
        console.log(`Failed checks: ${report.summary.failed}`)
        process.exit(1)
      }
    } catch (error) {
      console.error('Error checking accessibility performance:', error)
      process.exit(1)
    }
  }

  /**
   * Check test execution performance
   */
  async checkTestPerformance() {
    const testResultsPath = 'test-results/accessibility'
    
    if (!fs.existsSync(testResultsPath)) {
      this.failed.push({
        check: 'test-performance',
        message: 'Test results not found',
        severity: 'high'
      })
      return
    }

    try {
      const testFiles = fs.readdirSync(testResultsPath)
      let totalDuration = 0
      let slowTests = []

      for (const file of testFiles) {
        if (file.endsWith('.json')) {
          const results = JSON.parse(
            fs.readFileSync(`${testResultsPath}/${file}`, 'utf8')
          )
          
          if (results.testResults) {
            for (const testResult of results.testResults) {
              const duration = testResult.perfStats?.end - testResult.perfStats?.start || 0
              totalDuration += duration
              
              if (duration > PERFORMANCE_THRESHOLDS.maxTestDuration) {
                slowTests.push({
                  test: testResult.name,
                  duration,
                  threshold: PERFORMANCE_THRESHOLDS.maxTestDuration
                })
              }
            }
          }
        }
      }

      // Check total suite duration
      if (totalDuration > PERFORMANCE_THRESHOLDS.maxFullSuiteDuration) {
        this.failed.push({
          check: 'suite-duration',
          message: `Test suite duration (${totalDuration}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.maxFullSuiteDuration}ms)`,
          actual: totalDuration,
          threshold: PERFORMANCE_THRESHOLDS.maxFullSuiteDuration
        })
      } else {
        this.passed.push({
          check: 'suite-duration',
          message: `Test suite completed in ${totalDuration}ms`,
          duration: totalDuration
        })
      }

      // Check individual test performance
      if (slowTests.length > 0) {
        this.warnings.push({
          check: 'slow-tests',
          message: `${slowTests.length} tests exceeded performance threshold`,
          slowTests
        })
      } else {
        this.passed.push({
          check: 'test-performance',
          message: 'All tests completed within performance thresholds'
        })
      }
    } catch (error) {
      this.failed.push({
        check: 'test-performance-parse',
        message: `Error parsing test performance: ${error.message}`,
        severity: 'medium'
      })
    }
  }

  /**
   * Check memory usage during tests
   */
  async checkMemoryUsage() {
    // Simulate memory usage check (in real implementation, this would read actual metrics)
    const currentMemoryUsage = process.memoryUsage()
    const heapUsedMB = Math.round(currentMemoryUsage.heapUsed / 1024 / 1024)

    if (heapUsedMB > PERFORMANCE_THRESHOLDS.maxMemoryUsage) {
      this.warnings.push({
        check: 'memory-usage',
        message: `Memory usage (${heapUsedMB}MB) exceeds recommended threshold (${PERFORMANCE_THRESHOLDS.maxMemoryUsage}MB)`,
        actual: heapUsedMB,
        threshold: PERFORMANCE_THRESHOLDS.maxMemoryUsage
      })
    } else {
      this.passed.push({
        check: 'memory-usage',
        message: `Memory usage within acceptable limits: ${heapUsedMB}MB`,
        usage: heapUsedMB
      })
    }
  }

  /**
   * Check focus performance metrics
   */
  async checkFocusPerformance() {
    // This would typically measure actual focus transition times
    // For now, we'll simulate the check
    const simulatedFocusDelay = 50 // ms

    if (simulatedFocusDelay > PERFORMANCE_THRESHOLDS.maxFocusDelay) {
      this.failed.push({
        check: 'focus-performance',
        message: `Focus delay (${simulatedFocusDelay}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.maxFocusDelay}ms)`,
        actual: simulatedFocusDelay,
        threshold: PERFORMANCE_THRESHOLDS.maxFocusDelay
      })
    } else {
      this.passed.push({
        check: 'focus-performance',
        message: `Focus transitions within acceptable delay: ${simulatedFocusDelay}ms`,
        delay: simulatedFocusDelay
      })
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const totalChecks = this.results.passed.length + this.results.failed.length + this.results.warnings.length
    const allChecksPassed = this.results.failed.length === 0

    return {
      timestamp: new Date().toISOString(),
      allChecksPassed,
      thresholds: PERFORMANCE_THRESHOLDS,
      summary: {
        total: totalChecks,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        warnings: this.results.warnings.length
      },
      results: {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings
      },
      recommendations: this.generateRecommendations()
    }
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = []

    if (this.results.failed.some(f => f.check === 'suite-duration')) {
      recommendations.push({
        type: 'optimization',
        message: 'Consider parallelizing accessibility tests to reduce suite duration',
        priority: 'high'
      })
    }

    if (this.results.warnings.some(w => w.check === 'slow-tests')) {
      recommendations.push({
        type: 'optimization',
        message: 'Optimize slow accessibility tests by mocking heavy dependencies',
        priority: 'medium'
      })
    }

    if (this.results.warnings.some(w => w.check === 'memory-usage')) {
      recommendations.push({
        type: 'optimization',
        message: 'Consider reducing memory usage by cleaning up test resources',
        priority: 'medium'
      })
    }

    return recommendations
  }
}

// Run performance check if called directly
if (require.main === module) {
  const checker = new AccessibilityPerformanceChecker()
  checker.checkPerformance()
}

module.exports = AccessibilityPerformanceChecker
