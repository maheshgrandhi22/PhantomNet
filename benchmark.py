import os
import time
from tabulate import tabulate

MOUNT_POINT = "/tmp/phantom_mount"

TARGET_PATHS = [
    "/root/.aws/credentials",
    "/root/.ssh/id_rsa",
    "/root/.env",
    "/etc/passwd",
    "/etc/shadow",
    "/etc/hosts",
    "/var/www/html/config.php",
    "/var/log/syslog"
]

def measure_read(full_path):
    start = time.perf_counter()
    try:
        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            data = f.read()
            size = len(data)
            success = True
    except Exception as e:
        size = 0
        success = False
    end = time.perf_counter()
    duration_ms = (end - start) * 1000
    return duration_ms, size, success

def run_benchmark():
    print("=" * 70)
    print("🚀 PhantomNet Honeypot Performance Benchmark")
    print("=" * 70)
    
    results = []
    miss_times = []
    hit_times = []

    for relative_path in TARGET_PATHS:
        full_path = os.path.join(MOUNT_POINT, relative_path.lstrip("/"))
        
        # 1. First Read: Cache Miss (LLM Generation)
        time_miss, size_miss, ok_miss = measure_read(full_path)
        miss_times.append(time_miss)
        
        # Short pause between operations
        time.sleep(0.1)
        
        # 2. Second Read: Cache Hit (RAM Retrieval)
        time_hit, size_hit, ok_hit = measure_read(full_path)
        hit_times.append(time_hit)
        
        # Calculate speedup ratio
        speedup = (time_miss / time_hit) if time_hit > 0 else 0
        status = "OK" if ok_miss and ok_hit else "ERR"

        results.append([
            relative_path,
            f"{time_miss:.2f} ms",
            f"{time_hit:.2f} ms",
            f"{speedup:.1f}x",
            f"{size_hit} B",
            status
        ])

    headers = ["Path", "Cache Miss (LLM)", "Cache Hit (RAM)", "Speedup", "Size", "Status"]
    print(tabulate(results, headers=headers, tablefmt="github"))
    
    avg_miss = sum(miss_times) / len(miss_times)
    avg_hit = sum(hit_times) / len(hit_times)
    overall_speedup = avg_miss / avg_hit if avg_hit > 0 else 0
    
    print("\n" + "=" * 70)
    print(f"📊 Summary Statistics:")
    print(f"  - Total Paths Tested : {len(TARGET_PATHS)}")
    print(f"  - Average Generation : {avg_miss:.2f} ms (~{avg_miss/1000:.2f}s)")
    print(f"  - Average Cache Hit  : {avg_hit:.2f} ms")
    print(f"  - Overall Speedup    : {overall_speedup:.1f}x faster on cached hits")
    print("=" * 70)

if __name__ == "__main__":
    run_benchmark()
