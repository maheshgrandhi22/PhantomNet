import os

def generate_honeypot_file(path):
    """Generates realistic decoy content for honeypot file paths."""
    if path.endswith('.env'):
        return (
            "# Auto-generated environment configuration\n"
            "DB_HOST=10.0.4.12\n"
            "DB_USER=phantom_admin\n"
            "DB_PASS=P@ssw0rd2026!_Secure\n"
            "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\n"
            "JWT_SECRET=super_secret_phantom_jwt_token_key_99\n"
        )
    elif 'aws' in path:
        return (
            "[default]\n"
            "aws_access_key_id = AKIAIOSFODNN7EXAMPLE\n"
            "aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\n"
            "region = us-east-1\n"
        )
    elif 'id_rsa' in path:
        return (
            "-----BEGIN OPENSSH PRIVATE KEY-----\n"
            "b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\n"
            "QyNTUxOQAAACCEV35d4kP1v9zK5q...PHANTOM_KEY_DECOY...\n"
            "-----END OPENSSH PRIVATE KEY-----\n"
        )
    elif 'passwd' in path:
        return (
            "root:x:0:0:root:/root:/bin/bash\n"
            "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n"
            "phantom:x:1000:1000:Phantom User:/home/phantom:/bin/bash\n"
        )
    elif 'shadow' in path:
        return (
            "root:$6$v19a4$decoy_hash_phantomnet_2026:19850:0:99999:7:::\n"
            "phantom:$6$k88z1$decoy_hash_user_2026:19850:0:99999:7:::\n"
        )
    elif 'config.php' in path:
        return (
            "<?php\n"
            "$db_host = 'localhost';\n"
            "$db_user = 'root';\n"
            "$db_pass = 'DB_Ph4nt0m_R00t_S3cr3t!';\n"
            "$db_name = 'production_db';\n"
            "?>\n"
        )
    else:
        return f"# System Decoy Log\n# Timestamp: 2026-08-26\nPath accessed: {path}\n"
