"""Local CLI helper for the public HTTP API; no local engine or DB dependency."""
import json
import sys
from urllib.request import Request, urlopen


def run_optimization(payload):
    if payload.get("save_db"):
        return {"error": "Public helper does not persist designs"}
    methods=payload.get("methods",["profile"])
    results={}
    for method in methods:
        body={"sequence":payload.get("sequence",""),"profile":payload.get("profile","balanced"),"host":payload.get("host","nbenthamiana"),"mode":"slm" if method in {"lm","slm"} else "profile"}
        if method=="dp": body["objective"]="feasibility_best"
        elif method in {"dp_v2_1","dp_v2_1_1"}: body["objective"]=method
        request=Request("https://factorforge.eijex.com/api/optimize",data=json.dumps(body).encode(),headers={"Content-Type":"application/json"})
        try:
            with urlopen(request,timeout=60) as response: results[method]=json.load(response)
        except Exception:
            results[method]={"error":"FactorForge HTTP request failed"}
    return {"results":results,"persistence":"disabled"}

if __name__=="__main__":
    try: print(json.dumps(run_optimization(json.load(sys.stdin))))
    except Exception: print(json.dumps({"error":"Invalid request"}))
