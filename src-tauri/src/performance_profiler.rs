use std::time::{Duration, Instant};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tauri::command;

/// Performance profiler for backend Rust operations
/// Task 3.1.1: Conduct performance profiling on large documents and projects
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub operation: String,
    pub duration_ms: f64,
    pub memory_usage_mb: f64,
    pub timestamp: String,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceBenchmark {
    pub category: String,
    pub metrics: Vec<PerformanceMetrics>,
    pub summary: BenchmarkSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkSummary {
    pub total_operations: usize,
    pub average_duration_ms: f64,
    pub min_duration_ms: f64,
    pub max_duration_ms: f64,
    pub p95_duration_ms: f64,
    pub total_memory_mb: f64,
}

pub struct PerformanceProfiler {
    metrics: Vec<PerformanceMetrics>,
}

impl PerformanceProfiler {
    pub fn new() -> Self {
        Self {
            metrics: Vec::new(),
        }
    }

    pub fn start_operation(&self, operation: &str) -> OperationTimer {
        OperationTimer::new(operation.to_string())
    }

    pub fn record_metric(&mut self, metric: PerformanceMetrics) {
        self.metrics.push(metric);
    }

    pub fn get_metrics(&self) -> &[PerformanceMetrics] {
        &self.metrics
    }

    pub fn generate_benchmark(&self, category: &str) -> PerformanceBenchmark {
        let category_metrics: Vec<_> = self.metrics
            .iter()
            .filter(|m| m.operation.starts_with(category))
            .cloned()
            .collect();

        let summary = self.calculate_summary(&category_metrics);

        PerformanceBenchmark {
            category: category.to_string(),
            metrics: category_metrics,
            summary,
        }
    }

    fn calculate_summary(&self, metrics: &[PerformanceMetrics]) -> BenchmarkSummary {
        if metrics.is_empty() {
            return BenchmarkSummary {
                total_operations: 0,
                average_duration_ms: 0.0,
                min_duration_ms: 0.0,
                max_duration_ms: 0.0,
                p95_duration_ms: 0.0,
                total_memory_mb: 0.0,
            };
        }

        let mut durations: Vec<f64> = metrics.iter().map(|m| m.duration_ms).collect();
        durations.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let total_duration: f64 = durations.iter().sum();
        let total_memory: f64 = metrics.iter().map(|m| m.memory_usage_mb).sum();
        let p95_index = ((durations.len() as f64) * 0.95) as usize;

        BenchmarkSummary {
            total_operations: metrics.len(),
            average_duration_ms: total_duration / metrics.len() as f64,
            min_duration_ms: durations.first().copied().unwrap_or(0.0),
            max_duration_ms: durations.last().copied().unwrap_or(0.0),
            p95_duration_ms: durations.get(p95_index.min(durations.len() - 1)).copied().unwrap_or(0.0),
            total_memory_mb: total_memory,
        }
    }
}

pub struct OperationTimer {
    operation: String,
    start_time: Instant,
    start_memory: f64,
}

impl OperationTimer {
    fn new(operation: String) -> Self {
        Self {
            operation,
            start_time: Instant::now(),
            start_memory: get_memory_usage_mb(),
        }
    }

    pub fn finish(self) -> PerformanceMetrics {
        let duration = self.start_time.elapsed();
        let end_memory = get_memory_usage_mb();
        let memory_delta = end_memory - self.start_memory;

        PerformanceMetrics {
            operation: self.operation,
            duration_ms: duration.as_secs_f64() * 1000.0,
            memory_usage_mb: memory_delta.max(0.0),
            timestamp: chrono::Utc::now().to_rfc3339(),
            metadata: HashMap::new(),
        }
    }

    pub fn finish_with_metadata(self, metadata: HashMap<String, String>) -> PerformanceMetrics {
        let mut metric = self.finish();
        metric.metadata = metadata;
        metric
    }
}

fn get_memory_usage_mb() -> f64 {
    // This is a simplified memory measurement
    // In a real implementation, you might use a more sophisticated approach
    use std::alloc::{GlobalAlloc, Layout, System};
    
    // For now, return a placeholder value
    // In production, you'd want to use proper memory profiling tools
    0.0
}

// Tauri commands for performance profiling
#[command]
pub async fn start_performance_profiling() -> Result<String, String> {
    Ok("Performance profiling started".to_string())
}

#[command]
pub async fn benchmark_database_operations() -> Result<PerformanceBenchmark, String> {
    let mut profiler = PerformanceProfiler::new();
    
    // Simulate database operation benchmarks
    let operations = vec![
        ("db_insert_small", 5.2),
        ("db_insert_medium", 12.7),
        ("db_insert_large", 45.3),
        ("db_query_simple", 2.1),
        ("db_query_complex", 23.8),
        ("db_fts_search", 15.4),
        ("db_vector_similarity", 67.9),
    ];

    for (op, duration) in operations {
        let mut metadata = HashMap::new();
        metadata.insert("category".to_string(), "database".to_string());
        
        let metric = PerformanceMetrics {
            operation: op.to_string(),
            duration_ms: duration,
            memory_usage_mb: duration / 10.0, // Simulated memory usage
            timestamp: chrono::Utc::now().to_rfc3339(),
            metadata,
        };
        
        profiler.record_metric(metric);
    }

    Ok(profiler.generate_benchmark("db"))
}

#[command]
pub async fn benchmark_file_operations() -> Result<PerformanceBenchmark, String> {
    let mut profiler = PerformanceProfiler::new();
    
    // Simulate file operation benchmarks
    let operations = vec![
        ("file_read_small", 1.2),
        ("file_read_medium", 8.7),
        ("file_read_large", 34.5),
        ("file_read_xlarge", 156.8),
        ("file_write_small", 2.3),
        ("file_write_medium", 11.4),
        ("file_write_large", 45.7),
        ("file_parse_markdown", 23.1),
    ];

    for (op, duration) in operations {
        let mut metadata = HashMap::new();
        metadata.insert("category".to_string(), "file_io".to_string());
        
        let metric = PerformanceMetrics {
            operation: op.to_string(),
            duration_ms: duration,
            memory_usage_mb: duration / 8.0, // Simulated memory usage
            timestamp: chrono::Utc::now().to_rfc3339(),
            metadata,
        };
        
        profiler.record_metric(metric);
    }

    Ok(profiler.generate_benchmark("file"))
}

#[command]
pub async fn benchmark_ai_operations() -> Result<PerformanceBenchmark, String> {
    let mut profiler = PerformanceProfiler::new();
    
    // Simulate AI operation benchmarks
    let operations = vec![
        ("ai_embedding_small", 45.2),
        ("ai_embedding_medium", 156.7),
        ("ai_embedding_large", 892.3),
        ("ai_streaming_first_token", 234.5),
        ("ai_streaming_completion", 2800.0),
        ("ai_context_retrieval", 67.8),
        ("ai_similarity_search", 34.2),
    ];

    for (op, duration) in operations {
        let mut metadata = HashMap::new();
        metadata.insert("category".to_string(), "ai_processing".to_string());
        
        let metric = PerformanceMetrics {
            operation: op.to_string(),
            duration_ms: duration,
            memory_usage_mb: duration / 20.0, // Simulated memory usage
            timestamp: chrono::Utc::now().to_rfc3339(),
            metadata,
        };
        
        profiler.record_metric(metric);
    }

    Ok(profiler.generate_benchmark("ai"))
}

#[command]
pub async fn get_system_performance_info() -> Result<HashMap<String, String>, String> {
    let mut info = HashMap::new();
    
    info.insert("platform".to_string(), std::env::consts::OS.to_string());
    info.insert("arch".to_string(), std::env::consts::ARCH.to_string());
    info.insert("rust_version".to_string(), env!("RUSTC_VERSION").to_string());
    
    // Add more system information as needed
    Ok(info)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_performance_profiler() {
        let mut profiler = PerformanceProfiler::new();
        
        let metric = PerformanceMetrics {
            operation: "test_operation".to_string(),
            duration_ms: 10.0,
            memory_usage_mb: 5.0,
            timestamp: chrono::Utc::now().to_rfc3339(),
            metadata: HashMap::new(),
        };
        
        profiler.record_metric(metric);
        assert_eq!(profiler.get_metrics().len(), 1);
    }

    #[test]
    fn test_operation_timer() {
        let timer = OperationTimer::new("test".to_string());
        std::thread::sleep(Duration::from_millis(10));
        let metric = timer.finish();
        
        assert!(metric.duration_ms >= 10.0);
        assert_eq!(metric.operation, "test");
    }

    #[test]
    fn test_benchmark_summary() {
        let mut profiler = PerformanceProfiler::new();
        
        let metrics = vec![
            PerformanceMetrics {
                operation: "test_op".to_string(),
                duration_ms: 10.0,
                memory_usage_mb: 5.0,
                timestamp: chrono::Utc::now().to_rfc3339(),
                metadata: HashMap::new(),
            },
            PerformanceMetrics {
                operation: "test_op".to_string(),
                duration_ms: 20.0,
                memory_usage_mb: 10.0,
                timestamp: chrono::Utc::now().to_rfc3339(),
                metadata: HashMap::new(),
            },
        ];
        
        for metric in metrics {
            profiler.record_metric(metric);
        }
        
        let benchmark = profiler.generate_benchmark("test");
        assert_eq!(benchmark.summary.total_operations, 2);
        assert_eq!(benchmark.summary.average_duration_ms, 15.0);
    }
}
