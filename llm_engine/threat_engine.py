import re
import uuid

# Sensitivity weights for file types / paths
SENSITIVITY_MATRIX = {
    r"\.env$": 80,
    r"payroll": 70,
    r"db_config": 90,
    r"id_rsa|private": 95,
    r"shadow|passwd": 85,
    r"\.csv$|\.json$": 40,
    r"\.txt$|\.log$": 15
}

class ThreatEngine:
    def __init__(self):
        self.session_scores = {}

    def calculate_risk(self, session_id: str, path: str) -> dict:
        base_score = 10
        for pattern, weight in SENSITIVITY_MATRIX.items():
            if re.search(pattern, path, re.IGNORECASE):
                base_score = max(base_score, weight)

        current_score = self.session_scores.get(session_id, 0) + base_score
        self.session_scores[session_id] = current_score

        # Determine threat level classification
        if current_score >= 150:
            level = "CRITICAL"
        elif current_score >= 80:
            level = "HIGH"
        elif current_score >= 40:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "path_risk": base_score,
            "cumulative_score": current_score,
            "threat_level": level
        }

    def inject_canary(self, content: str, path: str) -> str:
        """Injects realistic, uniquely traceable decoy credentials into content."""
        token_id = str(uuid.uuid4())[:8]
        
        if "db_config" in path or ".env" in path:
            canary = (
                f"\n# CANARY_TOKEN_{token_id}\n"
                f"AWS_ACCESS_KEY_ID=AKIA{token_id.upper()}PHANTOM\n"
                f"AWS_SECRET_ACCESS_KEY=phantom_sec_{token_id}x99aB012\n"
                f"DATABASE_URL=postgresql://admin:P@ssword_{token_id}@10.0.4.15:5432/infotact_prod\n"
            )
            return content + canary
        elif path.endswith(".csv"):
            canary_line = f"CanaryUser_{token_id},EMP_{token_id},System Admin,150000,2026-01-01"
            return content.strip() + f"\n{canary_line}\n"
            
        return content
