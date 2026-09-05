import sys
import json
import logging
import os
from typing import Dict, Any

# Disable noisy logging
logging.getLogger().setLevel(logging.CRITICAL)

# Ensure factorforge is in path if running from here
sys.path.insert(0, r"C:\Work\eijex\factorforge\src")

try:
    from factorforge.engines.profile.optimizer import RuleBasedOptimizer
    from factorforge.engines.dp_adapter import DPEngineAdapter
    from factorforge.engines.lm.inference import LMEngineAdapter, ONNXBeamSearchEngine
    from factorforge.evaluation.evaluator import SharedEvaluator
    from factorforge.db.connector import FactorForgeDBConnector
except ImportError as e:
    print(json.dumps({"error": f"Failed to import factorforge: {e}"}))
    sys.exit(1)

def run_optimization(payload: dict) -> dict:
    sequence = payload.get("sequence", "").upper()
    profile = payload.get("profile", "balanced")
    mode = payload.get("mode", "single")
    methods = payload.get("methods", ["profile"])
    host = payload.get("host", "nbenthamiana")
    save_db = payload.get("save_db", False)
    
    if not sequence:
        return {"error": "sequence is required"}

    results = {}
    metrics_summary = {}

    for method in methods:
        try:
            if method == "profile":
                engine = RuleBasedOptimizer()
            elif method == "dp":
                engine = DPEngineAdapter()
            elif method == "lm":
                # Check if ONNX model path is provided via env var for Milestone 5
                onnx_path = os.environ.get("FACTORFORGE_ONNX_MODEL_PATH")
                engine = LMEngineAdapter(onnx_path=onnx_path)
            else:
                continue

            res = engine.optimize(sequence, profile=profile, host=host)
            
            cai = res.metrics.get("cai", 0.0)
            gc = res.metrics.get("gc_percent", 0.0)
            if gc == 0.0:  # Check legacy fallback
                gc = res.metrics.get("gc_content", 0.0)

            # Milestone 8: DB Provenance
            run_id = None
            if save_db:
                try:
                    connector = FactorForgeDBConnector()
                    run_metadata = {
                        "execution_origin": "mcp_agent",
                        "actual_engine_name": method,
                        "actual_profile_name": profile,
                        "generation_performed": True,
                        "analysis_mode": "full",
                        "evidence_level": "prospective_factorforge",
                        "runner_entrypoint": "eijex-mcp.local_agent"
                    }
                    candidate_data = {
                        "optimized_sequence": res.sequence,
                        "cai": float(cai) if cai else None,
                        "gc_percent": float(gc) if gc else None,
                        "computational_status": "passed" if res.metadata.get("validator_passed", False) else "rejected"
                    }
                    
                    check_results = []
                    report = res.metadata.get("evaluation_report", {})
                    for chk in report.get("checks", []):
                        check_results.append({
                            "check_domain": chk.get("domain", "unknown"),
                            "result": "PASS" if chk.get("result") == "pass" else ("WARN" if chk.get("result") == "warning" else "FAIL"),
                            "observed_value": None,
                            "details_json": {"message": chk.get("message")}
                        })
                    
                    run_id = connector.save_computational_provenance(run_metadata, candidate_data, check_results)
                except Exception as db_e:
                    run_id = f"db_error: {str(db_e)}"
            
            results[method] = {
                "sequence": res.sequence,
                "metrics": {
                    "cai": float(cai) if cai else None,
                    "gc_percent": float(gc) if gc else None,
                },
                "provenance": res.metadata,
                "db_run_id": run_id
            }
            metrics_summary[f"{method}_cai"] = float(cai) if cai else None
            metrics_summary[f"{method}_gc"] = float(gc) if gc else None
            
        except Exception as e:
            results[method] = {"error": str(e)}

    return {
        "engine": "local_mcp_bridge",
        "profile": profile,
        "mode": mode,
        "results": results,
        "comparison": metrics_summary if mode == "compare" else None
    }

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        payload = json.loads(input_data)
        out = run_optimization(payload)
        print(json.dumps(out, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
