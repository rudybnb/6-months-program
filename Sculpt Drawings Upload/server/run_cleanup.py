
import os
import shutil
import subprocess
import sys

# 1. Clean File System (C:/Brudys/job_data)
SHARED_DATA_ROOT = "C:/Brudys/job_data"

def clean_files():
    print(f"[CLEAN] Cleaning File System: {SHARED_DATA_ROOT}...")
    if os.path.exists(SHARED_DATA_ROOT):
        try:
            # Delete contents but keep root
            for item in os.listdir(SHARED_DATA_ROOT):
                path = os.path.join(SHARED_DATA_ROOT, item)
                if os.path.isdir(path):
                    shutil.rmtree(path)
                else:
                    os.remove(path)
            print("[OK] File System Cleaned.")
        except Exception as e:
            print(f"[ERROR] File System Cleanup Failed: {e}")
    else:
        print("[INFO] Shared folder not found, skipping.")

# 2. Clean Database (via Job Tracker Script)
JOB_TRACKER_DIR = r"c:\Users\rudyb\Sculpt Job Tracker\temp_app"
CLEANUP_SCRIPT = "server/scripts/cleanup_system.ts"

def clean_db():
    print(f"[CLEAN] Cleaning Database via Job Tracker...")
    
    # We need to run npx tsx inside the Job Tracker directory
    cmd = ["npx", "tsx", CLEANUP_SCRIPT]
    
    try:
        # Check if node_modules exist there? Assuming yes from previous steps
        result = subprocess.run(cmd, cwd=JOB_TRACKER_DIR, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(result.stdout)
            print("[OK] Database Cleanup Complete.")
        else:
            print("[ERROR] Database Cleanup Failed:")
            print(result.stderr)
            
    except Exception as e:
         print(f"[ERROR] Failed to execute DB cleanup script: {e}")

if __name__ == "__main__":
    clean_files()
    clean_db()
